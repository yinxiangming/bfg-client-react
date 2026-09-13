'use client'

/**
 * The few building blocks every account page is made of.
 *
 * They render the `acc-*` classes in `styles/account.css`, which sit on the same
 * tokens as the back office, so a page differs from its neighbours in content
 * and not in spacing, type or card treatment.
 */

import { useCallback } from 'react'
import type { ReactNode } from 'react'

import Link from 'next/link'

import CircularProgress from '@mui/material/CircularProgress'

import Icon from '@components/Icon'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { formatCurrency, getIntlLocale } from '@/utils/format'

type PageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  /** Status badges shown beside the title. */
  badges?: ReactNode
  /** Page-level controls, right-aligned. */
  actions?: ReactNode
  back?: { href: string; label: string }
}

export function AccountPageHeader({ title, subtitle, badges, actions, back }: PageHeaderProps) {
  return (
    <div>
      {back && (
        <Link href={back.href} className='acc-back'>
          <Icon icon='tabler-arrow-left' />
          {back.label}
        </Link>
      )}
      <div className='acc-page-head'>
        <div>
          <div className='acc-page-title-row'>
            <h1 className='acc-page-title'>{title}</h1>
            {badges}
          </div>
          {subtitle && <p className='acc-page-subtitle'>{subtitle}</p>}
        </div>
        {actions && <div className='acc-page-actions'>{actions}</div>}
      </div>
    </div>
  )
}

type CardProps = {
  title?: ReactNode
  /** A second line under the title. */
  subtitle?: ReactNode
  /** Right side of the header: a count, a link or a control. */
  action?: ReactNode
  id?: string
  className?: string
  children?: ReactNode
}

export function AccountCard({ title, subtitle, action, id, className, children }: CardProps) {
  return (
    <section id={id} className={className ? `acc-card ${className}` : 'acc-card'}>
      {(title || action) && (
        <div className='acc-card-head'>
          <div className='acc-grow'>
            {title && <h2 className='acc-card-title'>{title}</h2>}
            {subtitle && <div className='acc-sub'>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

type EmptyProps = {
  icon?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function AccountEmpty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className='acc-empty'>
      {icon && <Icon icon={icon} className='acc-empty-icon' />}
      <div className='acc-empty-title'>{title}</div>
      {description && <div>{description}</div>}
      {action}
    </div>
  )
}

export function AccountLoading() {
  return (
    <div className='acc-loading'>
      <CircularProgress size={28} />
    </div>
  )
}

/** A money formatter in the shop's currency, for amounts the API sends without one. */
export function useMoney() {
  const config = useStorefrontConfigSafe()
  const currency = config?.default_currency

  return useCallback(
    (value: string | number | null | undefined, currencyCode?: string | null) => {
      if (value === null || value === undefined || value === '') return '—'

      return formatCurrency(value, currencyCode || currency)
    },
    [currency]
  )
}

const toDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

/** 12 Sep 2026 */
export const formatDay = (value?: string | null) =>
  toDate(value)?.toLocaleDateString(getIntlLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) ?? '—'

/** 12 Sep */
export const formatShortDay = (value?: string | null) =>
  toDate(value)?.toLocaleDateString(getIntlLocale(), { day: 'numeric', month: 'short' }) ?? '—'

/** 12 Sep 2026, 3:42 pm */
export const formatDayTime = (value?: string | null) =>
  toDate(value)?.toLocaleString(getIntlLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }) ?? '—'

/** 12 Sep, 3:42 pm */
export const formatShortDayTime = (value?: string | null) =>
  toDate(value)?.toLocaleString(getIntlLocale(), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) ??
  '—'
