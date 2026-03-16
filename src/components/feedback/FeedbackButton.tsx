'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Icon from '@components/Icon'
import FeedbackDialog from './FeedbackDialog'
import type { FeedbackSource } from './FeedbackDialog'

type Props = {
  variant?: 'button' | 'minimal'
  source?: FeedbackSource
}

export default function FeedbackButton({ variant = 'button', source: sourceProp }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const source: FeedbackSource = sourceProp ?? (pathname?.startsWith('/account') ? 'account' : pathname?.startsWith('/admin') ? 'admin' : 'storefront')

  const isMinimal = variant === 'minimal'

  return (
    <>
      {isMinimal ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen(true)
            }
          }}
          style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          aria-label="Feedback"
        >
          <i className="tabler-message-circle" style={{ fontSize: '1rem' }} aria-hidden />
        </div>
      ) : (
        <button
          type="button"
          className="admin-topbar-btn"
          onClick={() => setOpen(true)}
          aria-label="Feedback"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon icon="tabler-message-circle" />
        </button>
      )}
      <FeedbackDialog open={open} onClose={() => setOpen(false)} source={source} />
    </>
  )
}
