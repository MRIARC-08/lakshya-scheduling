import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { corsair } from '../corsair'
import {
  buildRawEmail,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,
} from '../utils/mime'
import { log } from '../utils/logger'

const router = Router()

// ── Validation schema ────────────────────────────────────────

const SendEmailSchema = z.object({
  to: z.string().email(),
  customerName: z.string().min(1),
  sessionType: z.string(),
  date: z.string(),   // human readable: "Wednesday, January 22, 2025"
  time: z.string(),   // human readable: "3:00 PM"
  bookingId: z.string(),
  meetLink: z.string().optional(),
})

// ── POST /api/email/send ─────────────────────────────────────

router.post('/send', async (req: Request, res: Response) => {
  log('INFO', 'Email send request received', {
    to: req.body.to,
    bookingId: req.body.bookingId,
  })

  const parsed = SendEmailSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: parsed.error.errors,
    })
  }

  const {
    to,
    customerName,
    sessionType,
    date,
    time,
    bookingId,
    meetLink,
  } = parsed.data

  const fromEmail =
    process.env.BUSINESS_EMAIL ?? 'appointments@lakshyaias.in'
  const fromName =
    process.env.BUSINESS_NAME ?? 'Lakshya IAS Academy'

  try {
    // Build email content
    const htmlBody = buildConfirmationEmailHtml({
      customerName,
      sessionType,
      date,
      time,
      bookingId,
      meetLink,
    })

    const textBody = buildConfirmationEmailText({
      customerName,
      sessionType,
      date,
      time,
      bookingId,
      meetLink,
    })

    // Build RFC 2822 base64url encoded raw email
    const rawEmail = buildRawEmail({
      from: fromEmail,
      fromName,
      to,
      subject: `Your ${sessionType} at Lakshya IAS is Confirmed! 🎯`,
      htmlBody,
      textBody,
    })

    // Send via Corsair Gmail plugin
    const result = await corsair.gmail.api.messages.send({
      userId: 'me',
      raw: rawEmail,
    })

    log('SUCCESS', 'Confirmation email sent', {
      messageId: result.id,
      to,
      bookingId,
    })

    return res.json({
      success: true,
      messageId: result.id,
      to,
      subject: `Your ${sessionType} at Lakshya IAS is Confirmed! 🎯`,
      message: `Confirmation email sent to ${to}`,
    })
  } catch (error) {
    log('ERROR', 'Email send failed', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to send confirmation email',
      message: error instanceof Error ? error.message : 'Unknown error',
      note: 'Booking is still confirmed on calendar — email can be retried',
    })
  }
})

export default router
