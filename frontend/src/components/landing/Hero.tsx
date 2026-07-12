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

    // Animate the background paths
    gsap.fromTo('.path-flow',
      { strokeDashoffset: 100 },
      {
        strokeDashoffset: 0,
        duration: 8,
        repeat: -1,
        ease: 'none',
      }
    )

  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#f4f4f4] flex flex-col
                 items-center justify-center text-center px-4
                 relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="absolute inset-0 h-full w-full opacity-[0.15]" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <path className="path-flow" d="M-50 420 C 200 280, 400 520, 650 380 S 1100 300, 1250 450" fill="none" stroke="#1c1c1c" strokeWidth="2" strokeDasharray="6 8" />
          <path className="path-flow" d="M-80 520 C 250 400, 500 600, 750 480 S 1150 380, 1280 560" fill="none" stroke="#1c1c1c" strokeWidth="1.5" strokeDasharray="4 10" opacity="0.6"/>
          <path className="path-flow" d="M100 650 C 350 500, 550 700, 800 580 S 1050 450, 1200 620" fill="none" stroke="#1c1c1c" strokeWidth="1" strokeDasharray="3 12" opacity="0.4"/>
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f4f4f4]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Badge */}
        <div ref={badgeRef} className="mb-6">
          <span className="inline-flex items-center gap-2 bg-white
                           border border-[#ebebeb] text-[#1c1c1c] shadow-sm
                           text-sm font-medium px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-[#1c1c1c] rounded-full
                             animate-pulse" />
            India&apos;s Trusted UPSC Coaching
          </span>
        </div>

        {/* Hero Icon */}
        <div className="hero-emoji mx-auto mb-8 w-24 h-24 rounded-3xl bg-white border border-[#ebebeb] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <svg className="w-12 h-12 text-[#1c1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>

        {/* Heading */}
        <h1
          ref={headingRef}
          className="text-4xl md:text-6xl font-bold text-[#1c1c1c]
                     leading-tight mb-6 tracking-tight"
        >
          Crack UPSC with
          <span className="text-[#555] font-light italic tracking-normal"> Expert Guidance</span>
        </h1>

        {/* Subheading */}
        <p
          ref={subRef}
          className="text-lg md:text-xl text-[#1c1c1c]/70 max-w-2xl
                     mx-auto mb-10 leading-relaxed font-medium"
        >
          Book a free mentorship session with Lakshya IAS Academy&apos;s
          faculty. From Prelims to Personality Test — we&apos;ve guided
          thousands of aspirants to the UPSC final list.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/chat"
            className="group relative inline-flex items-center gap-2 bg-[#1c1c1c]
                       text-white font-semibold px-8 py-4 rounded-full text-lg
                       shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-300
                       hover:scale-[1.02] hover:bg-[#2a2a2a]
                       active:scale-[0.98] overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <span className="relative">Book Free Session</span>
            <svg className="w-5 h-5 relative transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
          <Link
            href="#sessions"
            className="inline-flex items-center gap-2 bg-white border border-[#ebebeb] text-[#1c1c1c]
                       font-medium px-8 py-4 rounded-full text-lg shadow-sm
                       transition-all duration-300 hover:bg-[#fafafa]"
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
              <p className="text-2xl font-bold text-[#1c1c1c]">
                {stat.number}
              </p>
              <p className="text-xs text-[#1c1c1c]/60 mt-1 font-medium tracking-wide uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
