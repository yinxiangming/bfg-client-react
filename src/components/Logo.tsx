'use client'

// React Imports
import type { CSSProperties } from 'react'

// Next Imports
import Link from 'next/link'

// Config Imports
import themeConfig from '@configs/themeConfig'
// Component Imports
import LogoIcon from './LogoIcon'

type LogoProps = {
  color?: CSSProperties['color']
  href?: string
  skipLink?: boolean // If true, don't wrap in Link (for cases where it's already wrapped)
}

const Logo = ({ color, href = '/', skipLink = false }: LogoProps) => {
  const textStyle = color ? { color } : undefined

  const content = (
    <>
      <LogoIcon className='text-[2.6rem] sidebar-logo-icon' />
      <span style={textStyle} className='sidebar-logo-text'>
        {themeConfig.templateName}
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

