from langchain_groq import ChatGroq
from langchain_core.tools import tool
from config import config

@tool
def reserve_slot(time: str, date: str, name: str, email: str, session: str, thread: str):
    """Reserve a slot"""
    return f"Booked for {time}"

llm = ChatGroq(model_name="llama-3.3-70b-versatile", groq_api_key=config.GROQ_API_KEY)
fallback = ChatGroq(model_name="llama-3.1-8b-instant", groq_api_key=config.GROQ_API_KEY)

llm_with_tools = llm.bind_tools([reserve_slot]).with_fallbacks([fallback.bind_tools([reserve_slot])])

system = "You are a booking assistant. A user wants to book at 1pm today. Name: Bob, Email: bob@x.com, Session: Mock, Date: 2026-07-11, Thread: 123. You must call the tool."

res = llm_with_tools.invoke([("system", system), ("user", "book it for today at 13 pm")])
print("Tool Calls:", getattr(res, "tool_calls", None))
print("Content:", res.content)
