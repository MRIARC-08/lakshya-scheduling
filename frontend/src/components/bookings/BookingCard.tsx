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

const SESSION_ICONS: Record<string, React.ReactNode> = {
  'Free Counselling Session':  <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>,
  'One-on-One Mentorship':     <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>,
  'Mock Interview':            <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>,
  'Study Plan Review':         <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>,
  'Answer Writing Workshop':   <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>,
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
        'bg-white rounded-3xl border shadow-sm p-6',
        'hover:shadow-md transition-all duration-300 group',
        isPast
          ? 'border-gray-100 opacity-60'
          : 'border-[#ebebeb] hover:border-[#1c1c1c] hover:-translate-y-1'
      )}
    >
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className={clsx(
          'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110',
          isPast
            ? 'bg-gray-100 text-gray-400'
            : 'bg-[#1c1c1c] text-white'
        )}>
          {icon}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#1c1c1c] truncate">
                {booking.session_type}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {dateHuman} • {timeHuman} IST
              </p>
            </div>

            {/* Status badges */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={clsx(
                'text-xs font-semibold px-2.5 py-1 rounded-full border',
                isPast
                  ? 'bg-gray-50 text-gray-500 border-gray-100'
                  : 'bg-[#1c1c1c] text-white border-[#1c1c1c]'
              )}>
                {isPast ? 'Completed' : 'Upcoming'}
              </span>

              {booking.email_sent && (
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 flex items-center gap-1 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Email sent
                </span>
              )}
            </div>
          </div>

          {/* Booking ref */}
          <div className="mt-4 pt-4 border-t border-gray-100
                          flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-md">
              REF: {booking.booking_ref}
            </span>
            {booking.google_event_id && (
              <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5 bg-[#fafafa] border border-[#ebebeb] px-2 py-1 rounded-md">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Calendar event created
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
