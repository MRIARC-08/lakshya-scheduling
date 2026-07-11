'use client'

import { useGSAP } from '@gsap/react'
import gsap        from 'gsap'
import { useRef }  from 'react'
import clsx        from 'clsx'
import type { Booking } from '@/lib/db'

interface Props {
  booking: Booking
  index:   number
}

const SESSION_ICONS: Record<string, string> = {
  'Free Counselling Session':  '💬',
  'One-on-One Mentorship':     '🎓',
  'Mock Interview':            '🎤',
  'Study Plan Review':         '📋',
  'Answer Writing Workshop':   '✍️',
}

export default function BookingCard({ booking, index }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 30 },
      {
        opacity:  1,
        y:        0,
        duration: 0.5,
        delay:    index * 0.08,
        ease:     'power2.out',
      }
    )
  }, { scope: ref })

  // Format date
  const dateObj    = new Date(booking.date + 'T12:00:00')
  const dateHuman  = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })

  // Format time
  const [h, m]    = booking.time.split(':')
  const timeObj   = new Date()
  timeObj.setHours(parseInt(h), parseInt(m))
  const timeHuman = timeObj.toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  const isPast   = new Date(booking.date) < new Date()
  const icon     = SESSION_ICONS[booking.session_type] ?? '📅'

  return (
    <div
      ref={ref}
      className={clsx(
        'bg-white rounded-2xl border shadow-sm p-5',
        'hover:shadow-md transition-all',
        isPast
          ? 'border-gray-100 opacity-70'
          : 'border-saffron-100 hover:border-saffron-200'
      )}
    >
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'text-2xl shrink-0',
          isPast
            ? 'bg-gray-100'
            : 'bg-gradient-to-br from-saffron-50 to-orange-50'
        )}>
          {icon}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-navy-900 truncate">
                {booking.session_type}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {dateHuman} • {timeHuman} IST
              </p>
            </div>

            {/* Status badges */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={clsx(
                'text-xs font-semibold px-2.5 py-1 rounded-full',
                isPast
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-green-100 text-green-700'
              )}>
                {isPast ? 'Completed' : 'Upcoming'}
              </span>

              {booking.email_sent && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <span>✉️</span> Email sent
                </span>
              )}
            </div>
          </div>

          {/* Booking ref */}
          <div className="mt-3 pt-3 border-t border-gray-50
                          flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">
              {booking.booking_ref}
            </span>
            {booking.google_event_id && (
              <span className="text-xs text-blue-500 flex items-center gap-1">
                📆 Calendar event created
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
