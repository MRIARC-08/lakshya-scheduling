'use client'

import { signIn }  from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap        from 'gsap'
import { Suspense, useRef }  from 'react'
import Link        from 'next/link'

function LoginForm() {
  const searchParams  = useSearchParams()
  const callbackUrl   = searchParams.get('callbackUrl') ?? '/chat'
  const containerRef  = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(
      '.login-card',
      { y: 40, opacity: 0, scale: 0.95 },
      { y: 0,  opacity: 1, scale: 1,
        duration: 0.6, ease: 'back.out(1.4)' }
    )
  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-navy-900
                 to-navy-800 flex items-center justify-center px-4"
    >
      <div className="login-card w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl
                        overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-saffron-500
                          to-orange-600 px-8 py-8 text-center">
            <div className="text-5xl mb-3 hidden"></div>
            <h1 className="text-white font-bold text-xl">
              Lakshya IAS Academy
            </h1>
            <p className="text-orange-100 text-sm mt-1">
              Sign in to manage your sessions
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-2">
              Welcome back!
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Sign in with Google to access your booking history
              and skip filling in your details every time.
            </p>

            {/* Google sign in */}
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3
                         border-2 border-gray-200 hover:border-saffron-300
                         rounded-2xl py-3.5 px-4 text-gray-700
                         font-medium transition-all hover:bg-saffron-50
                         active:scale-95"
            >
              {/* Google logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Guest option */}
            <Link
              href="/chat"
              className="w-full flex items-center justify-center
                         text-sm text-gray-500 hover:text-saffron-600
                         transition-colors font-medium"
            >
              Continue as guest →
            </Link>

            <p className="text-xs text-gray-400 text-center mt-6
                          leading-relaxed">
              By signing in you agree to our terms.
              We only use your name and email for scheduling.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm
                       transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
