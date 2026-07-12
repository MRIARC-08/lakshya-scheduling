from typing import TypedDict, Annotated, Optional, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.runnables import RunnableLambda
# from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
import psycopg
from psycopg_pool import ConnectionPool

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
    # llm = ChatGroq(
    #     model_name=config.LLM_MODEL,
    #     temperature=config.LLM_TEMPERATURE,
    #     groq_api_key=config.GROQ_API_KEY_SECONDARY or config.GROQ_API_KEY,
    #     max_retries=3,
    # )
    
    # # Secondary LLM instance specifically for Triage to divide load
    # triage_llm = ChatGroq(
    #     model_name="llama-3.1-8b-instant",
    #     temperature=config.LLM_TEMPERATURE,
    #     groq_api_key=config.GROQ_API_KEY,
    #     max_retries=3,
    # )
    
    # # Fallback LLM in case the primary hits rate limits
    # fallback_llm = ChatGroq(
    #     model_name="llama-3.1-8b-instant", 
    #     temperature=config.LLM_TEMPERATURE,
    #     groq_api_key=config.GROQ_API_KEY,
    #     max_retries=3,
    # )
    
    # # Secondary Fallback LLM (Mixtral) in case Llama 3 models are completely exhausted
    # secondary_fallback_llm = ChatGroq(
    #     model_name="mixtral-8x7b-32768", 
    #     temperature=config.LLM_TEMPERATURE,
    #     groq_api_key=config.GROQ_API_KEY,
    #     max_retries=3,
    # )

    llm = ChatOpenAI(
        model=config.LLM_MODEL,
        temperature=config.LLM_TEMPERATURE,
        openai_api_key=config.CEREBRAS_API_KEY_1,
        openai_api_base=config.OPENAI_BASE_URL,
        max_retries=3,
    )
    
    triage_llm = ChatOpenAI(
        model=config.LLM_MODEL,
        temperature=config.LLM_TEMPERATURE,
        openai_api_key=config.CEREBRAS_API_KEY_2,
        openai_api_base=config.OPENAI_BASE_URL,
        max_retries=3,
    )
    
    fallback_llm = ChatOpenAI(
        model=config.LLM_MODEL,
        temperature=config.LLM_TEMPERATURE,
        openai_api_key=config.CEREBRAS_API_KEY_1,
        openai_api_base=config.OPENAI_BASE_URL,
        max_retries=3,
    )
    
    secondary_fallback_llm = ChatOpenAI(
        model=config.LLM_MODEL,
        temperature=config.LLM_TEMPERATURE,
        openai_api_key=config.CEREBRAS_API_KEY_2,
        openai_api_base=config.OPENAI_BASE_URL,
        max_retries=3,
    )

    tools          = [check_availability, reserve_slot, send_confirmation_email]
    
    def validate_tool_call(response: AIMessage) -> AIMessage:
        if not hasattr(response, "tool_calls") or not response.tool_calls:
            content_lower = response.content.lower()
            if "successfully booked" in content_lower or "is confirmed" in content_lower:
                raise ValueError("Model hallucinated booking without calling tools.")
        return response
    
    # Bind tools to both and add fallback
    primary_with_tools = llm.bind_tools(tools) | RunnableLambda(validate_tool_call)
    fallback_with_tools = fallback_llm.bind_tools(tools)
    secondary_fallback_with_tools = secondary_fallback_llm.bind_tools(tools)
    
    # Use the primary LLM with the hallucination validator to trigger fallbacks only when necessary
    llm_with_tools = primary_with_tools.with_fallbacks([fallback_with_tools, secondary_fallback_with_tools])
    
    triage_llm_with_fallbacks = triage_llm.with_fallbacks([fallback_llm, secondary_fallback_llm])

    triage_fn  = create_triage_agent(triage_llm_with_fallbacks)
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
    # Uses ConnectionPool for checkpointer to prevent idle drops
    pool = get_pool()
    checkpointer = PostgresSaver(pool)

    # Creates checkpoint tables in Neon automatically
    checkpointer.setup()

    return graph.compile(checkpointer=checkpointer)

_pool = None
def get_pool():
    global _pool
    if _pool is None:
        _pool = ConnectionPool(conninfo=config.DATABASE_URL, kwargs={"autocommit": True})
    return _pool


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
