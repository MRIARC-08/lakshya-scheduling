from langchain_groq import ChatGroq
from langchain_core.tools import tool
from config import config

@tool
def dummy_book(time: str):
    """Book a time slot."""
    return f"Booked for {time}"

llm = ChatGroq(model_name="llama-3.3-70b-versatile", groq_api_key=config.GROQ_API_KEY)
llm_with_tools = llm.bind_tools([dummy_book])

res = llm_with_tools.invoke("Please book a slot for me at 1pm today.")
print("Tool Calls:", res.tool_calls)
print("Content:", res.content)
