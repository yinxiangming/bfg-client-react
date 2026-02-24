'use client'

import React from 'react'
import Link from 'next/link'
import { getLocalizedText } from '@/utils/i18n'
import type { BlockProps } from '../../../types'

interface CtaBlockSettings {
  variant?: 'primary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  layout?: 'default' | 'heroWithStats' | 'final'
}

interface CtaBlockData {
  title?: string | Record<string, string>
  description?: string | Record<string, string>
  buttonText?: string | Record<string, string>
  buttonLink?: string
  secondaryButtonText?: string | Record<string, string>
  secondaryButtonLink?: string
}

/** Parse "100% 源码交付 · 0% 交易佣金 · 24/7 技术支持" into [{ value, label }] */
function parseStatsRow(text: string): { value: string; label: string }[] {
  const parts = text.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean)
  return parts.map((part) => {
    const match = part.match(/^([^\s]+)\s+(.+)$/)
    if (match) return { value: match[1], label: match[2] }
    return { value: part, label: '' }
  })
}

function isStatsDescription(description: string): boolean {
  return /\s*·\s*/.test(description) && description.split(/\s*·\s*/).length >= 2
}

export function CtaBlockV1({
  block,
  settings,
  data,
  locale = 'en',
  isEditing,
}: BlockProps<CtaBlockSettings, CtaBlockData>) {
  const { variant = 'primary', size = 'medium', layout } = settings
  const title = getLocalizedText(data.title, locale)
  const description = getLocalizedText(data.description, locale)
  const buttonText = getLocalizedText(data.buttonText, locale)
  const buttonLink = data.buttonLink || '#'
  const secondaryText = getLocalizedText(data.secondaryButtonText, locale)
  const secondaryLink = data.secondaryButtonLink || '#'

  const isHeroStats = layout === 'heroWithStats' || (block?.id === 'hero-cta' && description && isStatsDescription(description))
  const isFinal = layout === 'final' || (block?.id === 'final-cta' && title)
  const stats = isHeroStats && description ? parseStatsRow(description) : []

  if (!title && !buttonText && !secondaryText && !description && !isEditing) return null

  if (isFinal) {
    return (
      <section className='cta-block-final'>
        <div className='cta-block-final-inner'>
          {title && <h2 className='cta-title'>{title}</h2>}
          {description && <p className='cta-description'>{description}</p>}
          <div className='cta-buttons'>
            {buttonText && (
              <Link href={buttonLink} className='cta-btn-primary'>
                {buttonText}
              </Link>
            )}
            {secondaryText && (
              <Link href={secondaryLink} className='cta-btn-outline'>
                {secondaryText}
              </Link>
            )}
          </div>
          <p className='cta-note'>无需信用卡 · 14天免费试用 · 随时取消</p>
        </div>
      </section>
    )
  }

  return (
    <section className={isHeroStats ? 'cta-block-hero' : 'cta-block-default'}>
      <div className={isHeroStats ? '' : 'cta-block-default-inner'}>
        {!isHeroStats && title && <h2 className='cta-default-title'>{title}</h2>}
        {!isHeroStats && description && !isStatsDescription(description) && (
          <p className='cta-default-desc'>{description}</p>
        )}
        {(buttonText || secondaryText) && (
          <div className={isHeroStats ? 'cta-hero-buttons' : 'cta-default-buttons'}>
            {buttonText && (
              <Link href={buttonLink} className='cta-hero-btn-primary'>
                {buttonText}
                {isHeroStats && (
                  <span className='material-symbols-outlined' aria-hidden>rocket_launch</span>
                )}
              </Link>
            )}
            {secondaryText && (
              <Link href={secondaryLink} className='cta-hero-btn-outline'>
                {secondaryText}
              </Link>
            )}
          </div>
        )}
        {isHeroStats && stats.length > 0 && (
          <div className='cta-block-hero-stats' role='presentation'>
            {stats.map((stat, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className='stat-divider' />}
                <div className='stat-item'>
                  <p className='stat-value'>{stat.value}</p>
                  <p className='stat-label'>{stat.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default CtaBlockV1
