from langchain_core.tools import tool
import httpx
import json
from config import config
from utils.date_utils import (
    normalize_date,
    is_future_date,
    format_date_human,
)


def get_bridge_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-api-key": config.BRIDGE_API_KEY,
    }


@tool
def check_availability(date: str) -> str:
    """
    Check available appointment slots at Lakshya IAS Academy
    for a given date.

    Args:
        date: Any date string — 'tomorrow', 'next Monday',
              'Jan 22', '2025-01-22', etc.

    Returns:
        JSON with available time slots or error details.
    """
    # Normalize date
    normalized = normalize_date(date)

    if not normalized:
        return json.dumps({
            "success": False,
            "error": f"Could not understand date: '{date}'",
            "suggestion": "Try: 'tomorrow', 'next Monday', or '2025-01-22'"
        })

    if not is_future_date(normalized):
        return json.dumps({
            "success": False,
            "error": f"Date {normalized} is in the past.",
            "suggestion": "Please choose a future date."
        })

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(
                f"{config.CORSAIR_BRIDGE_URL}/api/calendar/check",
                headers=get_bridge_headers(),
                json={"date": normalized},
            )
            response.raise_for_status()
            data = response.json()

        human_date = format_date_human(normalized)

        if not data.get("available_slots"):
            return json.dumps({
                "success": True,
                "date": normalized,
                "human_date": human_date,
                "available_slots": [],
                "message": (
                    f"No available slots on {human_date}. "
                    f"All sessions are fully booked for this day."
                ),
            })

        return json.dumps({
            "success": True,
            "date": normalized,
            "human_date": human_date,
            "available_slots": data["available_slots"],
            "total_available": len(data["available_slots"]),
            "message": (
                f"Found {len(data['available_slots'])} available "
                f"slots on {human_date}."
            ),
        })

    except httpx.TimeoutException:
        return json.dumps({
            "success": False,
            "error": "Calendar service timed out. Please try again.",
        })
    except httpx.HTTPStatusError as e:
        return json.dumps({
            "success": False,
            "error": f"Calendar service error: {e.response.status_code}",
        })
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Unexpected error: {str(e)}",
        })
