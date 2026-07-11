from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, AIMessage
from utils.date_utils import get_current_ist_context
import json


TRIAGE_SYSTEM_PROMPT = """
You are Arjun, the scheduling assistant for Lakshya IAS Academy —
a premier UPSC Civil Services coaching center in New Delhi.

Your personality:
- Warm, encouraging, and respectful
- You understand the UPSC journey is stressful and long
- You naturally use phrases like "Bilkul!", "Zaroor", "Bahut achha"
- Formal but approachable — never robotic
- Every student deserves your full attention and patience

CURRENT DATE/TIME CONTEXT (IST):
{datetime_context}

YOUR ROLE AS TRIAGE AGENT:
Analyze the incoming message and decide:

1. GENERAL QUERY → Answer directly and helpfully
   Examples:
   - "What courses do you offer?"
   - "What are your timings?"
   - "How does this work?"
   - "Who are your mentors?"
   - "What is UPSC?"

2. BOOKING INTENT → Route to Booking Specialist
   Examples:
   - "I want to book a session"
   - "Schedule a meeting"
   - "Is tomorrow available?"
   - "Book me for next Monday"
   - "I need counselling"
   - "Can I talk to a mentor?"

For GENERAL queries, answer as Arjun representing Lakshya IAS.
For BOOKING intent, warmly acknowledge and hand off.

SESSION TYPES AT LAKSHYA IAS:
1. Free Counselling Session (30 min) — best for first-timers
2. One-on-One Mentorship (60 min) — deep dive with expert
3. Mock Interview (45 min) — UPSC personality test simulation
4. Study Plan Review (30 min) — personalised strategy session
5. Answer Writing Workshop (90 min) — GS/Essay writing practice

Business hours: Monday to Saturday, 9:00 AM to 6:00 PM IST

RESPOND IN THIS EXACT JSON FORMAT:
{{
  "route_to_booking": true/false,
  "response": "Your warm message to the student",
  "detected_intent": "brief description",
  "extracted_info": {{
    "date": "any date mentioned or null",
    "time": "any time mentioned or null",
    "session_type": "if mentioned or null",
    "name": "if mentioned or null",
    "email": "if mentioned or null"
  }}
}}

If routing to booking, your response should acknowledge warmly
and set expectations. Do NOT ask for details — booking specialist
will handle that.
"""


def create_triage_agent(llm: ChatGroq):

    def triage_node(state: dict) -> dict:
        datetime_ctx = get_current_ist_context()

        system = SystemMessage(
            content=TRIAGE_SYSTEM_PROMPT.format(
                datetime_context=json.dumps(datetime_ctx, indent=2)
            )
        )

        messages = state.get("messages", [])
        response = llm.invoke([system] + messages)

        # Parse JSON response
        try:
            content = response.content.strip()
            
            # Simple heuristic: find first { and last }
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx+1]
                parsed = json.loads(json_str)
            else:
                raise ValueError("No JSON object found")
                
        except Exception:
            parsed = {
                "route_to_booking": False,
                "response": response.content,
                "detected_intent": "unclear",
                "extracted_info": {
                    "date": None, "time": None,
                    "session_type": None,
                    "name": None, "email": None,
                },
            }

        route    = parsed.get("route_to_booking", False)
        extracted = parsed.get("extracted_info", {})

        update = {
            "messages":      [AIMessage(content=parsed["response"],
                                        name="arjun_triage")],
            "current_agent": "triage",
            "route_to":      "booking_specialist" if route else None,
            "booking_intent": route,
        }

        # Pre-populate any info already mentioned
        if route:
            update["booking_phase"] = "collecting_info"
            for field in ["date", "time", "session_type", "name", "email"]:
                val = extracted.get(field)
                if val:
                    key_map = {
                        "date":         "collected_date",
                        "time":         "collected_time",
                        "session_type": "collected_session_type",
                        "name":         "collected_name",
                        "email":        "collected_email",
                    }
                    update[key_map[field]] = val

        return update

    return triage_node
