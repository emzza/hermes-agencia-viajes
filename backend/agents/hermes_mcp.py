import logging
from agno.tools.mcp import MCPTools

from config import settings

logger = logging.getLogger(__name__)

_tools: MCPTools | None = None


async def connect() -> None:
    global _tools
    logger.info("Connecting to Hermes Agent MCP server...")
    _tools = MCPTools(command=settings.hermes_command)
    await _tools.connect()
    logger.info("Hermes MCP connected — command: %s", settings.hermes_command)


async def disconnect() -> None:
    global _tools
    if _tools:
        await _tools.close()
        _tools = None
        logger.info("Hermes MCP disconnected")


def get() -> MCPTools | None:
    return _tools


def is_connected() -> bool:
    return _tools is not None
