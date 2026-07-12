'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import MessageBubble, { Message } from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { v4 as uuidv4 } from 'uuid'
import clsx from 'clsx'

interface ChatWindowProps {
  threadId: string
  onNewMessage?: (message: string) => void
}

const WELCOME_MESSAGE: Message = {
  id:        'welcome',
  role:      'assistant',
  content:   'Namaste! I\'m Arjun from Lakshya IAS Academy.\n\nWhether you\'re just starting your UPSC journey or preparing for your final attempt, I\'m here to help you book a session with our expert mentors.\n\nHow can I assist you today?',
  timestamp: new Date(),
}

const QUICK_REPLIES = [
  'Book a free counselling session',
  'What sessions do you offer?',
  'Is tomorrow available?',
  'Book for next Monday',
]

export default function ChatWindow({ threadId, onNewMessage }: ChatWindowProps) {
  const { data: session } = useSession()
  const [messages,  setMessages]  = useState<Message[]>([WELCOME_MESSAGE])
  const [input,     setInput]     = useState('')
  const [isTyping,  setIsTyping]  = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const headerRef      = useRef<HTMLDivElement>(null)

  // Fetch history when threadId changes
  useEffect(() => {
    async function fetchHistory() {
      setIsLoadingHistory(true)
      setMessages([WELCOME_MESSAGE])
      
      try {
        const res = await fetch(`/api/chat/history?threadId=${threadId}`)
        const data = await res.json()
        if (data.success && data.messages && data.messages.length > 0) {
          const historyMessages = data.messages.map((m: { timestamp: string | number | Date }) => ({
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
  }, [threadId])

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

    if (messages.length === 1 && onNewMessage) {
      onNewMessage(text.trim())
    }

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          threadId: threadId,
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
  }, [isTyping, threadId, messages.length, onNewMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-[#f4f4f4]"
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="bg-[#fafafa] border-b border-[#ebebeb]
                   text-[#1c1c1c] px-4 py-3 flex items-center gap-3
                   shadow-sm pt-20"
      >
        {/* Arjun avatar */}
        <div className="w-10 h-10 rounded-full bg-white border border-[#ebebeb]
                        flex items-center justify-center text-[#1c1c1c] font-bold text-lg
                        shadow-sm shrink-0">
          A
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Arjun</h2>
            <span className="bg-white border border-[#ebebeb]
                             text-gray-500 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold shadow-sm">
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
                         text-gray-600 hover:border-[#1c1c1c] hover:bg-[#1c1c1c]
                         hover:text-white px-3 py-1.5 rounded-full
                         transition-all shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-4 shadow-up relative z-10">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-white border border-[#ebebeb]
                       rounded-2xl px-4 py-3.5 text-sm text-gray-800
                       placeholder-gray-400 focus:outline-none
                       focus:ring-4 focus:ring-[#1c1c1c]/10
                       focus:border-[#1c1c1c] transition-all duration-300
                       max-h-32 leading-relaxed shadow-inner"
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
                ? 'bg-[#1c1c1c] hover:bg-[#2a2a2a] text-white shadow-md hover:scale-105 active:scale-95'
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
