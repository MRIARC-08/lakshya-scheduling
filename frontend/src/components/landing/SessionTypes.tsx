'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import Link from 'next/link'

gsap.registerPlugin(ScrollTrigger)

const sessions = [
  {
    icon:     '💬',
    name:     'Free Counselling',
    duration: '30 min',
    desc:     'Perfect first step. Understand your preparation level and get a roadmap.',
    color:    'from-green-500 to-emerald-600',
    free:     true,
  },
  {
    icon:     '🎓',
    name:     'One-on-One Mentorship',
    duration: '60 min',
    desc:     'Deep dive session with expert faculty. Covers strategy, optionals, and weak areas.',
    color:    'from-saffron-500 to-orange-600',
    free:     false,
  },
  {
    icon:     '🎤',
    name:     'Mock Interview',
    duration: '45 min',
    desc:     'Simulate the UPSC Personality Test. Get detailed feedback from ex-bureaucrats.',
    color:    'from-purple-500 to-violet-600',
    free:     false,
  },
  {
    icon:     '📋',
    name:     'Study Plan Review',
    duration: '30 min',
    desc:     'Get your study plan reviewed and optimized for your target year.',
    color:    'from-blue-500 to-indigo-600',
    free:     false,
  },
  {
    icon:     '✍️',
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
      className="py-24 bg-gray-50 px-4"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
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
              className="bg-white rounded-2xl p-6 shadow-sm
                         border border-gray-100 hover:shadow-md
                         transition-all hover:-translate-y-1 group"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center
                               w-12 h-12 rounded-xl bg-gradient-to-br
                               ${session.color} text-2xl mb-4`}>
                {session.icon}
              </div>

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-navy-900 text-lg
                               leading-tight">
                  {session.name}
                </h3>
                {session.free && (
                  <span className="bg-green-100 text-green-700 text-xs
                                   font-bold px-2 py-1 rounded-full ml-2
                                   shrink-0">
                    FREE
                  </span>
                )}
              </div>

              {/* Duration */}
              <p className="text-saffron-500 text-sm font-medium mb-3">
                ⏱ {session.duration}
              </p>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {session.desc}
              </p>

              {/* CTA */}
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 text-navy-700
                           hover:text-saffron-500 text-sm font-medium
                           transition-colors group-hover:gap-2"
              >
                Book this session
                <span className="transition-all">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
