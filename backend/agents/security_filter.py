import re
from typing import Any


_BLOCKED_KEYS = {
    "cost", "net_cost", "costo_neto", "costo_bruto", "net_price",
    "commission", "comision", "comisión", "margin", "margen",
    "markup", "utilidad", "ganancia",
    "api_key", "api_response", "raw_response", "internal_id",
    "token", "secret", "password", "key",
    "proveedor_id", "supplier_id", "internal_code", "codigo_interno",
    "technical_name", "nombre_tecnico",
}

_BLOCKED_PATTERNS = [
    re.compile(r'\bsk-[A-Za-z0-9\-_]{20,}\b'),
    re.compile(r'\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b', re.IGNORECASE),
    re.compile(r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', re.IGNORECASE),
    re.compile(r'"(?:api_key|token|secret|password)"\s*:\s*"[^"]*"', re.IGNORECASE),
    re.compile(r'\$\d+(?:\.\d{2})?\s*(?:neto|comision|margen)', re.IGNORECASE),
]


def _sanitize_dict(data: dict) -> dict:
    result = {}
    for k, v in data.items():
        if k.lower() in _BLOCKED_KEYS:
            continue
        result[k] = _sanitize_value(v)
    return result


def _sanitize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return _sanitize_dict(value)
    if isinstance(value, list):
        return [_sanitize_value(item) for item in value]
    if isinstance(value, str):
        return _sanitize_string(value)
    return value


def _sanitize_string(text: str) -> str:
    for pattern in _BLOCKED_PATTERNS:
        text = pattern.sub("[REDACTED]", text)
    return text


def apply(data: dict | str) -> dict | str:
    if isinstance(data, str):
        return _sanitize_string(data)
    return _sanitize_dict(data)
