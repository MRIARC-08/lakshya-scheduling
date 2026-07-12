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
      className="fixed top-0 left-0 right-0 z-50 p-4 transition-all duration-300 pointer-events-none"
    >
      <div className="max-w-6xl mx-auto h-16 bg-white/80 backdrop-blur-md border border-[#ebebeb] shadow-sm flex items-center justify-between px-6 relative pointer-events-auto">
        
        {/* Corner crosses */}
        <span className="absolute -top-[12px] -left-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none">+</span>
        <span className="absolute -top-[12px] -right-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none">+</span>
        <span className="absolute -bottom-[12px] -left-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none">+</span>
        <span className="absolute -bottom-[12px] -right-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none">+</span>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5">
            <span className="text-white font-bold text-lg tracking-tight">LA</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-none text-[15px] tracking-tight">
              Lakshya IAS
            </p>
            <p className="text-[11px] text-gray-500 font-medium tracking-wider uppercase mt-1">
              Academy
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/chat?new=true"
            className="text-sm text-gray-600 hover:text-gray-900
                       transition-colors font-medium relative group"
          >
            Book Session
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
          </Link>
          {session && (
            <Link
              href="/bookings"
              className="text-sm text-gray-600 hover:text-gray-900
                         transition-colors font-medium relative group"
            >
              My Bookings
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
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
                  className="rounded-full ring-2 ring-gray-200"
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
              className="flex items-center gap-2 bg-black
                         hover:bg-gray-800 text-white text-sm
                         font-medium px-5 py-2.5 rounded-full
                         transition-all shadow-md hover:shadow-lg
                         hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
