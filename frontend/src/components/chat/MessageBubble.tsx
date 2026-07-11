'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export interface Message {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  agent?:    string
  confirmed?: boolean
  timestamp:  Date
}

interface Props {
  message: Message
  isLast:  boolean
}

export default function MessageBubble({ message, isLast }: Props) {
  const { data: session } = useSession()
  const ref = useRef<HTMLDivElement>(null)
  const isUser = message.role === 'user'

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      {
        opacity:   0,
        x:         isUser ? 20 : -20,
        scale:     0.95,
      },
      {
        opacity:   1,
        x:         0,
        scale:     1,
        duration:  0.35,
        ease:      'back.out(1.4)',
      }
    )

    // Celebration burst if booking confirmed
    if (message.confirmed && isLast) {
      gsap.fromTo(
        '.confirmed-badge',
        { scale: 0, opacity: 0, rotate: -10 },
        {
          scale:    1,
          opacity:  1,
          rotate:   0,
          duration: 0.5,
          delay:    0.3,
          ease:     'elastic.out(1, 0.5)',
        }
      )
    }
  }, { scope: ref })

  return (
    <div
      ref={ref}
      className={clsx(
        'flex items-end gap-2 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br
                        from-saffron-500 to-navy-700 flex items-center
                        justify-center text-white text-sm font-bold
                        shrink-0 shadow-sm mb-1">
          A
        </div>
      )}

      {isUser && session?.user?.image && (
        <Image
          src={session.user.image}
          alt="You"
          width={32}
          height={32}
          className="rounded-full shrink-0 mb-1 shadow-sm"
        />
      )}

      {isUser && !session?.user?.image && (
        <div className="w-8 h-8 rounded-full bg-navy-600
                        flex items-center justify-center
                        text-white text-sm font-bold shrink-0 mb-1">
          Y
        </div>
      )}

      {/* Message content */}
      <div className={clsx('max-w-[75%]', isUser ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>

        {/* Agent label */}
        {!isUser && (
          <span className="text-xs text-gray-400 ml-1">
            Arjun • Lakshya IAS
          </span>
        )}

        {/* Bubble */}
        <div
          className={clsx(
            'px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed overflow-hidden shadow-sm transition-all',
            isUser
              ? 'bg-gradient-to-br from-saffron-500 to-saffron-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
          )}
        >
          {isUser ? (
            message.content.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < message.content.split('\n').length - 1 && <br />}
              </span>
            ))
          ) : (
            <div className="prose prose-sm prose-saffron max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Confirmed badge */}
        {message.confirmed && (
          <div className="confirmed-badge flex items-center gap-1
                          bg-green-100 text-green-700 text-xs
                          font-semibold px-3 py-1.5 rounded-full
                          border border-green-200 ml-1 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Session Confirmed!</span>
          </div>
        )}

        {/* Timestamp */}
        <span className={clsx(
          'text-xs text-gray-400',
          isUser ? 'mr-1' : 'ml-1'
        )}>
          {message.timestamp.toLocaleTimeString('en-IN', {
            hour:   '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
