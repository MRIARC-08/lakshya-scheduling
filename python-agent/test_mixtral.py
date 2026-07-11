from langchain_groq import ChatGroq
from langchain_core.tools import tool
from config import config

@tool
def reserve_slot(time: str, date: str, name: str, email: str, session: str, thread: str):
    """Reserve a slot"""
    return f"Booked for {time}"

llm = ChatGroq(model_name="mixtral-8x7b-32768", groq_api_key=config.GROQ_API_KEY)
llm_with_tools = llm.bind_tools([reserve_slot])

res = llm_with_tools.invoke("Please book it for today at 5pm. My name is Adarsh, email a@a.com, session Mock, thread 123.")
print("Tool Calls:", getattr(res, "tool_calls", None))
print("Content:", res.content)
