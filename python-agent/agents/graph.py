from typing import TypedDict, Annotated, Optional, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import BaseMessage
from langchain_groq import ChatGroq
import psycopg

from tools.check_availability import check_availability
from tools.reserve_slot import reserve_slot
from tools.send_email import send_confirmation_email
from agents.triage_agent import create_triage_agent
from agents.booking_specialist import create_booking_specialist
from config import config


# ── State ─────────────────────────────────────────────────────

class SchedulingState(TypedDict):
    messages:                Annotated[list[BaseMessage], add_messages]
    current_agent:           str
    route_to:                Optional[str]
    thread_id:               str
    user_id:                 str
    is_authenticated:        bool
    booking_intent:          bool
    collected_date:          Optional[str]
    collected_time:          Optional[str]
    collected_name:          Optional[str]
    collected_email:         Optional[str]
    collected_session_type:  Optional[str]
    booking_phase:           Optional[str]
    available_slots:         Optional[list]
    appointment_confirmed:   bool
    booking_ref:             Optional[str]
    email_sent:              bool
    last_error:              Optional[str]


# ── Router ────────────────────────────────────────────────────

def triage_router(
    state: SchedulingState,
) -> Literal["booking_specialist", "__end__"]:
    if state.get("route_to") == "booking_specialist":
        return "booking_specialist"
    return "__end__"


# ── Graph builder ─────────────────────────────────────────────

_graph = None

def build_graph():
    llm = ChatGroq(
        model_name=config.LLM_MODEL,
        temperature=config.LLM_TEMPERATURE,
        groq_api_key=config.GROQ_API_KEY,
    )

    tools          = [check_availability, reserve_slot, send_confirmation_email]
    llm_with_tools = llm.bind_tools(tools)

    triage_fn  = create_triage_agent(llm)
    booking_fn = create_booking_specialist(llm_with_tools, tools)

    graph = StateGraph(SchedulingState)
    graph.add_node("triage",             triage_fn)
    graph.add_node("booking_specialist", booking_fn)

    graph.add_edge(START, "triage")
    graph.add_conditional_edges(
        "triage",
        triage_router,
        {
            "booking_specialist": "booking_specialist",
            "__end__":            END,
        },
    )
    graph.add_edge("booking_specialist", END)

    # ── Postgres checkpointer (Neon) ─────────────────────────
    # Uses direct URL (not pooled) for checkpointer
    conn = psycopg.connect(config.DATABASE_URL, autocommit=True)
    checkpointer = PostgresSaver(conn)

    # Creates checkpoint tables in Neon automatically
    checkpointer.setup()

    return graph.compile(checkpointer=checkpointer)


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
