'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const navRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.fromTo(
      navRef.current,
      { y: -60, opacity: 0 },
      { y: 0,   opacity: 1, duration: 0.6, ease: 'power2.out' }
    )
  }, [])

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95
                 backdrop-blur-sm border-b border-gray-100 shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 h-16
                      flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="font-bold text-navy-900 leading-none text-sm">
              Lakshya IAS
            </p>
            <p className="text-xs text-gray-500 leading-none">
              Academy
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/chat"
            className="text-sm text-gray-600 hover:text-saffron-500
                       transition-colors font-medium"
          >
            Book Session
          </Link>
          {session && (
            <Link
              href="/bookings"
              className="text-sm text-gray-600 hover:text-saffron-500
                         transition-colors font-medium"
            >
              My Bookings
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-saffron-200"
                />
              )}
              <span className="text-sm text-gray-700 hidden md:block">
                {session.user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="text-xs text-gray-500 hover:text-red-500
                           transition-colors border border-gray-200
                           rounded-full px-3 py-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-2 bg-saffron-500
                         hover:bg-saffron-600 text-white text-sm
                         font-medium px-4 py-2 rounded-full
                         transition-colors shadow-sm"
            >
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
