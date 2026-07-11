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
- Formal but approachable — never robotic
- Every student deserves your full attention and patience
- **CRITICAL**: Always respond in English by default. Do not switch to Hindi or any other language unless the user explicitly initiates a conversation in that language.

CURRENT DATE/TIME CONTEXT (IST):
{datetime_context}

KNOWN STUDENT INFORMATION:
- Name: {user_name}
- Email: {user_email}
(Use this to personalise responses or answer if the user asks what you know about them. If 'None', you don't know it yet.)

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
   - ANY response providing a date, time, or session type (e.g., "Monday at 4pm", "One-on-One Mentorship")
   - ANY continuation of an existing booking conversation

For GENERAL queries, answer as Arjun representing Lakshya IAS.
For BOOKING intent, warmly acknowledge and hand off.

CRITICAL RULE: If the user is responding with scheduling details (like choosing a session type, date, or time), you MUST set "route_to_booking": true. DO NOT generate text saying "I will forward this to the booking specialist" while setting route_to_booking to false.

SESSION TYPES AT LAKSHYA IAS:
1. Free Counselling Session (30 min) — best for first-timers
2. One-on-One Mentorship (60 min) — deep dive with expert
3. Mock Interview (45 min) — UPSC personality test simulation
4. Study Plan Review (30 min) — personalised strategy session
5. Answer Writing Workshop (90 min) — GS/Essay writing practice

Business hours: Monday to Saturday, 9:00 AM to 6:00 PM IST

RESPOND IN THIS EXACT FORMAT:

<thinking>
1. Briefly analyze the user's intent. Is it a general query or a booking request?
2. Has the user mentioned a specific date, time, or session type?
3. Decide whether to route to booking (true/false).
</thinking>
```json
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
```

If routing to booking, do not write a conversational response. The booking specialist will take over seamlessly and ask the next question.
"""


def create_triage_agent(llm: ChatGroq):

    def triage_node(state: dict) -> dict:
        datetime_ctx = get_current_ist_context()

        user_name = state.get("collected_name") or "None"
        user_email = state.get("collected_email") or "None"

        system = SystemMessage(
            content=TRIAGE_SYSTEM_PROMPT.format(
                datetime_context=json.dumps(datetime_ctx, indent=2),
                user_name=user_name,
                user_email=user_email
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
            "current_agent": "triage",
            "route_to":      "booking_specialist" if route else None,
            "booking_intent": route,
        }
        
        if not route:
            update["messages"] = [AIMessage(content=parsed["response"], name="arjun_triage")]

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
