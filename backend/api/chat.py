from fastapi import APIRouter
from pydantic import BaseModel

from agents import pipeline, hermes_mcp

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    content: str


@router.post("/chat")
async def chat(body: ChatRequest) -> ChatResponse:
    response = await pipeline.run(body.message, body.session_id)
    return ChatResponse(content=response)


@router.post("/agent/chat")
async def agent_chat(body: ChatRequest) -> ChatResponse:
    response = await pipeline.run(body.message, body.session_id)
    return ChatResponse(content=response)


@router.get("/agent/status")
def agent_status():
    return {
        "online": True,
        "hermes_mcp": hermes_mcp.is_connected(),
        "agents": [
            {"agent_id": "hermes-investigador", "name": "Hermes Investigador"},
            {"agent_id": "atencion-cliente", "name": "Hermes Atención al Cliente"},
            {"agent_id": "crm-analyst", "name": "HermesCRMAnalyst"},
        ],
    }
