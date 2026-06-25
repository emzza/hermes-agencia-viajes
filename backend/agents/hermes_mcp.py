import logging
from agno.tools.mcp import MCPTools

from config import settings

logger = logging.getLogger(__name__)

_tools: MCPTools | None = None


async def connect() -> None:
    global _tools
    url = f"{settings.hermes_url}/sse"
    logger.info("Connecting to Hermes MCP server at %s", url)
    t = MCPTools(transport="sse", url=url)
    await t.connect()
    _tools = t  # only assigned after successful connect
    logger.info("Hermes MCP connected")


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
