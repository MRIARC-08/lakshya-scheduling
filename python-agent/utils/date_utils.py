from datetime import datetime, date, timedelta
from dateutil import parser
from dateutil.relativedelta import relativedelta
import re
from typing import Optional
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def get_current_ist_context() -> dict:
    """Get current IST date/time for agent context."""
    now = datetime.now(IST)
    return {
        "current_date":          str(now.date()),
        "current_time":          now.strftime("%H:%M"),
        "current_day":           now.strftime("%A"),
        "current_datetime_iso":  now.isoformat(),
        "timezone":              "IST (Asia/Kolkata)",
        "tomorrow":              str((now + timedelta(days=1)).date()),
        "day_after_tomorrow":    str((now + timedelta(days=2)).date()),
    }


def normalize_date(date_string: str) -> Optional[str]:
    """
    Convert any human date input to YYYY-MM-DD.

    Handles:
    - "tomorrow", "today", "day after tomorrow"
    - "next Monday", "this Friday", "Monday"
    - "Jan 22", "22 January", "22/01/2025"
    - "2025-01-22" (passthrough)
    Returns None if unparseable.
    """
    today = datetime.now(IST).date()
    raw = date_string.strip().lower()

    # ── Exact relative matches ───────────────────────────────
    relative = {
        "today":             today,
        "tomorrow":          today + timedelta(days=1),
        "day after tomorrow":today + timedelta(days=2),
        "overmorrow":        today + timedelta(days=2),
        "next week":         today + timedelta(weeks=1),
        "in two days":       today + timedelta(days=2),
        "in 2 days":         today + timedelta(days=2),
        "in three days":     today + timedelta(days=3),
        "in 3 days":         today + timedelta(days=3),
    }
    if raw in relative:
        return str(relative[raw])

    # ── Weekday resolution ───────────────────────────────────
    weekdays = {
        "monday": 0, "tuesday": 1, "wednesday": 2,
        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
    }

    # "next monday"
    m = re.match(r"next\s+(\w+)", raw)
    if m and m.group(1) in weekdays:
        target = weekdays[m.group(1)]
        days_ahead = target - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return str(today + timedelta(days=days_ahead))

    # "this monday"
    m = re.match(r"this\s+(\w+)", raw)
    if m and m.group(1) in weekdays:
        target = weekdays[m.group(1)]
        days_ahead = target - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        return str(today + timedelta(days=days_ahead))

    # bare weekday "monday", "friday"
    if raw in weekdays:
        target = weekdays[raw]
        days_ahead = target - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return str(today + timedelta(days=days_ahead))

    # ── dateutil fallback ────────────────────────────────────
    try:
        default_dt = datetime(today.year, today.month, today.day)
        parsed = parser.parse(date_string, default=default_dt)
        parsed_date = parsed.date()
        # If parsed date is in the past, roll to next year
        if parsed_date < today:
            parsed_date = parsed_date.replace(year=today.year + 1)
        return str(parsed_date)
    except (ValueError, OverflowError):
        return None


def normalize_time(time_string: str) -> Optional[str]:
    """
    Convert any time input to HH:MM (24-hour IST).

    Handles:
    - "2pm", "2 PM", "14:00", "2:30pm", "morning", "afternoon"
    """
    raw = time_string.strip().lower()

    # Natural language time shortcuts
    natural = {
        "morning":   "10:00",
        "afternoon": "14:00",
        "evening":   "17:00",
        "noon":      "12:00",
        "midnight":  None,  # outside business hours
    }
    if raw in natural:
        return natural[raw]

    # "2pm", "2 pm"
    m = re.match(r"^(\d{1,2})\s*(am|pm)$", raw)
    if m:
        hour, period = int(m.group(1)), m.group(2)
        if period == "pm" and hour != 12:
            hour += 12
        elif period == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:00"

    # "2:30pm", "2:30 pm"
    m = re.match(r"^(\d{1,2}):(\d{2})\s*(am|pm)$", raw)
    if m:
        hour, minute, period = int(m.group(1)), int(m.group(2)), m.group(3)
        if period == "pm" and hour != 12:
            hour += 12
        elif period == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute:02d}"

    # Try dateutil
    try:
        parsed = parser.parse(time_string)
        return parsed.strftime("%H:%M")
    except (ValueError, OverflowError):
        return None


def is_business_hours(time_str: str) -> bool:
    """Check if time is within Lakshya business hours (9am-6pm)."""
    try:
        h, m = map(int, time_str.split(":"))
        total = h * 60 + m
        return 9 * 60 <= total <= 17 * 60  # 9:00 to 17:00
    except ValueError:
        return False


def is_future_date(date_str: str) -> bool:
    """Check date is today or future."""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
        return d >= datetime.now(IST).date()
    except ValueError:
        return False


def is_valid_email(email: str) -> bool:
    """Basic email validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def format_date_human(date_str: str) -> str:
    """2025-01-22 → Wednesday, January 22, 2025."""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return d.strftime("%A, %B %d, %Y")
    except ValueError:
        return date_str


def format_time_human(time_str: str) -> str:
    """15:00 → 3:00 PM."""
    try:
        t = datetime.strptime(time_str, "%H:%M")
        return t.strftime("%-I:%M %p")
    except ValueError:
        return time_str
