'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { API_ERROR_MESSAGE_KEYS, setApiErrorMessages } from '@/utils/apiErrors'

/**
 * Hands the API clients the reader's own wording for the error codes we explain
 * better than the server does.
 *
 * Renders nothing. It exists because the clients are plain functions with no access
 * to the message bundle, while nearly every caller shows a failed request as
 * `err.message` — so this is the one place where the two can meet. Mounted once at
 * the root, inside the i18n provider, and re-runs when the locale changes.
 */
export default function ApiErrorMessages() {
  const t = useTranslations('common')

  useEffect(() => {
    setApiErrorMessages(
      Object.fromEntries(Object.entries(API_ERROR_MESSAGE_KEYS).map(([code, key]) => [code, t(key)]))
    )
  }, [t])

  return null
}
