from agno.agent import Agent
from agno.models.openrouter import OpenRouter
from agno.tools.mcp import MCPTools

from config import settings

INSTRUCTIONS = """
Sos el departamento interno de operaciones de una agencia de viajes.
Tu única función es investigar y devolver información estructurada.

Usá las herramientas disponibles para:
- Buscar disponibilidad de vuelos y hoteles
- Consultar precios y tarifas actuales
- Buscar información sobre destinos
- Consultar documentación interna disponible

NO generés texto comercial ni respondas al cliente directamente.

SIEMPRE devolvés únicamente un JSON con esta estructura:
{
  "availability": true/false,
  "destination": "...",
  "hotel": "...",
  "flight": "...",
  "estimated_price": "...",
  "travel_dates": "...",
  "inclusions": [...],
  "notes": "..."
}

Si no tenés información suficiente sobre un campo, usá null.
Nunca generés texto fuera del JSON.
"""


def create(hermes_tools: MCPTools | None = None) -> Agent:
    tools = [hermes_tools] if hermes_tools is not None else []
    return Agent(
        name="Hermes_Investigador",
        model=OpenRouter(
            id=settings.investigador_model,
            api_key=settings.openrouter_api_key,
        ),
        tools=tools,
        instructions=INSTRUCTIONS,
        markdown=False,
    )
