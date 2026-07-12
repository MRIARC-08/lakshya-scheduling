'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState, useEffect } from 'react'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const isChatPage = pathname === '/chat'
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none",
        isChatPage ? "p-0" : "p-4"
      )}
    >
      <div className={clsx(
        "mx-auto h-16 flex items-center justify-between px-6 relative pointer-events-auto transition-all duration-500",
        isChatPage ? "w-full max-w-none bg-white border-b border-[#ebebeb] shadow-none" :
        isScrolled ? "max-w-4xl bg-white/80 backdrop-blur-md border border-[#ebebeb] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] mt-2" : "max-w-6xl bg-white/80 backdrop-blur-md border border-[#ebebeb] rounded-none shadow-sm mt-0"
      )}>
        
        {/* Corner crosses - Hide on chat page */}
        {!isChatPage && (
          <>
            <span className={clsx("absolute -top-[12px] -left-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none transition-opacity duration-300", isScrolled ? "opacity-0" : "opacity-100")}>+</span>
            <span className={clsx("absolute -top-[12px] -right-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none transition-opacity duration-300", isScrolled ? "opacity-0" : "opacity-100")}>+</span>
            <span className={clsx("absolute -bottom-[12px] -left-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none transition-opacity duration-300", isScrolled ? "opacity-0" : "opacity-100")}>+</span>
            <span className={clsx("absolute -bottom-[12px] -right-[5px] text-[#a3a3a3] leading-none text-xl font-light pointer-events-none transition-opacity duration-300", isScrolled ? "opacity-0" : "opacity-100")}>+</span>
          </>
        )}

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
                       transition-colors font-medium relative"
          >
            Book Session
          </Link>
          {session && (
            <Link
              href="/bookings"
              className="text-sm text-gray-600 hover:text-gray-900
                         transition-colors font-medium relative"
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
