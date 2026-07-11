import { auth }        from '@/lib/auth'
import { getOrCreateGuestId } from '@/lib/guest'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  const body    = await req.json()
  const { message, guestId } = body

  // Build thread ID — authenticated users use their ID
  // guests use the guestId from client
  const threadId = session?.user?.id ?? guestId ?? 'anonymous'

  const userContext = {
    is_authenticated: !!session?.user,
    email:   session?.user?.email   ?? null,
    name:    session?.user?.name    ?? null,
    user_id: session?.user?.id      ?? null,
  }

  try {
    const agentUrl = process.env.AGENT_URL ?? 'http://localhost:8000'

    const agentRes = await fetch(`${agentUrl}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        thread_id:    threadId,
        user_context: userContext,
      }),
    })

    if (!agentRes.ok) {
      throw new Error(`Agent error: ${agentRes.status}`)
    }

    const data = await agentRes.json()
    return NextResponse.json(data)

  } catch (err) {
    console.error('Chat proxy error:', err)
    return NextResponse.json(
      {
        response: "I'm having a little trouble right now. Please try again in a moment. Zaroor!",
        agent:    'error',
      },
      { status: 500 }
    )
  }
}
