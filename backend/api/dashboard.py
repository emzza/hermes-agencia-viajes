"""
Dashboard + CRM API stubs.
Returns empty data until the WhatsApp / database integration is built.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents import pipeline

router = APIRouter()


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard():
    return {
        "activeConversations": 0,
        "waitingHuman": 0,
        "messagesToday": 0,
        "recentErrors": 0,
        "whatsappStatus": "pending",
    }


# ─── Conversations ───────────────────────────────────────────────────────────

@router.get("/conversations")
def list_conversations(status: str | None = None, search: str | None = None, limit: int = 50):
    return []


@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: str):
    raise HTTPException(status_code=404, detail="Not found")


@router.get("/conversations/{conv_id}/messages")
def get_messages(conv_id: str):
    return []


@router.post("/conversations/{conv_id}/messages")
def send_message(conv_id: str):
    raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/conversations/{conv_id}/takeover")
def takeover(conv_id: str):
    raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/conversations/{conv_id}/release-to-ai")
def release_to_ai(conv_id: str):
    raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/conversations/{conv_id}/pause-ai")
def pause_ai(conv_id: str):
    raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/conversations/{conv_id}/activate-ai")
def activate_ai(conv_id: str):
    raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/conversations/{conv_id}/mark-read")
def mark_read(conv_id: str):
    return {"ok": True}


@router.patch("/conversations/{conv_id}/notes")
def update_notes(conv_id: str):
    return {"ok": True}


@router.patch("/conversations/{conv_id}/funnel")
def update_funnel(conv_id: str):
    return {"ok": True}


@router.get("/conversations/{conv_id}/travel-budget")
def get_travel_budget(conv_id: str):
    raise HTTPException(status_code=404, detail="No travel budget")


@router.get("/conversations/{conv_id}/tasks")
def get_tasks(conv_id: str):
    return []


# ─── Tasks ───────────────────────────────────────────────────────────────────

@router.patch("/tasks/{task_id}")
def update_task(task_id: str):
    return {"ok": True}


# ─── Leads / Presupuestos ─────────────────────────────────────────────────────

@router.get("/leads")
def list_leads(status: str | None = None, limit: int = 200):
    return []


@router.patch("/leads/{lead_id}")
def update_lead(lead_id: str):
    return {"ok": True}


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: str):
    return {"ok": True}


# ─── Logs ────────────────────────────────────────────────────────────────────

@router.get("/logs")
def list_logs(origin: str | None = None, status: str | None = None, limit: int = 100):
    return []


# ─── Alerts ──────────────────────────────────────────────────────────────────

@router.get("/alerts")
def list_alerts(status: str | None = None, limit: int = 50):
    return []


@router.post("/alerts/{alert_id}/dismiss")
def dismiss_alert(alert_id: str):
    return {"ok": True}


@router.post("/alerts/{alert_id}/send-followup")
def send_followup(alert_id: str):
    return {"ok": True}


# ─── Daily report ─────────────────────────────────────────────────────────────

@router.get("/daily-report/latest")
def get_daily_report():
    raise HTTPException(status_code=404, detail="No report yet")


class SaveReportRequest(BaseModel):
    report_date: str
    content: str


@router.post("/daily-report/save")
def save_daily_report(body: SaveReportRequest):
    return {
        "id": f"report-{body.report_date}",
        "report_date": body.report_date,
        "content": body.content,
        "created_at": f"{body.report_date}T00:00:00",
    }


# ─── CRM Analyst chat ─────────────────────────────────────────────────────────

class CrmChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/crm-analyst/chat")
async def crm_analyst_chat(body: CrmChatRequest):
    response = await pipeline.run(body.message, body.session_id)
    return {"content": response}
