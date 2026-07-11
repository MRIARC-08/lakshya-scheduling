import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  
  // Extract guestId from query params
  const searchParams = req.nextUrl.searchParams
  const guestId = searchParams.get('guestId')
  
  const threadId = session?.user?.id ?? guestId ?? 'anonymous'
  
  if (threadId === 'anonymous') {
    return NextResponse.json({ success: true, messages: [] })
  }

  try {
    const agentUrl = process.env.AGENT_URL ?? 'http://localhost:8000'
    const agentRes = await fetch(`${agentUrl}/chat/history/${threadId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })

    if (!agentRes.ok) {
      throw new Error(`Agent error: ${agentRes.status}`)
    }

    const data = await agentRes.json()
    return NextResponse.json(data)

  } catch (err) {
    console.error('Chat history proxy error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history', messages: [] },
      { status: 500 }
    )
  }
}
