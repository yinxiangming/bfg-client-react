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
  /**
   * The variant drawn on a dark surface. A wordmark in dark ink disappears on a
   * dark header; this is the light-ink cut of the same mark. Falls back to
   * `logoSrc` when a workspace has not uploaded one, so nothing breaks by omission.
   */
  logoDarkSrc?: string | null
  /**
   * Which surface this logo sits on.
   *
   *   'auto' — follows the page's colour mode. Both variants render and CSS picks
   *            one off `[data-mode]`, so there is no flash of the wrong logo while
   *            the client works out the mode, and SSR output does not depend on it.
   *   'dark' — always the dark variant, for a panel that is dark in *every* mode.
   *            The storefront footer is the case: `.sf-footer` is #1a1a1a whether
   *            or not the shopper chose dark mode, so following the mode there
   *            would put the dark-ink logo on a near-black panel.
   */
  surface?: 'auto' | 'dark'
  /**
   * Whether to print the name alongside a logo. Defaults to false because a
   * logo usually contains the wordmark, and showing both duplicates the brand.
   * With no logo the name always renders — it is the only branding left.
   */
  showNameWithLogo?: boolean
}

// Use data URLs and absolute http(s) URLs as-is; only normalize relative media paths
const resolveSrc = (src?: string | null): string =>
  !src
    ? ''
    : src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')
      ? src
      : normalizeMediaUrl(src)

const imgStyle = { height: '2.6rem', width: 'auto', objectFit: 'contain' } as const

const Logo = ({
  color,
  href = '/',
  skipLink = false,
  name,
  logoSrc,
  logoDarkSrc,
  surface = 'auto',
  showNameWithLogo = false
}: LogoProps) => {
  const textStyle = color ? { color } : undefined
  const displayName = name ?? themeConfig.templateName
  const lightSrc = resolveSrc(logoSrc)
  // A workspace with no dark variant keeps its single logo everywhere.
  const darkSrc = resolveSrc(logoDarkSrc) || lightSrc

  let iconContent
  if (!lightSrc && !darkSrc) {
    iconContent = <LogoIcon className='text-[2.6rem] sidebar-logo-icon' />
  } else if (surface === 'dark') {
    iconContent = <img src={darkSrc} alt='' className='sidebar-logo-icon' style={imgStyle} />
  } else if (darkSrc === lightSrc) {
    iconContent = <img src={lightSrc} alt='' className='sidebar-logo-icon' style={imgStyle} />
  } else {
    iconContent = (
      <>
        <img src={lightSrc} alt='' className='sidebar-logo-icon logo-img-light' style={imgStyle} />
        <img src={darkSrc} alt='' className='sidebar-logo-icon logo-img-dark' style={imgStyle} />
      </>
    )
  }

  const showName = (!lightSrc && !darkSrc) || showNameWithLogo

  const content = (
    <>
      {iconContent}
      {showName && (
        <span style={textStyle} className='sidebar-logo-text'>
          {displayName}
        </span>
      )}
    </>
  )

  return (
    <div className='flex items-center sidebar-logo-wrapper' style={{ gap: '0.25rem' }}>
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

