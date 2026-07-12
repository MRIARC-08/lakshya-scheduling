'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import Link from 'next/link'

gsap.registerPlugin(ScrollTrigger)

const sessions = [
  {
    icon: (
      <svg className="w-6 h-6 text-[#1c1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
    ),
    name:     'Free Counselling',
    duration: '30 min',
    desc:     'Perfect first step. Understand your preparation level and get a roadmap.',
    color:    'from-green-500 to-emerald-600',
    free:     true,
  },
  {
    icon: (
      <svg className="w-6 h-6 text-[#1c1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>
    ),
    name:     'One-on-One Mentorship',
    duration: '60 min',
    desc:     'Deep dive session with expert faculty. Covers strategy, optionals, and weak areas.',
    color:    'from-saffron-500 to-orange-600',
    free:     false,
  },
  {
    icon: (
      <svg className="w-6 h-6 text-[#1c1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
    ),
    name:     'Mock Interview',
    duration: '45 min',
    desc:     'Simulate the UPSC Personality Test. Get detailed feedback from ex-bureaucrats.',
    color:    'from-purple-500 to-violet-600',
    free:     false,
  },
  {
    icon: (
      <svg className="w-6 h-6 text-[#1c1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
    ),
    name:     'Study Plan Review',
    duration: '30 min',
    desc:     'Get your study plan reviewed and optimized for your target year.',
    color:    'from-blue-500 to-indigo-600',
    free:     false,
  },
  {
    icon: (
      <svg className="w-6 h-6 text-[#1c1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
    ),
    name:     'Answer Writing',
    duration: '90 min',
    desc:     'Intensive GS and Essay answer writing workshop with faculty evaluation.',
    color:    'from-rose-500 to-pink-600',
    free:     false,
  },
]

export default function SessionTypes() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef   = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(
      cardsRef.current?.children ?? [],
      { y: 60, opacity: 0 },
      {
        y:        0,
        opacity:  1,
        duration: 0.6,
        stagger:  0.1,
        ease:     'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start:   'top 80%',
        },
      }
    )
  }, { scope: sectionRef })

  return (
    <section
      id="sessions"
      ref={sectionRef}
      className="py-24 bg-white border-t border-[#ebebeb] px-4"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1c1c1c] tracking-tight mb-4">
            Choose Your Session
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            From your first inquiry to your final interview,
            Lakshya IAS has a session for every stage.
          </p>
        </div>

        {/* Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sessions.map((session) => (
            <div
              key={session.name}
              className="relative bg-[#fafafa] rounded-3xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                         border border-[#ebebeb] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                         transition-all duration-300 hover:-translate-y-2 group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-150"></div>

              {/* Icon */}
              <div className={`inline-flex items-center justify-center
                                w-14 h-14 rounded-2xl bg-white border border-[#ebebeb]
                                shadow-sm mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {session.icon}
              </div>

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-[#1c1c1c] text-xl
                                leading-tight">
                  {session.name}
                </h3>
                {session.free && (
                  <span className="bg-[#1c1c1c] text-white text-[10px] uppercase tracking-wider
                                   font-bold px-3 py-1.5 rounded-full ml-3
                                   shrink-0 shadow-sm border border-[#1c1c1c]">
                    FREE
                  </span>
                )}
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1.5 text-[#1c1c1c]/70 text-sm font-semibold mb-4 bg-white border border-[#ebebeb] w-max px-3 py-1 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {session.duration}
              </div>

              {/* Description */}
              <p className="text-gray-500 text-[15px] leading-relaxed mb-8 h-12">
                {session.desc}
              </p>

              {/* CTA */}
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 text-[#1c1c1c]
                           hover:text-[#555] text-sm font-bold uppercase tracking-wide
                           transition-colors group-hover:gap-3"
              >
                Book this session
                <span className="transition-all bg-[#ebebeb] w-6 h-6 rounded-full flex items-center justify-center group-hover:bg-[#1c1c1c] group-hover:text-white border border-transparent group-hover:border-[#1c1c1c]">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
