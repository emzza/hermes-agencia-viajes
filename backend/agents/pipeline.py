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

_PIPELINE_TIMEOUT = 60


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
    inv = investigador_factory.create(hermes_mcp.get())
    research_response = await inv.arun(user_message)
    raw_data = research_response.content or ""
    logger.debug("Investigador raw output: %s", raw_data[:200])

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
    draft_response = await atencion_cliente.arun(redactor_prompt)
    draft = draft_response.content or ""
    logger.debug("Redactor draft: %s", draft[:200])

    passed, reason = await juez_evaluate(user_message, draft)
    if passed:
        return draft

    logger.warning("DeepEval judge rejected response: %s", reason)
    return settings.fallback_message


def _auto_capture_lead(user_message: str, data: dict) -> None:
    destination = data.get("destination")
    if not destination:
        return
    try:
        total_usd = _parse_price(data.get("estimated_price"))
        db.lead_create(
            destino=destination,
            nombre="Cliente potencial",
            origen=data.get("origin") or None,
            fecha_inicio=data.get("travel_dates") or None,
            resumen=f"Interés en {destination}. Consulta: {user_message[:120]}",
            total_usd=total_usd,
        )
        logger.info("Lead auto-captured: destino=%s", destination)
    except Exception as exc:
        logger.warning("Auto lead capture failed: %s", exc)


def _parse_price(raw: object) -> float | None:
    if raw is None:
        return None
    numbers = re.findall(r"[\d]+(?:[.,]\d+)?", str(raw).replace(",", ""))
    if numbers:
        try:
            return float(numbers[0])
        except ValueError:
            pass
    return None
