from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import BaseTool
from utils.date_utils import get_current_ist_context
import json
from typing import List


BOOKING_SPECIALIST_PROMPT = """
You are Arjun, the booking specialist for Lakshya IAS Academy.
A student wants to schedule a session. Your job is to collect
all required information and complete the booking efficiently.

CURRENT DATE/TIME (IST):
{datetime_context}

WHAT YOU ALREADY KNOW ABOUT THIS STUDENT:
- Authenticated: {is_authenticated}
- Name:          {collected_name}
- Email:         {collected_email}
- Date:          {collected_date}
- Time:          {collected_time}
- Session Type:  {collected_session_type}
- Booking Phase: {booking_phase}
- Thread ID:     {thread_id}
- User ID:       {user_id}

SESSION TYPES (ask student to choose if not specified):
1. Free Counselling Session (30 min) — recommended for first contact
2. One-on-One Mentorship (60 min)
3. Mock Interview (45 min)
4. Study Plan Review (30 min)
5. Answer Writing Workshop (90 min)

BUSINESS HOURS: Monday-Saturday, 9:00 AM to 6:00 PM IST
(Closed Sundays and national holidays)

YOUR STRICT WORKFLOW:
═══════════════════════════════════════════

STEP 1 — COLLECT MISSING INFO
If is_authenticated is True:
  → Name and Email are already known — do NOT ask for them
  → Only collect: date, time, session_type (if missing)

If is_authenticated is False:
  → Collect: name, email, date, time, session_type
  → Ask one thing at a time — don't overwhelm the student
  → CRITICAL RULE: If the student has not provided their name or email in the chat, you MUST ask them. DO NOT invent fake names or emails (e.g. arjun@lakshyaias.in). You CANNOT book without asking the student for their real details.

STEP 2 — FIND A DATE AND TIME
If you have the session type, but NOT the date/time:
- Ask the user what date and time works best for them.
- CRITICAL RULE: NEVER check availability for dates unless the user explicitly requested that date or timeframe. DO NOT brute-force or check multiple days (e.g. checking every day for the next month). If they don't give a date, ASK THEM.
- When they give a date, use `check_availability` to see available times.
  → If requested time is available, proceed to Step 3.
  → If NOT available, show alternatives and ask student to pick.

STEP 3 — CONFIRM WITH STUDENT
Before calling the reserve tool, you MUST confirm the details with the student:
"Just to confirm — [session_type] on [date] at [time] for [name] ([email]). Shall I go ahead and book this?"
Wait for their "yes" before proceeding to Step 4. If they already said "book it for 5pm", you can proceed directly.

STEP 4 — RESERVE THE SLOT (CRITICAL)
When the student confirms the time, you MUST execute the `reserve_slot` tool API.
  → You MUST provide ALL 6 required arguments:
      1. date (string)
      2. time (string)
      3. customer_name (string)
      4. customer_email (string)
      5. session_type (string)
      6. thread_id (string, use {thread_id})
  → WARNING: DO NOT generate text saying "Your session is confirmed". You MUST call the `reserve_slot` tool API instead!
  → CRITICAL NOTE: Even if you see a past `reserve_slot` tool call in the conversation history, you MUST call it AGAIN for this new date/time request!

STEP 5 — SEND CONFIRMATION EMAIL
  → Immediately after a successful `reserve_slot` tool call, you MUST call the `send_confirmation_email` tool.
  → Call send_confirmation_email(...)
  → Use the booking_ref returned from reserve_slot
  → Extract the meetLink from reserve_slot and pass it as meet_link

STEP 6 — CLOSE WARMLY
  → Summarize what was booked
  → Encourage the student
  → End with "All the best on your UPSC journey! 🎯"

═══════════════════════════════════════════

VALIDATION RULES:
- Dates must be future dates
- Times must be within business hours (9am-6pm)
- Email must be valid format
- Always normalize dates: "tomorrow" → actual YYYY-MM-DD



TONE & STYLE:
- **Highly conversational and empathetic.** Do not sound like a robotic customer support agent.
- DO NOT just dump lists of alternatives. Wrap them in a warm message.
- If a user asks something ambiguous, ask for clarification gently.
- Never ask for an email or name if `is_authenticated` is True!
- **CRITICAL**: Always respond in English by default. Do not switch to Hindi or any other language unless the user explicitly initiates a conversation in that language.
- Remind students their UPSC journey matters
"""


