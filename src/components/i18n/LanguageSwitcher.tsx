'use client'

import { useMemo, useRef, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import Icon from '@components/Icon'

type Props = {
  className?: string
  buttonClassName?: string
  showCurrentLabel?: boolean
  /** 'minimal' = text + chevron only, no button frame (matches currency/theme in header) */
  triggerVariant?: 'button' | 'minimal'
}

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

const LOCALE_OPTIONS = [
  { value: 'en', labelKey: 'language.en', shortLabel: 'EN' },
  { value: 'zh-hans', labelKey: 'language.zhHans', shortLabel: '中' }
] as const

function setLocaleCookie(locale: string) {
  // Persist for 1 year
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)};path=/;max-age=${maxAge}`
}

export default function LanguageSwitcher({
  className,
  buttonClassName = 'admin-topbar-btn',
  showCurrentLabel = true,
  triggerVariant = 'button'
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const current = useMemo(() => {
    return LOCALE_OPTIONS.find(o => o.value === locale) ? locale : 'en'
  }, [locale])

  const currentShortLabel = useMemo(() => {
    const opt = LOCALE_OPTIONS.find(o => o.value === current)
    return opt?.shortLabel || 'EN'
  }, [current])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (nextLocale: string) => {
    if (typeof document === 'undefined') return
    if (!nextLocale || nextLocale === current) return
    setLocaleCookie(nextLocale)
    setIsOpen(false)
    router.refresh()
  }

  const isMinimal = triggerVariant === 'minimal'

  return (
    <div
      className={`language-switcher theme-switcher ${className || ''}`}
      ref={dropdownRef}
      style={isMinimal ? { position: 'relative', cursor: 'pointer' } : undefined}
      onClick={isMinimal ? () => setIsOpen(!isOpen) : undefined}
      role={isMinimal ? 'button' : undefined}
      tabIndex={isMinimal ? 0 : undefined}
      aria-label={isMinimal ? t('language.label') : undefined}
      aria-expanded={isMinimal ? isOpen : undefined}
      onKeyDown={
        isMinimal
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsOpen((open) => !open)
              }
            }
          : undefined
      }
    >
      {isMinimal ? (
        <>
          <span>{currentShortLabel}</span>
          <i
            className='tabler-chevron-down'
            style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}
            aria-hidden
          />
        </>
      ) : (
        <button
          type='button'
          className={buttonClassName}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t('language.label')}
          aria-expanded={isOpen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Icon icon='tabler-language' />
          {showCurrentLabel ? <span style={{ fontSize: '0.875rem' }}>{currentShortLabel}</span> : null}
        </button>
      )}

      {isOpen && (
        <div className='theme-switcher-dropdown'>
          {LOCALE_OPTIONS.map(opt => {
            const isSelected = current === opt.value
            return (
              <button
                key={opt.value}
                type='button'
                className={`theme-switcher-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <Icon icon='tabler-language' />
                <span>{t(opt.labelKey)}</span>
                {isSelected && <Icon icon='tabler-check' className='check-icon' />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

