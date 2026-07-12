'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'

export default function TypingIndicator() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Entrance animation
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 10, scale: 0.95 },
      { opacity: 1, y: 0,  scale: 1,
        duration: 0.3, ease: 'back.out(1.7)' }
    )

    // Staggered dot animation
    gsap.to('.typing-dot', {
      y:        -6,
      duration: 0.4,
      repeat:   -1,
      yoyo:     true,
      stagger:  0.15,
      ease:     'sine.inOut',
    })
  }, { scope: containerRef })

  return (
    <div className="flex items-start gap-3 mb-4">

      {/* Arjun avatar */}
      <div className="w-8 h-8 rounded-full bg-white border border-[#ebebeb] flex items-center
                      justify-center text-[#1c1c1c] text-sm font-bold
                      shrink-0 shadow-sm mb-1">
        A
      </div>

      {/* Bubble */}
      <div
        ref={containerRef}
        className="bg-white border border-[#ebebeb] rounded-2xl
                   rounded-tl-none px-4 py-3 shadow-sm"
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="typing-dot w-2 h-2 rounded-full
                         bg-gray-400"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
