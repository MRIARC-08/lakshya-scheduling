'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import Link from 'next/link'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headingRef   = useRef<HTMLHeadingElement>(null)
  const subRef       = useRef<HTMLParagraphElement>(null)
  const ctaRef       = useRef<HTMLDivElement>(null)
  const badgeRef     = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(
      badgeRef.current,
      { y: 30, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.6 }
    )
    .fromTo(
      headingRef.current,
      { y: 50, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.8 },
      '-=0.3'
    )
    .fromTo(
      subRef.current,
      { y: 30, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.7 },
      '-=0.4'
    )
    .fromTo(
      ctaRef.current,
      { y: 20, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.6 },
      '-=0.3'
    )

    // Floating animation on the emoji
    gsap.to('.hero-emoji', {
      y:        -12,
      duration: 2,
      repeat:   -1,
      yoyo:     true,
      ease:     'sine.inOut',
    })

  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-navy-900
                 via-navy-800 to-navy-900 flex flex-col
                 items-center justify-center text-center px-4
                 relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64
                        rounded-full bg-saffron-500 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96
                        rounded-full bg-saffron-400 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Badge */}
        <div ref={badgeRef} className="mb-6">
          <span className="inline-flex items-center gap-2 bg-saffron-500/20
                           border border-saffron-500/40 text-saffron-300
                           text-sm font-medium px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-saffron-400 rounded-full
                             animate-pulse" />
            India&apos;s Trusted UPSC Coaching
          </span>
        </div>

        {/* Emoji */}
        <div className="hero-emoji text-7xl mb-6">🎯</div>

        {/* Heading */}
        <h1
          ref={headingRef}
          className="text-4xl md:text-6xl font-bold text-white
                     leading-tight mb-6"
        >
          Crack UPSC with
          <span className="text-saffron-400"> Expert Guidance</span>
        </h1>

        {/* Subheading */}
        <p
          ref={subRef}
          className="text-lg md:text-xl text-gray-300 max-w-2xl
                     mx-auto mb-10 leading-relaxed"
        >
          Book a free mentorship session with Lakshya IAS Academy&apos;s
          faculty. From Prelims to Personality Test — we&apos;ve guided
          thousands of aspirants to the UPSC final list.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row
                                      gap-4 justify-center">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-saffron-500
                       hover:bg-saffron-400 text-white font-semibold
                       px-8 py-4 rounded-full text-lg transition-all
                       shadow-lg shadow-saffron-500/30 hover:scale-105
                       active:scale-95"
          >
            <span>Book Free Session</span>
            <span>→</span>
          </Link>
          <Link
            href="#sessions"
            className="inline-flex items-center gap-2 border
                       border-white/30 hover:border-white/60 text-white
                       font-medium px-8 py-4 rounded-full text-lg
                       transition-all hover:bg-white/10"
          >
            View Session Types
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { number: '2,000+', label: 'Aspirants Guided' },
            { number: '150+',   label: 'Selections' },
            { number: '10+',    label: 'Years Experience' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-saffron-400">
                {stat.number}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
