import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { corsair } from '../corsair'
import { log } from '../utils/logger'

const router = Router()

// ── Validation schemas ──────────────────────────────────────

const CheckAvailabilitySchema = z.object({
  date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be YYYY-MM-DD format'
  ),
})

const BookSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(
    /^\d{2}:\d{2}$/,
    'Time must be HH:MM format'
  ),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  sessionType: z.string().default('Free Counselling Session'),
  bookingId: z.string(),
})

// ── Helper: build IST datetime string ───────────────────────

function buildISTDateTime(date: string, time: string): string {
  // Parse IST time and return standard ISO 8601 UTC string for Google Calendar
  return new Date(`${date}T${time}:00+05:30`).toISOString()
}

function buildSessionEndTime(
  date: string,
  time: string,
  sessionType: string
): string {
  const durationMap: Record<string, number> = {
    'Free Counselling Session': 30,
    'One-on-One Mentorship': 60,
    'Mock Interview': 45,
    'Study Plan Review': 30,
    'Answer Writing Workshop': 90,
  }

  const duration = durationMap[sessionType] ?? 60
  const endDate = new Date(`${date}T${time}:00+05:30`)
  endDate.setMinutes(endDate.getMinutes() + duration)

  return endDate.toISOString()
}

// ── POST /api/calendar/check ─────────────────────────────────

router.post('/check', async (req: Request, res: Response) => {
  log('INFO', 'Calendar check request received', req.body)

  // Validate input
  const parsed = CheckAvailabilitySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: parsed.error.issues,
    })
  }

  const { date } = parsed.data
  const calendarId = process.env.BUSINESS_CALENDAR_ID ?? 'primary'

  try {
    // Build time boundaries for the full business day (IST)
    const dayStart = `${date}T09:00:00+05:30`
    const dayEnd = `${date}T18:00:00+05:30`

    // Call Corsair Google Calendar getAvailability
    const availability =
      await corsair.googlecalendar.api.calendar.getAvailability({
        timeMin: dayStart,
        timeMax: dayEnd,
        items: [{ id: calendarId }],
      })

    // Parse busy periods from response
    const busyPeriods: Array<{ start?: string; end?: string }> =
      availability?.calendars?.[calendarId]?.busy ?? []

    log('INFO', `Busy periods for ${date}`, busyPeriods)

    // Generate all possible slots (business hours: 9am-6pm IST, 30-min intervals)
    const allSlots = generateBusinessSlots(date)

    // Filter out busy slots and past slots
    const now = new Date()
    const availableSlots = allSlots.filter((slot) => {
      const slotStart = new Date(`${date}T${slot}:00+05:30`)
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)

      // 1. Filter out slots in the past
      if (slotStart.getTime() <= now.getTime()) {
        return false
      }

      // 2. Filter out slots that overlap with busy periods
      return !busyPeriods.some((busy) => {
        if (!busy.start || !busy.end) return false
        const busyStart = new Date(busy.start)
        const busyEnd = new Date(busy.end)
        // Slot overlaps with busy period
        return slotStart < busyEnd && slotEnd > busyStart
      })
    })

    log('SUCCESS', `Available slots for ${date}`, availableSlots)

    return res.json({
      success: true,
      date,
      available_slots: availableSlots,
      total_available: availableSlots.length,
      busy_periods: busyPeriods.length,
    })
  } catch (error) {
    log('ERROR', 'Calendar availability check failed', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to check calendar availability',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ── POST /api/calendar/book ──────────────────────────────────

router.post('/book', async (req: Request, res: Response) => {
  log('INFO', 'Calendar booking request received', req.body)

  const parsed = BookSlotSchema.safeParse(req.body)
  if (!parsed.success) {
    log('ERROR', 'Booking validation failed', parsed.error)
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: parsed.error.issues,
    })
  }

  const {
    date,
    time,
    customerName,
    customerEmail,
    sessionType,
    bookingId,
  } = parsed.data

  const calendarId = process.env.BUSINESS_CALENDAR_ID ?? 'primary'
  const businessName =
    process.env.BUSINESS_NAME ?? 'Lakshya IAS Academy'

  try {
    const startDateTime = buildISTDateTime(date, time)
    const endDateTime = buildSessionEndTime(date, time, sessionType)

    // Create the calendar event via Corsair
    const createdEvent = await corsair.googlecalendar.api.events.create({
      calendarId,
      conferenceDataVersion: 1, // Needed to generate the Google Meet link
      event: {
        summary: `${sessionType} — ${customerName}`,
        description: `
Lakshya IAS Academy — Mentorship Session

Student    : ${customerName}
Email      : ${customerEmail}
Session    : ${sessionType}
Booking ID : #${bookingId}

This session was booked via the Lakshya scheduling assistant (Arjun).
        `.trim(),
        start: {
          dateTime: startDateTime,
        },
        end: {
          dateTime: endDateTime,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
        status: 'confirmed',
        conferenceData: {
          createRequest: {
            requestId: bookingId, // unique string
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      } as any,
    })

    let finalEvent = createdEvent
    let hangoutLink = finalEvent.hangoutLink

    // If conference creation is pending/async, poll for it up to 3 times
    if (!hangoutLink && finalEvent.conferenceData?.createRequest?.status?.statusCode === 'pending') {
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const fetched = await corsair.googlecalendar.api.events.get({
          calendarId,
          id: finalEvent.id!,
        })
        if (fetched.hangoutLink) {
          finalEvent = fetched
          hangoutLink = fetched.hangoutLink
          break
        }
      }
    }

    log('INFO', 'Event created successfully', {
      eventId: finalEvent.id,
      link: finalEvent.htmlLink,
      meetLink: hangoutLink,
    })

    return res.json({
      success: true,
      eventId: finalEvent.id,
      summary: finalEvent.summary,
      startDateTime,
      endDateTime,
      sessionType,
      meetLink: hangoutLink,
      message: `Session booked successfully on Google Calendar`,
    })
  } catch (error) {
    log('ERROR', 'Calendar booking failed', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to create calendar event',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ── Helper: generate 30-min business hour slots ──────────────

function generateBusinessSlots(date: string): string[] {
  const slots: string[] = []
  const dayOfWeek = new Date(`${date}T12:00:00+05:30`).getDay()

  // Sunday = 0, closed
  if (dayOfWeek === 0) return []

  // 9:00 to 17:30 (last slot start, ends at 18:00)
  for (let hour = 9; hour < 18; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 17 && minute === 30) break
      slots.push(
        `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      )
    }
  }

  return slots
}

export default router
