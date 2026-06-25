import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from agents import hermes_mcp

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.hermes_enabled:
        try:
            await hermes_mcp.connect()
        except Exception as exc:
            logger.warning("Hermes MCP failed to connect: %s — running without it", exc)
    else:
        logger.info("Hermes MCP disabled (HERMES_ENABLED=false)")

    yield

    if hermes_mcp.is_connected():
        await hermes_mcp.disconnect()


app = FastAPI(
    title="Hermes Agencia de Viajes API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.chat import router as chat_router
from api.dashboard import router as dashboard_router

app.include_router(chat_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Hermes API",
        "hermes_mcp": hermes_mcp.is_connected(),
    }