def create_booking_specialist(
    llm_with_tools: ChatGroq,
    tools: List[BaseTool]
):
    tool_map = {t.name: t for t in tools}

    def booking_specialist_node(state: dict) -> dict:
        datetime_ctx = get_current_ist_context()

        # Build context-aware system prompt
        system = SystemMessage(
            content=BOOKING_SPECIALIST_PROMPT.format(
                datetime_context=json.dumps(datetime_ctx, indent=2),
                is_authenticated=state.get("is_authenticated", False),
                collected_name=state.get("collected_name") or "Not yet collected",
                collected_email=state.get("collected_email") or "Not yet collected",
                collected_date=state.get("collected_date") or "Not yet collected",
                collected_time=state.get("collected_time") or "Not yet collected",
                collected_session_type=state.get("collected_session_type") or "Not yet collected",
                booking_phase=state.get("booking_phase") or "collecting_info",
                thread_id=state.get("thread_id", ""),
                user_id=state.get("user_id", ""),
            )
        )

        messages = state.get("messages", [])
        current_messages = list(messages)
        state_updates: dict = {}
        max_iterations = 8

        for _ in range(max_iterations):
            try:
                response = llm_with_tools.invoke(
                    [system] + current_messages
                )
            except ValueError as e:
                # The validator caught a hallucination. Gently correct the LLM.
                current_messages.append(
                    AIMessage(content="Your session is confirmed!")  # Fake message that triggered it
                )
                current_messages.append(
                    SystemMessage(content="SYSTEM ERROR: You hallucinated a booking confirmation without calling the `reserve_slot` tool. You MUST call the tool first.")
                )
                continue

            # ── Fallback hallucination parser ───────────────────────────────
            # Smaller models like llama-3.1-8b sometimes leak Groq's internal <function> tags
            # instead of using the proper JSON tool API. We can manually parse them to recover.
            if not getattr(response, "tool_calls", None) and getattr(response, "content", None):
                import re
                content = response.content
                match = re.search(r"<function=([a-zA-Z0-9_]+)>(.*?)</function>", content, re.DOTALL)
                if match:
                    tool_name = match.group(1)
                    tool_args_str = match.group(2).strip()
                    try:
                        tool_args = json.loads(tool_args_str)
                        # Inject into response so the loop processes it normally
                        response.tool_calls = [{
                            "name": tool_name,
                            "args": tool_args,
                            "id": f"call_{tool_name}_leaked"
                        }]
                        # Remove the leaked tag from content so it's not shown to user
                        response.content = content[:match.start()].strip()
                    except Exception:
                        pass

            # ── Tool call loop ───────────────────────────────
            if hasattr(response, "tool_calls") and response.tool_calls:
                current_messages.append(response)

                for tc in response.tool_calls:
                    tool_name    = tc["name"]
                    tool_args    = tc["args"]
                    tool_call_id = tc["id"]

                    print(f"🔧 Tool: {tool_name} | Args: {tool_args}")

                    if tool_name not in tool_map:
                        result = json.dumps({
                            "error": f"Tool '{tool_name}' not found"
                        })
                    else:
                        try:
                            result = tool_map[tool_name].invoke(tool_args)
                        except Exception as e:
                            result = json.dumps({"error": str(e)})

                    # Update state from tool results
                    state_updates = _extract_state_updates(
                        tool_name, tool_args,
                        result, state_updates
                    )

                    current_messages.append(
                        ToolMessage(
                            content=result,
                            tool_call_id=tool_call_id,
                            name=tool_name,
                        )
                    )
                continue

            # ── Final response ───────────────────────────────
            state_updates["messages"] = [
                AIMessage(
                    content=response.content.strip(),
                    name="arjun_booking"
                )
            ]
            state_updates["current_agent"] = "booking_specialist"
            state_updates["route_to"]      = None

            if state_updates.get("appointment_confirmed"):
                state_updates["booking_phase"] = "completed"

            return state_updates

        # Max iterations hit
        state_updates["messages"] = [
            AIMessage(
                content=(
                    "I apologize, I'm having a little trouble processing. "
                    "Could you please restate your preferred date and time?"
                ),
                name="arjun_booking"
            )
        ]
        return state_updates

    return booking_specialist_node


def _extract_state_updates(
    tool_name: str,
    tool_args: dict,
    result_raw: str,
    current: dict,
) -> dict:
    """Update LangGraph state based on tool results."""
    try:
        result = json.loads(result_raw) \
            if isinstance(result_raw, str) else result_raw
    except json.JSONDecodeError:
        return current

    if tool_name == "check_availability":
        if result.get("success"):
            current["available_slots"] = result.get("available_slots", [])
            if result.get("date"):
                current["collected_date"] = result["date"]

    elif tool_name == "reserve_slot":
        if result.get("success"):
            current["appointment_confirmed"] = True
            current["booking_ref"]           = result.get("booking_ref")
            current["booking_phase"]         = "email_pending"
            if result.get("time"):
                current["collected_time"] = result["time"]

        else:
            current["last_error"] = result.get("error")

    elif tool_name == "send_confirmation_email":
        if result.get("success"):
            current["email_sent"] = True
            current["booking_phase"] = "completed"

    # Capture args for state
    arg_map = {
        "date":           "collected_date",
        "time":           "collected_time",
        "customer_name":  "collected_name",
        "customer_email": "collected_email",
        "session_type":   "collected_session_type",
    }
    for arg_key, state_key in arg_map.items():
        if tool_args.get(arg_key):
            current[state_key] = tool_args[arg_key]

    return current
