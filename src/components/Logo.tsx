'use client'

// React Imports
import type { CSSProperties } from 'react'

// Next Imports
import Link from 'next/link'

// Config Imports
import themeConfig from '@configs/themeConfig'
// Component Imports
import LogoIcon from './LogoIcon'
import { normalizeMediaUrl } from '@/utils/media'

type LogoProps = {
  color?: CSSProperties['color']
  href?: string
  skipLink?: boolean // If true, don't wrap in Link (for cases where it's already wrapped)
  /** When provided (e.g. workspace name in admin), displayed instead of themeConfig.templateName */
  name?: string
  /** When provided (e.g. workspace logo URL), displayed instead of default LogoIcon */
  logoSrc?: string | null
}

const Logo = ({ color, href = '/', skipLink = false, name, logoSrc }: LogoProps) => {
  const textStyle = color ? { color } : undefined
  const displayName = name ?? themeConfig.templateName
  // Use data URLs and absolute http(s) URLs as-is; only normalize relative media paths
  const resolvedLogoSrc = !logoSrc
    ? ''
    : logoSrc.startsWith('data:') || logoSrc.startsWith('http://') || logoSrc.startsWith('https://')
      ? logoSrc
      : normalizeMediaUrl(logoSrc)

  const iconContent = resolvedLogoSrc ? (
    <img
      src={resolvedLogoSrc}
      alt=''
      className='sidebar-logo-icon'
      style={{ height: '2.6rem', width: 'auto', objectFit: 'contain' }}
    />
  ) : (
    <LogoIcon className='text-[2.6rem] sidebar-logo-icon' />
  )

  const content = (
    <>
      {iconContent}
      <span style={textStyle} className='sidebar-logo-text'>
        {displayName}
      </span>
    </>
  )

  return (
    <div className='flex items-center sidebar-logo-wrapper' style={{ gap: '1.25rem' }}>
      {skipLink ? (
        content
      ) : (
        <Link href={href} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {content}
        </Link>
      )}
    </div>
  )
}

export default Logo

