'use client'

import { v4 as uuidv4 } from 'uuid'

const GUEST_ID_KEY = 'lakshya_guest_id'

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return ''

  let guestId = localStorage.getItem(GUEST_ID_KEY)
  if (!guestId) {
    guestId = `guest-${uuidv4()}`
    localStorage.setItem(GUEST_ID_KEY, guestId)
  }
  return guestId
}

export function clearGuestId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_ID_KEY)
  }
}
