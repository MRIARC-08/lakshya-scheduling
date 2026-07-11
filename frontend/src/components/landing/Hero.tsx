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
      className="min-h-screen bg-navy-900 bg-grid-pattern flex flex-col
                 items-center justify-center text-center px-4
                 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-1/4 w-[150%] h-[150%] animate-float mix-blend-screen opacity-40">
          <div className="absolute top-20 left-1/3 w-96 h-96 rounded-full bg-saffron-500 blur-[128px]" />
          <div className="absolute bottom-20 right-1/3 w-[500px] h-[500px] rounded-full bg-navy-400 blur-[128px]" />
        </div>
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

        {/* Hero Icon */}
        <div className="hero-emoji mx-auto mb-8 w-24 h-24 rounded-3xl bg-gradient-to-br from-navy-800 to-navy-900 border border-white/10 flex items-center justify-center shadow-2xl">
          <svg className="w-12 h-12 text-saffron-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>

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
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/chat"
            className="group relative inline-flex items-center gap-2 bg-saffron-500
                       text-white font-semibold px-8 py-4 rounded-full text-lg
                       shadow-[0_0_40px_rgba(255,107,0,0.3)] transition-all duration-300
                       hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,107,0,0.5)]
                       active:scale-[0.98] overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <span className="relative">Book Free Session</span>
            <svg className="w-5 h-5 relative transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
          <Link
            href="#sessions"
            className="inline-flex items-center gap-2 glass-dark text-white
                       font-medium px-8 py-4 rounded-full text-lg
                       transition-all duration-300 hover:bg-white/10 hover:shadow-lg"
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
