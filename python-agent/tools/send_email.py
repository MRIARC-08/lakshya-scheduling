from langchain_core.tools import tool
import httpx
import json
from config import config
from database.db_manager import update_email_status
from utils.date_utils import format_date_human, format_time_human


def get_bridge_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-api-key": config.BRIDGE_API_KEY,
    }


@tool
def send_confirmation_email(
    customer_email: str,
    customer_name: str,
    session_type: str,
    date: str,
    time: str,
    booking_ref: str,
    meet_link: str = "",
) -> str:
    """
    Send a booking confirmation email to the student
    from appointments@lakshyaias.in via Gmail + Corsair.

    Args:
        customer_email: Student's email address
        customer_name:  Student's full name
        session_type:   Type of session booked
        date:           Date in YYYY-MM-DD format
        time:           Time in HH:MM format
        booking_ref:    Booking reference like LKS-00001

    Returns:
        JSON with send status.
    """
    human_date = format_date_human(date)
    human_time = format_time_human(time)

    try:
        from email_validator import validate_email, EmailNotValidError
        valid_email_info = validate_email(customer_email, check_deliverability=True)
        customer_email = valid_email_info.normalized
    except EmailNotValidError as e:
        return json.dumps({
            "success": False,
            "error": f"Invalid email address '{customer_email}': {str(e)}",
        })

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                f"{config.CORSAIR_BRIDGE_URL}/api/email/send",
                headers=get_bridge_headers(),
                json={
                    "to":           customer_email,
                    "customerName": customer_name,
                    "sessionType":  session_type,
                    "date":         human_date,
                    "time":         human_time,
                    "bookingId":    booking_ref,
                    "meetLink":     meet_link,
                },
            )
            response.raise_for_status()
            data = response.json()

        if data.get("success"):
            update_email_status(
                booking_ref=booking_ref,
                success=True,
                message_id=data.get("messageId", "")
            )

            return json.dumps({
                "success":    True,
                "message_id": data.get("messageId"),
                "to":         customer_email,
                "message": (
                    f"Confirmation email sent to {customer_email}. "
                    f"Student will receive session details shortly."
                ),
            })
        else:
            update_email_status(
                booking_ref=booking_ref,
                success=False,
                error_msg=data.get("message", "Unknown error"),
            )
            return json.dumps({
                "success": False,
                "error":   data.get("message", "Email send failed"),
                "note": (
                    "Booking is confirmed on calendar. "
                    "Email can be retried."
                ),
            })

    except httpx.TimeoutException:
        update_email_status(
            booking_ref=booking_ref,
            success=False,
            error_msg="timeout",
        )
        return json.dumps({
            "success": False,
            "error":   "Email service timed out.",
            "note":    "Booking is confirmed. Please retry email.",
        })

    except Exception as e:
        update_email_status(
            booking_ref=booking_ref,
            success=False,
            error_msg=str(e),
        )
        return json.dumps({
            "success": False,
            "error":   str(e),
        })
