from fastapi import APIRouter
from pydantic import BaseModel

from agents import pipeline

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    response = await pipeline.run(body.message, body.session_id)
    return ChatResponse(response=response)
