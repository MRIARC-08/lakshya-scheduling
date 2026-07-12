from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from langchain_core.messages import HumanMessage, AIMessage
import uvicorn
import uuid
from datetime import datetime
import re

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
def chat(req: ChatRequest):
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

    result = None
    for attempt in range(2):
        try:
            result = graph.invoke(input_state, config=config_dict)
            break
        except Exception as e:
            if attempt == 0:
                print(f"Warning: graph.invoke failed (likely DB disconnect). Retrying... Error: {e}")
                continue
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
                
    # Clean up any potential <thinking> tags or hallucinated JSON blocks
    last_response = re.sub(r'<thinking>.*?</thinking>', '', last_response, flags=re.DOTALL)
    last_response = re.sub(r'\{.*?\}', '', last_response, flags=re.DOTALL).strip()

    return ChatResponse(
        response=     last_response or "Bilkul! How can I help you?",
        agent=        result.get("current_agent", "triage"),
        booking_ref=  result.get("booking_ref"),
        confirmed=    result.get("appointment_confirmed", False),
        booking_phase=result.get("booking_phase"),
    )


@app.get("/chat/history/{thread_id}")
def get_chat_history(thread_id: str):
    graph = get_graph()
    config_dict = {"configurable": {"thread_id": thread_id}}
    
    try:
        state = graph.get_state(config_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if not state or not state.values:
        return {"success": True, "messages": []}
        
    messages_out = []
    messages = state.values.get("messages", [])
    
    # We add a slight increment to timestamps so they order properly on frontend
    base_time = datetime.now()
    
    for i, msg in enumerate(messages):
        if not getattr(msg, "content", None):
            continue
            
        role = "assistant"
        if isinstance(msg, HumanMessage):
            role = "user"
        elif isinstance(msg, AIMessage):
            # Skip AIMessages that are purely tool calls with no content
            if not msg.content.strip():
                continue
        else:
            continue
            
        content = msg.content
        if role == "assistant":
            content = re.sub(r'<thinking>.*?</thinking>', '', content, flags=re.DOTALL)
            content = re.sub(r'\{.*?\}', '', content, flags=re.DOTALL).strip()
            if not content:
                continue
                
        # Just create an artificial chronological timestamp
        from datetime import timedelta
        msg_time = base_time + timedelta(seconds=i)
                
        messages_out.append({
            "id": msg.id or str(uuid.uuid4()),
            "role": role,
            "content": content,
            "timestamp": msg_time.isoformat(),
            "agent": getattr(msg, "name", "arjun") if role == "assistant" else None
        })
        
    return {"success": True, "messages": messages_out}

# ── Guest → User mapping (called by NextAuth callback) ───────

@app.post("/auth/link-guest-bookings")
def link_guest_bookings(req: LinkGuestRequest):
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
def get_user_bookings(user_id: str):
    bookings = get_bookings_by_user(user_id)
    return {"success": True, "bookings": bookings}


@app.get("/bookings/email/{email}")
def get_bookings_by_email_route(email: str):
    bookings = get_bookings_by_email(email)
    return {"success": True, "bookings": bookings}


# ── Health check ──────────────────────────────────────────────

@app.head("/health")
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
