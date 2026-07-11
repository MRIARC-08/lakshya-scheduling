'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import MessageBubble, { Message } from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { getOrCreateGuestId } from '@/lib/guest'
import { v4 as uuidv4 } from 'uuid'
import clsx from 'clsx'

const WELCOME_MESSAGE: Message = {
  id:        'welcome',
  role:      'assistant',
  content:   'Namaste! 🙏 I\'m Arjun from Lakshya IAS Academy.\n\nWhether you\'re just starting your UPSC journey or preparing for your final attempt, I\'m here to help you book a session with our expert mentors.\n\nHow can I assist you today?',
  timestamp: new Date(),
}

const QUICK_REPLIES = [
  'Book a free counselling session',
  'What sessions do you offer?',
  'Is tomorrow available?',
  'Book for next Monday',
]

export default function ChatWindow() {
  const { data: session } = useSession()
  const [messages,  setMessages]  = useState<Message[]>([WELCOME_MESSAGE])
  const [input,     setInput]     = useState('')
  const [isTyping,  setIsTyping]  = useState(false)
  const [guestId,   setGuestId]   = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const headerRef      = useRef<HTMLDivElement>(null)

  // Init guest ID on mount and fetch history
  useEffect(() => {
    const initId = getOrCreateGuestId()
    setGuestId(initId)
    
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/chat/history?guestId=${initId}`)
        const data = await res.json()
        if (data.success && data.messages && data.messages.length > 0) {
          const historyMessages = data.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
          setMessages(historyMessages)
        }
      } catch (err) {
        console.error('Failed to load history:', err)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    
    fetchHistory()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Header entrance
  useGSAP(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0,   opacity: 1, duration: 0.5, ease: 'power2.out' }
    )
  }, { scope: containerRef })

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = {
      id:        uuidv4(),
      role:      'user',
      content:   text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          guestId: session?.user?.id ?? guestId,
        }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        id:        uuidv4(),
        role:      'assistant',
        content:   data.response,
        agent:     data.agent,
        confirmed: data.confirmed,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMsg])

    } catch {
      setMessages(prev => [...prev, {
        id:        uuidv4(),
        role:      'assistant',
        content:   'I apologize, I\'m facing a technical issue. Please try again in a moment. Zaroor! 🙏',
        timestamp: new Date(),
      }])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, guestId, session])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-gray-50"
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="bg-gradient-to-r from-navy-900 to-navy-800
                   text-white px-4 py-3 flex items-center gap-3
                   shadow-lg pt-20"
      >
        {/* Arjun avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br
                        from-saffron-400 to-saffron-600 flex items-center
                        justify-center text-white font-bold text-lg
                        shadow-md shrink-0">
          A
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Arjun</h2>
            <span className="bg-saffron-500/30 border border-saffron-500/50
                             text-saffron-300 text-xs px-2 py-0.5 rounded-full">
              Scheduling Assistant
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full
                             animate-pulse" />
            <span className="text-xs text-gray-400">
              Lakshya IAS Academy • Online
            </span>
          </div>
        </div>

        {/* Auth status */}
        <div className="text-right">
          {session ? (
            <div className="text-xs text-gray-400">
              <p className="text-green-400 font-medium">✓ Signed in</p>
              <p className="truncate max-w-28">
                {session.user?.email}
              </p>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              <p>Guest mode</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">

        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <span className="animate-pulse">Loading previous messages...</span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLast={i === messages.length - 1}
            />
          ))
        )}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies (show only initially) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => sendMessage(reply)}
              className="text-xs bg-white border border-gray-200
                         text-gray-600 hover:border-saffron-300
                         hover:text-saffron-600 px-3 py-1.5 rounded-full
                         transition-all shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 shadow-up">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-gray-50 border border-gray-200
                       rounded-2xl px-4 py-3 text-sm text-gray-800
                       placeholder-gray-400 focus:outline-none
                       focus:ring-2 focus:ring-saffron-300
                       focus:border-saffron-300 transition-all
                       max-h-32 leading-relaxed"
            style={{
              height: 'auto',
              minHeight: '48px',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className={clsx(
              'w-11 h-11 rounded-full flex items-center justify-center',
              'transition-all shrink-0',
              input.trim() && !isTyping
                ? 'bg-saffron-500 hover:bg-saffron-600 text-white shadow-md hover:scale-105 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <svg
              className="w-5 h-5 rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Arjun is an AI assistant • Sessions subject to availability
        </p>
      </div>
    </div>
  )
}
