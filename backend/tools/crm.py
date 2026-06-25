"""
CRM tools exposed to the atencion_cliente agent via Agno function calling.
The agent calls these to persist lead/budget data captured during conversation.
"""
import logging
import db

logger = logging.getLogger(__name__)


def save_lead(
    destino: str,
    nombre: str = "Cliente potencial",
    telefono: str | None = None,
    origen: str | None = None,
    fecha_inicio: str | None = None,
    noches: int | None = None,
    pasajeros: int | None = None,
    tipo_viaje: str | None = None,
    resumen: str | None = None,
    precio_base_usd: float | None = None,
    total_usd: float | None = None,
) -> str:
    """
    Guardá un lead (cliente interesado) en el CRM de la agencia.
    Llamá esta función SIEMPRE que un cliente muestre interés en un viaje.
    Parámetros mínimos requeridos: destino.
    Devuelve confirmación con el ID del lead generado.
    """
    try:
        gastos_admin_usd = None
        gastos_admin_pct = None
        if precio_base_usd and total_usd and total_usd > precio_base_usd:
            gastos_admin_usd = round(total_usd - precio_base_usd, 2)
            gastos_admin_pct = round((gastos_admin_usd / precio_base_usd) * 100, 1)

        lead = db.lead_create(
            destino=destino,
            nombre=nombre,
            telefono=telefono,
            origen=origen,
            fecha_inicio=fecha_inicio,
            noches=noches,
            pasajeros=pasajeros,
            tipo_viaje=tipo_viaje,
            resumen=resumen,
            precio_base_usd=precio_base_usd,
            gastos_admin_pct=gastos_admin_pct,
            gastos_admin_usd=gastos_admin_usd,
            total_usd=total_usd,
        )
        logger.info("Lead guardado: id=%s destino=%s nombre=%s", lead["id"], destino, nombre)
        return f"Lead guardado correctamente. ID: {lead['id']}. El equipo de seguimiento fue notificado."
    except Exception as exc:
        logger.error("Error guardando lead: %s", exc, exc_info=True)
        return f"No se pudo guardar el lead: {exc}"


def update_lead_budget(
    lead_id: str,
    precio_base_usd: float | None = None,
    total_usd: float | None = None,
    resumen: str | None = None,
) -> str:
    """
    Actualizá el presupuesto de un lead ya guardado.
    Usá el lead_id retornado por save_lead.
    """
    try:
        kwargs: dict = {}
        if precio_base_usd is not None:
            kwargs["precio_base_usd"] = precio_base_usd
        if total_usd is not None:
            kwargs["total_usd"] = total_usd
            kwargs["status"] = "cotizado"
        if resumen is not None:
            kwargs["resumen"] = resumen
        if precio_base_usd and total_usd and total_usd > precio_base_usd:
            kwargs["gastos_admin_usd"] = round(total_usd - precio_base_usd, 2)
            kwargs["gastos_admin_pct"] = round(((total_usd - precio_base_usd) / precio_base_usd) * 100, 1)

        lead = db.lead_update(lead_id, **kwargs)
        if not lead:
            return f"Lead {lead_id} no encontrado."
        return f"Presupuesto actualizado. ID: {lead_id}, Total: USD {total_usd}"
    except Exception as exc:
        logger.error("Error actualizando lead: %s", exc, exc_info=True)
        return f"No se pudo actualizar el lead: {exc}"
