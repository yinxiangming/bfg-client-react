'use client'

import React, { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { bfgApi } from '@/utils/api'
import { getApiHeaders } from '@/utils/api'

const MAX_IMAGE_BASE64_LENGTH = 500000

export type FeedbackType = 'bug' | 'feature'
export type FeedbackSource = 'admin' | 'account' | 'storefront'

type Props = {
  open: boolean
  onClose: () => void
  source: FeedbackSource
  onSuccess?: () => void
}

export default function FeedbackDialog({ open, onClose, source, onSuccess }: Props) {
  const t = useTranslations('common')
  const [type, setType] = useState<FeedbackType>('bug')
  const [content, setContent] = useState('')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          if (dataUrl.length > MAX_IMAGE_BASE64_LENGTH) {
            setErrorMessage(t('feedback.error'))
            return
          }
          setImageBase64(dataUrl)
          setErrorMessage('')
        }
        reader.readAsDataURL(file)
        return
      }
    }
  }, [t])

  const removeImage = () => setImageBase64(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) {
      setErrorMessage(t('feedback.placeholder'))
      return
    }
    setStatus('submitting')
    setErrorMessage('')
    try {
      const headers = getApiHeaders({ 'Content-Type': 'application/json' }, { withAuth: true })
      const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
      const body: Record<string, string> = {
        type,
        content: text,
        source,
        page_url: pageUrl,
      }
      if (imageBase64) body.image_base64 = imageBase64
      const res = await fetch(bfgApi.feedback(), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || res.statusText)
      }
      setStatus('success')
      setContent('')
      setImageBase64(null)
      onSuccess?.()
      setTimeout(() => {
        onClose()
        setStatus('idle')
      }, 1500)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : t('feedback.error'))
    }
  }

  const handleClose = () => {
    if (status === 'submitting') return
    onClose()
    setContent('')
    setImageBase64(null)
    setStatus('idle')
    setErrorMessage('')
  }

  if (!open) return null

  return (
    <>
      <div
        role="presentation"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1300,
        }}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-labelledby="feedback-dialog-title"
        className="feedback-dialog-panel"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--feedback-dialog-bg, #fff)',
          color: 'var(--feedback-dialog-fg, #1a1a1a)',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          minWidth: '360px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 1301,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <h2
            id="feedback-dialog-title"
            style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600 }}
          >
            {t('feedback.title')}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="feedback-type"
                    checked={type === 'bug'}
                    onChange={() => setType('bug')}
                  />
                  <span>{t('feedback.typeBug')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="feedback-type"
                    checked={type === 'feature'}
                    onChange={() => setType('feature')}
                  />
                  <span>{t('feedback.typeFeature')}</span>
                </label>
              </div>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                placeholder={t('feedback.placeholder')}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--feedback-dialog-border, #e0e0e0)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  background: 'var(--feedback-dialog-input-bg, #fff)',
                  color: 'inherit',
                }}
              />
            </div>
            {imageBase64 && (
              <div style={{ marginBottom: '0.75rem', position: 'relative', display: 'inline-block' }}>
                <img
                  src={imageBase64}
                  alt="Pasted"
                  style={{ maxWidth: '200px', maxHeight: '120px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--feedback-dialog-border, #e0e0e0)' }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--feedback-dialog-muted, #666)' }}>
              {t('feedback.pasteHint')}
            </p>
            {errorMessage && (
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--feedback-dialog-error, #c00)' }}>
                {errorMessage}
              </p>
            )}
            {status === 'success' && (
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--feedback-dialog-success, #0a0)' }}>
                {t('feedback.success')}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={status === 'submitting'}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--feedback-dialog-border, #e0e0e0)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'inherit',
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--primary, #6366f1)',
                  color: '#fff',
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {status === 'submitting' ? '...' : t('feedback.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
