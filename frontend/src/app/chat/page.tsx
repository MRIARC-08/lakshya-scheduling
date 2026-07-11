'use client'

import Navbar from '@/components/Navbar'
import ChatWindow from '@/components/chat/ChatWindow'
import { useChatSessions } from '@/hooks/useChatSessions'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getOrCreateGuestId } from '@/lib/guest'
import { useSession } from 'next-auth/react'

export default function ChatPage() {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    updateSessionTitle,
    isLoaded
  } = useChatSessions()
  
  const { data: nextSession } = useSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Initialize a default threadId if no sessions exist
  useEffect(() => {
    if (isLoaded && sessions.length === 0) {
      // Fallback behavior: use user id or guest id if no chats
      getOrCreateGuestId()
      // Generate a new session automatically
      createNewSession()
    }
  }, [isLoaded, sessions.length, createNewSession, nextSession])

  if (!isLoaded) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center">
        <span className="animate-pulse text-gray-400">Loading your chats...</span>
      </div>
    )
  }

  const currentThreadId = activeSessionId || 'anonymous'

  const handleNewMessage = (msg: string) => {
    const currentSession = sessions.find(s => s.id === activeSessionId)
    // If the chat has the default title, update it with the first message context
    if (currentSession && currentSession.title === 'New Chat') {
      const title = msg.length > 25 ? msg.substring(0, 25) + '...' : msg
      updateSessionTitle(currentSession.id, title)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={clsx(
          "fixed md:static inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-md border-r border-gray-100 flex flex-col pt-20 transform transition-transform duration-300 ease-in-out md:transform-none shadow-2xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => {
                createNewSession()
                setIsSidebarOpen(false)
              }}
              className="w-full bg-saffron-50 text-saffron-600 hover:bg-saffron-100 border border-saffron-200 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2 mt-2">Previous Chats</h3>
            {sessions.length === 0 && (
              <p className="text-sm text-gray-400 px-2 italic">No previous chats</p>
            )}
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id)
                  setIsSidebarOpen(false)
                }}
                className={clsx(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all truncate border",
                  activeSessionId === s.id 
                    ? "bg-saffron-50 text-saffron-700 border-saffron-200 font-medium shadow-sm" 
                    : "text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative min-w-0 bg-gray-50">
          {/* Mobile Sidebar Toggle Button */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-[5.5rem] left-4 z-30 p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-md border border-gray-100 text-gray-600 hover:text-saffron-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {currentThreadId && (
            <div className="flex-1 w-full h-full">
              <ChatWindow 
                threadId={currentThreadId} 
                onNewMessage={handleNewMessage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
