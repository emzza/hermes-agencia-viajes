import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path("/app/data/hermes.db")


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    with _conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id                TEXT PRIMARY KEY,
                conversation_id   TEXT,
                nombre            TEXT NOT NULL DEFAULT 'Cliente potencial',
                telefono          TEXT,
                origen            TEXT,
                destino           TEXT NOT NULL,
                fecha_inicio      TEXT,
                noches            INTEGER,
                pasajeros         INTEGER,
                tipo_viaje        TEXT,
                resumen           TEXT,
                precio_base_usd   REAL,
                gastos_admin_pct  REAL,
                gastos_admin_usd  REAL,
                total_usd         REAL,
                status            TEXT NOT NULL DEFAULT 'draft',
                created_at        TEXT NOT NULL,
                updated_at        TEXT NOT NULL
            )
        """)


# ─── Leads ────────────────────────────────────────────────────────────────────

def lead_create(
    destino: str,
    nombre: str = "Cliente potencial",
    telefono: str | None = None,
    conversation_id: str | None = None,
    origen: str | None = None,
    fecha_inicio: str | None = None,
    noches: int | None = None,
    pasajeros: int | None = None,
    tipo_viaje: str | None = None,
    resumen: str | None = None,
    precio_base_usd: float | None = None,
    gastos_admin_pct: float | None = None,
    gastos_admin_usd: float | None = None,
    total_usd: float | None = None,
) -> dict:
    lead_id = uuid.uuid4().hex[:8]
    now = _now()
    with _conn() as conn:
        conn.execute(
            """
            INSERT INTO leads
              (id, conversation_id, nombre, telefono, origen, destino,
               fecha_inicio, noches, pasajeros, tipo_viaje, resumen,
               precio_base_usd, gastos_admin_pct, gastos_admin_usd, total_usd,
               status, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',?,?)
            """,
            (
                lead_id, conversation_id, nombre, telefono, origen, destino,
                fecha_inicio, noches, pasajeros, tipo_viaje, resumen,
                precio_base_usd, gastos_admin_pct, gastos_admin_usd, total_usd,
                now, now,
            ),
        )
    return lead_get(lead_id)  # type: ignore[return-value]


def lead_get(lead_id: str) -> dict | None:
    with _conn() as conn:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
        return dict(row) if row else None


def lead_list(status: str | None = None, limit: int = 200) -> list[dict]:
    with _conn() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC LIMIT ?",
                (status, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM leads ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]


def lead_update(lead_id: str, **kwargs) -> dict | None:
    if not kwargs:
        return lead_get(lead_id)
    kwargs["updated_at"] = _now()
    set_clause = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [lead_id]
    with _conn() as conn:
        conn.execute(f"UPDATE leads SET {set_clause} WHERE id = ?", values)
    return lead_get(lead_id)


def lead_delete(lead_id: str) -> None:
    with _conn() as conn:
        conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
