import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface ChatSession {
  id: string
  title: string
  timestamp: string // ISO string
}

const STORAGE_KEY = 'lakshya_chat_sessions'

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        let parsed = JSON.parse(stored) as ChatSession[]
        // Clean out empty sessions that were abandoned
        parsed = parsed.filter(s => s.title !== 'New Chat')
        
        // eslint-disable-next-line
        setSessions(parsed)
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to parse sessions from local storage', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to local storage on changes
  useEffect(() => {
    if (!isLoaded) return
    // Don't save empty/abandoned new chats to the local DB
    const validSessions = sessions.filter(s => s.title !== 'New Chat')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validSessions))
  }, [sessions, isLoaded])

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      timestamp: new Date().toISOString()
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    return newSession.id
  }, [])

  const updateSessionTitle = (id: string, newTitle: string) => {
    setSessions(prev => 
      prev.map(s => s.id === id ? { ...s, title: newTitle } : s)
    )
  }

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    updateSessionTitle,
    isLoaded
  }
}
