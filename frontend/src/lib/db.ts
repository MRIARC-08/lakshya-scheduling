import { neon } from '@neondatabase/serverless'

// This runs server-side only (API routes, Server Components)
const sql = neon(process.env.DATABASE_URL!)

export interface Booking {
  booking_ref:      string
  customer_name:    string
  customer_email:   string
  session_type:     string
  date:             string
  time:             string
  status:           string
  google_event_id:  string | null
  email_sent:       boolean
  created_at:       string
}

export async function getBookingsByUserId(
  userId: string
): Promise<Booking[]> {
  const rows = await sql`
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
    WHERE user_id = ${userId}
    ORDER BY date DESC, time DESC
  `
  return rows as Booking[]
}

export async function getBookingsByEmail(
  email: string
): Promise<Booking[]> {
  const rows = await sql`
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
    WHERE customer_email = ${email}
    ORDER BY date DESC, time DESC
  `
  return rows as Booking[]
}

export async function linkGuestBookingsToUser(
  email:  string,
  userId: string
): Promise<number> {
  const result = await sql`
    UPDATE bookings
    SET user_id = ${userId}
    WHERE customer_email = ${email}
    AND user_id IS NULL
  `
  return result.length
}

export { sql }
