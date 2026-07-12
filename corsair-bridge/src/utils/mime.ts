/**
 * RFC 2822 MIME email builder
 * Gmail messages.send requires base64url encoded RFC 2822
 * NOT plain text — this utility handles the full construction
 */

interface EmailOptions {
  from: string
  fromName: string
  to: string
  subject: string
  htmlBody: string
  textBody: string
}

function chunkBase64(str: string): string {
  const chunks = []
  for (let i = 0; i < str.length; i += 76) {
    chunks.push(str.slice(i, i + 76))
  }
  return chunks.join('\r\n')
}

/**
 * Build RFC 2822 compliant MIME message string
 */
function buildMimeMessage(options: EmailOptions): string {
  const { from, fromName, to, subject, htmlBody, textBody } = options

  const boundary = `boundary_lakshya_${Date.now()}`
  const domain = from.split('@')[1] || 'lakshyaias.in'
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${domain}>`
  const dateStr = new Date().toUTCString()

  const base64Text = chunkBase64(Buffer.from(textBody, 'utf-8').toString('base64'))
  const base64Html = chunkBase64(Buffer.from(htmlBody, 'utf-8').toString('base64'))

  const mimeLines = [
    `From: ${fromName} <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${dateStr}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Html,
    ``,
    `--${boundary}--`,
  ]

  return mimeLines.join('\r\n')
}

/**
 * Encode MIME string to base64url
 * Standard base64, then:
 * + → -
 * / → _
 * remove trailing =
 */
function toBase64Url(input: string): string {
  const base64 = Buffer.from(input).toString('base64')
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Build complete base64url encoded RFC 2822 email
 * Ready to pass directly to gmail.api.messages.send({ raw })
 */
export function buildRawEmail(options: EmailOptions): string {
  const mimeMessage = buildMimeMessage(options)
  return toBase64Url(mimeMessage)
}

/**
 * Build the HTML email body for booking confirmation
 */
export function buildConfirmationEmailHtml(params: {
  customerName: string
  sessionType: string
  date: string
  time: string
  bookingId: string
  meetLink?: string
}): string {
  const { customerName, sessionType, date, time, bookingId, meetLink } = params

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Session Confirmed - Lakshya IAS Academy</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:560px;">
          
          <tr>
            <td style="background-color:#1c1c1c;padding:30px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:28px;letter-spacing:1px;">
                Lakshya IAS Academy
              </h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:14px;">
                Your Journey to Civil Services Starts Here
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f4f4f4;padding:16px;text-align:center;border-bottom:1px solid #ebebeb;">
              <h2 style="color:#1c1c1c;margin:0;font-size:20px;">
                Session Confirmed!
              </h2>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="font-size:16px;color:#333;margin-top:0;">
                Dear <strong>${customerName}</strong>,
              </p>
              <p style="font-size:15px;color:#555;line-height:1.6;">
                Your mentorship session at Lakshya IAS Academy has been 
                successfully booked. We look forward to supporting your 
                UPSC preparation journey!
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;border:1px solid #ebebeb;border-left:4px solid #1c1c1c;border-radius:4px;margin:24px 0;">
                <tr>
                  <td style="padding:20px;">
                    <h3 style="color:#1c1c1c;margin:0 0 16px 0;font-size:16px;">
                      Booking Details
                    </h3>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:8px 0;color:#888;font-size:14px;width:40%;">Session Type</td>
                        <td style="padding:8px 0;color:#333;font-size:14px;font-weight:bold;">${sessionType}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#888;font-size:14px;">Date</td>
                        <td style="padding:8px 0;color:#333;font-size:14px;font-weight:bold;">${date}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#888;font-size:14px;">Time</td>
                        <td style="padding:8px 0;color:#333;font-size:14px;font-weight:bold;">${time} IST</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#888;font-size:14px;">Mode</td>
                        <td style="padding:8px 0;color:#333;font-size:14px;font-weight:bold;">
                          ${meetLink ? `<a href="${meetLink}" style="color:#1c1c1c;text-decoration:underline;" target="_blank">Google Meet Link</a>` : 'Online (link shared before session)'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#888;font-size:14px;">Booking ID</td>
                        <td style="padding:8px 0;color:#333;font-size:14px;font-weight:bold;">#${bookingId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;border:1px solid #ebebeb;border-radius:4px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="color:#1c1c1c;font-size:14px;margin:0 0 8px 0;font-weight:bold;">
                      To make the most of your session:
                    </p>
                    <ul style="color:#555;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
                      <li>Keep your current preparation status ready</li>
                      <li>Note down your doubts and questions beforehand</li>
                      <li>Have your optional subject choice in mind</li>
                      <li>Be ready 5 minutes before your slot</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #eee;padding-top:20px;text-align:center;">
                    <p style="font-size:15px;color:#555;font-style:italic;margin:0 0 16px 0;">
                      "Every expert was once a beginner. Every champion 
                       was once a contender that refused to give up."
                    </p>
                    <p style="margin:0;font-size:16px;color:#1c1c1c;font-weight:bold;">
                      All the best on your UPSC journey!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#1c1c1c;padding:20px;text-align:center;">
              <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">
                Lakshya IAS Academy | Mukherjee Nagar, New Delhi
              </p>
              <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0 0;">
                appointments@lakshyaias.in | lakshyaias.in
              </p>
              <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:8px 0 0 0;">
                Jai Hind
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim()
}

/**
 * Plain text fallback for email clients that don't render HTML
 */
export function buildConfirmationEmailText(params: {
  customerName: string
  sessionType: string
  date: string
  time: string
  bookingId: string
  meetLink?: string
}): string {
  const { customerName, sessionType, date, time, bookingId, meetLink } = params

  return `
Dear ${customerName},

Your session at Lakshya IAS Academy has been confirmed!

BOOKING DETAILS
---------------
Session Type : ${sessionType}
Date         : ${date}
Time         : ${time} IST
Mode         : ${meetLink ? `Online via Google Meet: ${meetLink}` : 'Online (link shared before session)'}
Booking ID   : #${bookingId}

To make the most of your session:
- Keep your current preparation status ready
- Note down your doubts and questions beforehand
- Have your optional subject choice in mind
- Be ready 5 minutes before your slot

All the best on your UPSC journey!

---
Lakshya IAS Academy
Mukherjee Nagar, New Delhi
appointments@lakshyaias.in | lakshyaias.in
Jai Hind
  `.trim()
}
