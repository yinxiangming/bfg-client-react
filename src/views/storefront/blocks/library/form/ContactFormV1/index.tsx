'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { getLocalizedText } from '@/utils/i18n'
import { getApiUrl, getApiHeaders } from '@/utils/api'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

interface ContactFormSettings {
  inquiryType?: string
  showPhone?: boolean
  showSubject?: boolean
  buttonVariant?: 'primary' | 'outline'
}

interface ContactFormData {
  title?: string | Record<string, string>
  description?: string | Record<string, string>
  successMessage?: string | Record<string, string>
  buttonText?: string | Record<string, string>
}

export function ContactFormV1({
  settings,
  data,
  locale = 'en',
  isEditing,
}: BlockProps<ContactFormSettings, ContactFormData>) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const { inquiryType = 'inquiry', showPhone = true, showSubject = true, buttonVariant = 'primary' } = settings

  const t = useTranslations('storefront')
  const title = getLocalizedText(data.title, locale)
  const description = getLocalizedText(data.description, locale)
  const successMessage = getLocalizedText(data.successMessage, locale) || 'Thank you! We will get back to you soon.'
  const buttonText = getLocalizedText(data.buttonText, locale) || 'Send Message'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) return

    setStatus('submitting')
    setErrorMessage('')

    try {
      const response = await fetch(`${getApiUrl()}/api/web/inquiries/`, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          inquiry_type: inquiryType,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          source_url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setStatus('success')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrorMessage('An error occurred. Please try again.')
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {description && <p className={styles.description}>{description}</p>}

        {status === 'success' ? (
          <div className={styles.successMessage}>
            <span className={styles.checkmark}>✓</span>
            <p>{successMessage}</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor='name' className={styles.label}>
                  {t('contactForm.name')} *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  disabled={isEditing}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor='email' className={styles.label}>
                  {t('contactForm.email')} *
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  disabled={isEditing}
                />
              </div>
            </div>

            {showPhone && (
              <div className={styles.field}>
                <label htmlFor='phone' className={styles.label}>
                  {t('contactForm.phone')}
                </label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={isEditing}
                />
              </div>
            )}

            {showSubject && (
              <div className={styles.field}>
                <label htmlFor='subject' className={styles.label}>
                  {t('contactForm.subject')}
                </label>
                <input
                  type='text'
                  id='subject'
                  name='subject'
                  value={formData.subject}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={isEditing}
                />
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor='message' className={styles.label}>
                {t('contactForm.message')} *
              </label>
              <textarea
                id='message'
                name='message'
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className={styles.textarea}
                disabled={isEditing}
              />
            </div>

            {status === 'error' && <p className={styles.error}>{errorMessage}</p>}

            <button
              type='submit'
              className={`${styles.button} ${buttonVariant === 'outline' ? styles.buttonOutline : ''}`}
              disabled={status === 'submitting' || isEditing}
            >
              {status === 'submitting' ? t('contactForm.sending') : buttonText}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

export default ContactFormV1
