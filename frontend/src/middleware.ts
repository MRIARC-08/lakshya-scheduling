import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn   = !!req.auth

  // Only /bookings requires auth
  if (pathname.startsWith('/bookings') && !isLoggedIn) {
    return NextResponse.redirect(
      new URL('/login?callbackUrl=/bookings', req.url)
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/bookings/:path*'],
}
