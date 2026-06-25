import asyncio
import json
import logging
import re

import db
from config import settings
from agents.atencion_cliente import atencion_cliente

logger = logging.getLogger(__name__)

_PIPELINE_TIMEOUT = 55  # under Traefik's 60s default

# In-memory conversation history: session_id → [(user_msg, assistant_msg), ...]
_sessions: dict[str, list[tuple[str, str]]] = {}
_MAX_HISTORY_TURNS = 8


async def run(user_message: str, session_id: str | None = None) -> str:
    sid = session_id or "default"
    try:
        return await asyncio.wait_for(_run(user_message, sid), timeout=_PIPELINE_TIMEOUT)
    except asyncio.TimeoutError:
        logger.error("Pipeline timed out after %ss", _PIPELINE_TIMEOUT)
        return settings.fallback_message
    except BaseException as exc:
        logger.error("Pipeline error: %s", exc, exc_info=True)
        return settings.fallback_message


async def _run(user_message: str, session_id: str) -> str:
    history = _sessions.get(session_id, [])
    prompt = _build_prompt(user_message, history)

    logger.info("Pipeline — atencion_cliente [session=%s history=%d]", session_id, len(history))
    response = await atencion_cliente.arun(prompt)
    draft = response.content or ""
    logger.info("Draft[:100]: %s", draft[:100])

    if not draft:
        return settings.fallback_message

    # Save exchange to session history
    turns = _sessions.setdefault(session_id, [])
    turns.append((user_message, draft))
    if len(turns) > _MAX_HISTORY_TURNS:
        turns.pop(0)

    # Best-effort lead capture from the conversation
    _try_capture_lead(user_message, history, draft)

    return draft


def _build_prompt(user_message: str, history: list[tuple[str, str]]) -> str:
    parts: list[str] = []

    if history:
        parts.append("=== Historial de la conversación ===")
        for user_msg, assistant_msg in history:
            parts.append(f"Cliente: {user_msg}")
            parts.append(f"Vos: {assistant_msg}")
        parts.append("=== Fin del historial ===\n")

    parts.append(f"Nuevo mensaje del cliente: {user_message}")
    return "\n".join(parts)


def _try_capture_lead(user_message: str, history: list[tuple[str, str]], draft: str) -> None:
    """Extract destination from conversation and save lead. Best-effort, never throws."""
    try:
        full_convo = " ".join(
            f"{u} {a}" for u, a in history
        ) + f" {user_message}"

        destination = _extract_destination(full_convo)
        if not destination:
            return

        pasajeros = _extract_number(r"(\d+)\s*(?:persona|pasajero|pax|viajero)", full_convo)
        nombre = _extract_nombre(full_convo)

        db.lead_create(
            destino=destination,
            nombre=nombre or "Cliente potencial",
            pasajeros=pasajeros,
            resumen=f"Interés en {destination}. Consulta: {user_message[:100]}",
        )
        logger.info("Lead captured: destino=%s", destination)
    except Exception as exc:
        logger.debug("Lead capture skipped: %s", exc)


# ── Simple extractors (no LLM) ────────────────────────────────────────────────

_DESTINOS = re.compile(
    r"\b(miami|cancún|cancun|madrid|barcelona|roma|paris|paris|londres|london|"
    r"new york|nueva york|dubai|punta cana|riviera maya|caribe|"
    r"mar del plata|bariloche|mendoza|córdoba|cordoba|buenos aires|"
    r"río de janeiro|rio de janeiro|san pablo|são paulo|brasil|brazil|"
    r"europa|usa|estados unidos|mexico|méxico|chile|uruguay|perú|peru|"
    r"colombia|costa rica|panama|panamá|cuba|caribe)\b",
    re.IGNORECASE,
)

def _extract_destination(text: str) -> str | None:
    m = _DESTINOS.search(text)
    return m.group(0).title() if m else None


def _extract_number(pattern: str, text: str) -> int | None:
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            pass
    return None


def _extract_nombre(text: str) -> str | None:
    m = re.search(r"\bme llamo\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)", text, re.IGNORECASE)
    if m:
        return m.group(1)
    m = re.search(r"\bsoy\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?!\s+de\b)", text, re.IGNORECASE)
    if m:
        return m.group(1)
    return None
