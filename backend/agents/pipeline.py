import asyncio
import json
import logging
import re

import db
from config import settings
from agents import hermes_mcp, security_filter
from agents import investigador as investigador_factory
from agents.atencion_cliente import atencion_cliente
from agents.juez import evaluate as juez_evaluate

logger = logging.getLogger(__name__)

_PIPELINE_TIMEOUT = 120


async def run(user_message: str, session_id: str | None = None) -> str:
    try:
        return await asyncio.wait_for(_run(user_message), timeout=_PIPELINE_TIMEOUT)
    except asyncio.TimeoutError:
        logger.error("Pipeline timed out after %ss", _PIPELINE_TIMEOUT)
        return settings.fallback_message
    except BaseException as exc:
        logger.error("Pipeline error: %s", exc, exc_info=True)
        return settings.fallback_message


async def _run(user_message: str) -> str:
    logger.info("Pipeline step 1 — investigador")
    inv = investigador_factory.create(hermes_mcp.get())
    research_response = await inv.arun(user_message)
    raw_data = research_response.content or ""
    logger.info("Investigador done. output[:100]: %s", raw_data[:100])

    filtered_str = raw_data
    try:
        parsed = json.loads(raw_data)
        filtered_data = security_filter.apply(parsed)
        filtered_str = json.dumps(filtered_data, ensure_ascii=False)
        _auto_capture_lead(user_message, filtered_data)
    except (json.JSONDecodeError, Exception) as exc:
        logger.debug("Could not parse investigador JSON: %s", exc)
        filtered_str = security_filter.apply(raw_data)

    redactor_prompt = (
        f"Mensaje del cliente: {user_message}\n\n"
        f"Información disponible: {filtered_str}"
    )
    logger.info("Pipeline step 2 — atencion_cliente")
    draft_response = await atencion_cliente.arun(redactor_prompt)
    draft = draft_response.content or ""
    logger.info("Redactor done. draft[:100]: %s", draft[:100])

    if not draft:
        logger.error("Empty draft from atencion_cliente")
        return settings.fallback_message

    logger.info("Pipeline step 3 — juez")
    try:
        passed, reason = await juez_evaluate(user_message, draft)
        if passed:
            logger.info("Juez passed")
            return draft
        logger.warning("Juez rejected (score reason: %s) — returning draft anyway", reason)
        return draft
    except Exception as exc:
        logger.warning("Juez failed (%s) — returning draft without validation", exc)
        return draft


def _auto_capture_lead(user_message: str, data: dict) -> None:
    destination = data.get("destination")
    if not destination:
        return

    nombre = data.get("nombre_cliente") or "Cliente potencial"
    telefono = data.get("telefono_cliente") or None
    pasajeros = data.get("pasajeros")
    tipo_viaje = data.get("tipo_viaje") or None
    origin = data.get("origin") or None
    travel_dates = data.get("travel_dates") or None
    presupuesto_cliente = data.get("presupuesto_cliente")

    total_usd = presupuesto_cliente or _parse_price(data.get("estimated_price"))

    resumen = f"Interés en {destination}"
    if tipo_viaje:
        resumen += f" ({tipo_viaje})"
    if pasajeros:
        resumen += f" — {pasajeros} pax"
    if travel_dates:
        resumen += f" — {travel_dates}"

    try:
        lead = db.lead_create(
            destino=destination,
            nombre=nombre,
            telefono=telefono,
            origen=origin,
            fecha_inicio=travel_dates,
            pasajeros=pasajeros,
            tipo_viaje=tipo_viaje,
            resumen=resumen,
            total_usd=total_usd,
        )
        logger.info("Lead auto-captured: id=%s destino=%s nombre=%s", lead["id"], destination, nombre)
    except Exception as exc:
        logger.warning("Auto lead capture failed: %s", exc)


def _parse_price(raw: object) -> float | None:
    if raw is None:
        return None
    numbers = re.findall(r"\d+(?:\.\d+)?", str(raw).replace(",", ""))
    if numbers:
        try:
            return float(numbers[0])
        except ValueError:
            pass
    return None
