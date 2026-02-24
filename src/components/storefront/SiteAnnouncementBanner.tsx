'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStorefrontConfig } from '@/contexts/StorefrontConfigContext'

const STORAGE_KEY = 'site_announcement_dismiss'
const HIDE_DURATION_MS = 60 * 60 * 1000 // 1 hour

function simpleHash(text: string): string {
  return `${text.length}:${text.slice(0, 50)}`
}

function getStored(): { messageHash: string; until: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { messageHash: string; until: number }
    return typeof parsed.until === 'number' && typeof parsed.messageHash === 'string' ? parsed : null
  } catch {
    return null
  }
}

function setStored(messageHash: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messageHash,
        until: Date.now() + HIDE_DURATION_MS,
      })
    )
  } catch {
    // ignore
  }
}

/**
 * Banner shown at top of storefront/account when site_announcement is set.
 * After first show, hidden for 1 hour; user can dismiss to start the 1h cooldown.
 */
export default function SiteAnnouncementBanner() {
  const { config } = useStorefrontConfig()
  const [visible, setVisible] = useState(false)
  const message = (config?.site_announcement || '').trim()

  const updateVisibility = useCallback(() => {
    if (!message) {
      setVisible(false)
      return
    }
    const hash = simpleHash(message)
    const stored = getStored()
    if (!stored || stored.messageHash !== hash || Date.now() > stored.until) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [message])

  useEffect(() => {
    updateVisibility()
  }, [updateVisibility])

  const handleClose = () => {
    if (!message) return
    setStored(simpleHash(message))
    setVisible(false)
  }

  if (!visible || !message) return null

  return (
    <>
      <div style={{ height: 48, flexShrink: 0 }} aria-hidden />
      <div
        role='alert'
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 16px',
          fontSize: 14,
          fontWeight: 600,
          backgroundColor: '#ea580c',
          color: '#fff',
          borderBottom: '2px solid #c2410c',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>{message}</span>
        <button
          type='button'
          onClick={handleClose}
          style={{
            flexShrink: 0,
            borderRadius: 4,
            padding: 6,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            lineHeight: 1,
          }}
          aria-label='Close'
        >
          <i className='tabler-x' style={{ fontSize: 20 }} />
        </button>
      </div>
    </>
  )
}
