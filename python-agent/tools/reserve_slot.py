from langchain_core.tools import tool
import httpx
import json
from config import config
from database.db_manager import save_booking
from utils.date_utils import (
    normalize_date,
    normalize_time,
    is_future_date,
    is_business_hours,
    is_valid_email,
    format_date_human,
    format_time_human,
)


def get_bridge_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-api-key": config.BRIDGE_API_KEY,
    }


@tool
def reserve_slot(
    date: str,
    time: str,
    customer_name: str,
    customer_email: str,
    session_type: str,
    thread_id: str,
    user_id: str = "",
) -> str:
    """
    Reserve a session slot at Lakshya IAS Academy.
    Creates a real Google Calendar event.

    Args:
        date:           Date string (normalized or raw)
        time:           Time string (normalized or raw)
        customer_name:  Full name of the student
        customer_email: Student's email address
        session_type:   One of the 5 session types
        thread_id:      Conversation thread ID for logging
        user_id:        Optional — set if user is logged in

    Returns:
        JSON with booking confirmation or error with alternatives.
    """
    # ── Normalize & validate ─────────────────────────────────
    norm_date = normalize_date(date)
    if not norm_date:
        return json.dumps({
            "success": False,
            "error": f"Invalid date: '{date}'",
        })

    if not is_future_date(norm_date):
        return json.dumps({
            "success": False,
            "error": "Cannot book a past date.",
        })

    norm_time = normalize_time(time)
    if not norm_time:
        return json.dumps({
            "success": False,
            "error": f"Invalid time: '{time}'",
        })

    if not is_business_hours(norm_time):
        return json.dumps({
            "success": False,
            "error": (
                f"Time {norm_time} is outside business hours. "
                f"Lakshya sessions run Mon-Sat, 9:00 AM to 6:00 PM IST."
            ),
        })

    if not is_valid_email(customer_email):
        return json.dumps({
            "success": False,
            "error": f"Invalid email: '{customer_email}'",
        })

    # Validate session type
    valid_types = [s["name"] for s in config.SESSION_TYPES]
    if session_type not in valid_types:
        session_type = "Free Counselling Session"

    # Generate booking ref early (used in calendar event description)
    from database.db_manager import generate_booking_ref
    booking_ref = generate_booking_ref()

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                f"{config.CORSAIR_BRIDGE_URL}/api/calendar/book",
                headers=get_bridge_headers(),
                json={
                    "date":          norm_date,
                    "time":          norm_time,
                    "customerName":  customer_name,
                    "customerEmail": customer_email,
                    "sessionType":   session_type,
                    "bookingId":     booking_ref,
                },
            )
            response.raise_for_status()
            data = response.json()

        if not data.get("success"):
            return json.dumps({
                "success": False,
                "error": data.get("error", "Booking failed"),
                "message": data.get("message", ""),
            })

        # ── Save to SQLite ───────────────────────────────────
        actual_ref = save_booking(
            booking_ref=booking_ref,
            thread_id=thread_id,
            customer_email=customer_email,
            customer_name=customer_name,
            session_type=session_type,
            date=norm_date,
            time=norm_time,
            google_event_id=data.get("eventId"),
            user_id=user_id if user_id else None,
        )

        human_date = format_date_human(norm_date)
        human_time = format_time_human(norm_time)

        return json.dumps({
            "success":       True,
            "booking_ref":   actual_ref,
            "date":          norm_date,
            "human_date":    human_date,
            "time":          norm_time,
            "human_time":    human_time,
            "customer_name": customer_name,
            "customer_email":customer_email,
            "session_type":  session_type,
            "google_event_id": data.get("eventId"),
            "meetLink":      data.get("meetLink"),
            "message": (
                f"✅ Session booked! {customer_name} is confirmed for "
                f"{session_type} on {human_date} at {human_time} IST."
            ),
        })

    except httpx.HTTPStatusError as e:
        error_body = {}
        try:
            error_body = e.response.json()
        except Exception:
            pass

        return json.dumps({
            "success": False,
            "error": f"Booking service error: {e.response.status_code}",
            "details": error_body,
        })

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Unexpected error during booking: {str(e)}",
        })
