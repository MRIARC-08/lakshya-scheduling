import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
from datetime import datetime
from typing import Optional
from config import config
import re

# ── Connection pool ───────────────────────────────────────────

_pool: Optional[ThreadedConnectionPool] = None

import time

def get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        retries = 5
        for i in range(retries):
            try:
                _pool = ThreadedConnectionPool(
                    1,
                    10,
                    dsn=config.DATABASE_URL_POOLED,
                )
                break
            except psycopg2.OperationalError as e:
                if i < retries - 1:
                    print(f"⚠️ Neon DB wake-up or connection issue. Retrying in 2 seconds... ({i+1}/{retries})")
                    time.sleep(2)
                else:
                    raise e
    return _pool

def get_connection():
    return get_pool().getconn()

def release_connection(conn):
    get_pool().putconn(conn)

# ── Schema initialization ─────────────────────────────────────

def initialize_database():
    """
    Create all application tables in Neon.
    LangGraph creates its own checkpoint tables separately.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # ── Bookings table ───────────────────────────────────
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id               SERIAL PRIMARY KEY,
                booking_ref      TEXT UNIQUE NOT NULL,
                thread_id        TEXT NOT NULL,
                user_id          TEXT,
                customer_email   TEXT NOT NULL,
                customer_name    TEXT NOT NULL,
                session_type     TEXT NOT NULL,
                date             DATE NOT NULL,
                time             TIME NOT NULL,
                status           TEXT DEFAULT 'confirmed',
                google_event_id  TEXT,
                email_sent       BOOLEAN DEFAULT FALSE,
                email_message_id TEXT,
                notes            TEXT,
                created_at       TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # ── Notification log ─────────────────────────────────
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notification_log (
                id          SERIAL PRIMARY KEY,
                booking_ref TEXT NOT NULL,
                email       TEXT NOT NULL,
                status      TEXT NOT NULL,
                message_id  TEXT,
                error       TEXT,
                sent_at     TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # ── Indexes ──────────────────────────────────────────
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_bookings_email
            ON bookings(customer_email)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_bookings_user_id
            ON bookings(user_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_bookings_thread_id
            ON bookings(thread_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_bookings_date
            ON bookings(date)
        """)

        conn.commit()
        print("✅ Neon DB tables initialized")

    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to initialize Neon tables: {e}")
    finally:
        release_connection(conn)

import uuid
def generate_booking_ref() -> str:
    """Generate a unique booking reference like REF-A1B2C3D4."""
    return f"REF-{str(uuid.uuid4())[:8].upper()}"

def save_booking(
    booking_ref: str,
    thread_id: str,
    customer_email: str,
    customer_name: str,
    session_type: str,
    date: str,
    time: str,
    google_event_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> str:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO bookings (
                booking_ref, thread_id, customer_email, customer_name,
                session_type, date, time, google_event_id, user_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING booking_ref
        """, (
            booking_ref, thread_id, customer_email, customer_name,
            session_type, date, time, google_event_id, user_id
        ))
        returned_ref = cursor.fetchone()[0]
        conn.commit()
        return returned_ref
    finally:
        release_connection(conn)

def update_email_status(
    booking_ref: str,
    success: bool,
    message_id: Optional[str] = None,
    error_msg: Optional[str] = None
):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if success:
            cursor.execute("""
                UPDATE bookings 
                SET email_sent = TRUE, email_message_id = %s
                WHERE booking_ref = %s
            """, (message_id, booking_ref))
            
        cursor.execute("""
            INSERT INTO notification_log (booking_ref, email, status, message_id, error)
            SELECT booking_ref, customer_email, %s, %s, %s
            FROM bookings WHERE booking_ref = %s
        """, ('sent' if success else 'failed', message_id, error_msg, booking_ref))
        
        conn.commit()
    finally:
        release_connection(conn)

def get_booking_by_ref(booking_ref: str) -> Optional[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("""
            SELECT * FROM bookings WHERE booking_ref = %s
        """, (booking_ref,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        release_connection(conn)

def link_guest_bookings_to_user(
    email:   str,
    user_id: str,
) -> int:
    """
    Called when guest signs in with Google.
    Maps all unlinked bookings with this email to userId.
    Returns count of updated rows.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE bookings
            SET user_id = %s
            WHERE customer_email = %s
            AND user_id IS NULL
        """, (user_id, email))
        updated = cursor.rowcount
        conn.commit()
        return updated
    finally:
        cursor.close()
        release_connection(conn)


# ── Fetch bookings ────────────────────────────────────────────

def get_bookings_by_user(user_id: str) -> list[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        cursor.execute("""
            SELECT
                booking_ref,
                customer_name,
                customer_email,
                session_type,
                date::text,
                time::text,
                status,
                google_event_id,
                email_sent,
                created_at::text
            FROM bookings
            WHERE user_id = %s
            ORDER BY date DESC, time DESC
        """, (user_id,))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        cursor.close()
        release_connection(conn)


def get_bookings_by_email(email: str) -> list[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        cursor.execute("""
            SELECT
                booking_ref,
                customer_name,
                customer_email,
                session_type,
                date::text,
                time::text,
                status,
                google_event_id,
                email_sent,
                created_at::text
            FROM bookings
            WHERE customer_email = %s
            ORDER BY date DESC, time DESC
        """, (email,))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        cursor.close()
        release_connection(conn)
