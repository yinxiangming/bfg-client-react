'use client'

import { useMemo, useRef, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import Icon from '@components/Icon'
import { LOCALE_OPTIONS, normalizeAppLocale } from '@/i18n/locales'
import { useStorefrontConfig } from '@/contexts/StorefrontConfigContext'
import { getStorefrontLanguages, hasMultipleStorefrontLanguages, resolveStorefrontLocale } from '@/utils/storefrontConfig'

type Props = {
  className?: string
  buttonClassName?: string
  showCurrentLabel?: boolean
  /** 'minimal' = text + chevron only, no button frame (matches currency/theme in header) */
  triggerVariant?: 'button' | 'minimal'
}

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

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
  const { config, loading } = useStorefrontConfig()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const localeOptions = useMemo(() => {
    if (!config) return LOCALE_OPTIONS
    const available = new Set(getStorefrontLanguages(config))
    return LOCALE_OPTIONS.filter(option => available.has(option.value))
  }, [config])

  const current = useMemo(() => {
    return resolveStorefrontLocale(config, normalizeAppLocale(locale))
  }, [config, locale])

  const currentShortLabel = useMemo(() => {
    const opt = localeOptions.find(o => o.value === current)
    return opt?.shortLabel || 'EN'
  }, [current, localeOptions])

  const shouldHideSwitcher = loading || (config && !hasMultipleStorefrontLanguages(config))

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

  if (shouldHideSwitcher) {
    return null
  }

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
          {localeOptions.map(opt => {
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
