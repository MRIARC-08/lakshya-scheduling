from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from langchain_core.messages import HumanMessage
import uvicorn

from agents.graph import get_graph
from database.db_manager import (
    initialize_database,
    link_guest_bookings_to_user,
    get_bookings_by_user,
    get_bookings_by_email,
)
from config import config

# ── Init ─────────────────────────────────────────────────────

initialize_database()
app = FastAPI(
    title="Lakshya IAS Academy — Arjun Scheduling Agent",
    description="Multi-agent scheduling system powered by LangGraph",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request/Response models ───────────────────────────────────

class UserContext(BaseModel):
    is_authenticated: bool = False
    email:            Optional[str] = None
    name:             Optional[str] = None
    user_id:          Optional[str] = None


class ChatRequest(BaseModel):
    message:      str
    thread_id:    str
    user_context: UserContext


class ChatResponse(BaseModel):
    response:     str
    agent:        str
    booking_ref:  Optional[str] = None
    confirmed:    bool = False
    booking_phase: Optional[str] = None


class LinkGuestRequest(BaseModel):
    email:   str
    user_id: str


# ── Chat endpoint ─────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    graph = get_graph()
    config_dict = {
        "configurable": {"thread_id": req.thread_id}
    }

    # Build initial state
    input_state = {
        "messages":        [HumanMessage(content=req.message)],
        "thread_id":       req.thread_id,
        "user_id":         req.user_context.user_id or "",
        "is_authenticated": req.user_context.is_authenticated,
    }

    # Pre-populate user info if authenticated
    if req.user_context.is_authenticated:
        if req.user_context.email:
            input_state["collected_email"] = req.user_context.email
        if req.user_context.name:
            input_state["collected_name"] = req.user_context.name

    try:
        result = graph.invoke(input_state, config=config_dict)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent error: {str(e)}"
        )

    # Extract last AI message
    last_response = ""
    for msg in reversed(result.get("messages", [])):
        if hasattr(msg, "name") and msg.content:
            if not getattr(msg, "tool_calls", None):
                last_response = msg.content
                break

    return ChatResponse(
        response=     last_response or "Bilkul! How can I help you?",
        agent=        result.get("current_agent", "triage"),
        booking_ref=  result.get("booking_ref"),
        confirmed=    result.get("appointment_confirmed", False),
        booking_phase=result.get("booking_phase"),
    )


# ── Guest → User mapping (called by NextAuth callback) ───────

@app.post("/auth/link-guest-bookings")
async def link_guest_bookings(req: LinkGuestRequest):
    updated = link_guest_bookings_to_user(req.email, req.user_id)
    return {
        "success":          True,
        "bookings_linked":  updated,
        "message": (
            f"Linked {updated} guest booking(s) to user {req.user_id}"
        ),
    }


# ── Bookings endpoints ────────────────────────────────────────

@app.get("/bookings/user/{user_id}")
async def get_user_bookings(user_id: str):
    bookings = get_bookings_by_user(user_id)
    return {"success": True, "bookings": bookings}


@app.get("/bookings/email/{email}")
async def get_bookings_by_email_route(email: str):
    bookings = get_bookings_by_email(email)
    return {"success": True, "bookings": bookings}


# ── Health check ──────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "service": "Lakshya IAS — Arjun Scheduling Agent",
        "version": "1.0.0",
    }


# ── Run ───────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
