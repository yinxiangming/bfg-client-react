'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ExtensionLoaderProvider } from '@/extensions/context'
import { StorefrontConfigProvider, useStorefrontConfig } from '@/contexts/StorefrontConfigContext'
import { authApi } from '@/utils/authApi'
import { isMenuItem, isMenuSection, isMenuSubMenu } from '@/types/menu'
import type { MenuNode } from '@/types/menu'
import './website-account.css'

type Props = {
  children: React.ReactNode
  navItems: MenuNode[]
  extensionIds: string[]
}

export default function WebsiteAccountLayout({ children, navItems, extensionIds }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      const redirect = encodeURIComponent(pathname || '/account')
      router.push(`/?redirect=${redirect}`)
    }
  }, [router, pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <ExtensionLoaderProvider extensionIds={extensionIds}>
      <StorefrontConfigProvider>
        <div className='website-account-root' data-mode='light'>
          <div className='wa-shell'>
            {mobileOpen && (
              <div className='wa-sidebar-backdrop' onClick={() => setMobileOpen(false)} aria-hidden='true' />
            )}
            <aside className='wa-sidebar' data-open={mobileOpen ? 'true' : 'false'}>
              <BrandHeader />
              <SkinNav navItems={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </aside>
            <div className='wa-main'>
              <Topbar onToggleMobile={() => setMobileOpen(o => !o)} />
              <main className='wa-content'>{children}</main>
            </div>
          </div>
        </div>
      </StorefrontConfigProvider>
    </ExtensionLoaderProvider>
  )
}

function BrandHeader() {
  const { config } = useStorefrontConfig()
  const name = config?.site_name?.trim() || 'Account'
  const initial = name.charAt(0).toUpperCase()
  return (
    <Link href='/' className='wa-brand'>
      <span className='wa-brand-logo' aria-hidden='true'>{initial}</span>
      <span>{name}</span>
    </Link>
  )
}

function Topbar({ onToggleMobile }: { onToggleMobile: () => void }) {
  const t = useTranslations('account')
  const pathname = usePathname()
  const segments = (pathname || '').split('/').filter(Boolean)
  const last = segments[segments.length - 1] || 'dashboard'
  const titleKey = `pages.${last}.title`
  let title: string
  try {
    const has = (t as any).has ? (t as any).has(titleKey) : true
    title = has ? (t(titleKey as any) as string) : 'Account'
  } catch {
    title = 'Account'
  }

  return (
    <div className='wa-topbar'>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          className='wa-icon-btn wa-mobile-trigger'
          onClick={onToggleMobile}
          aria-label='Toggle menu'
        >
          <i className='tabler-menu-2' />
        </button>
        <span className='wa-topbar-title'>{title}</span>
      </div>
      <div className='wa-topbar-actions'>
        <Link href='/' className='wa-icon-btn' aria-label='Back to store'>
          <i className='tabler-shopping-bag' />
        </Link>
        <button
          type='button'
          className='wa-icon-btn'
          onClick={() => {
            authApi.logout()
            window.location.href = '/'
          }}
          aria-label='Sign out'
        >
          <i className='tabler-logout' />
        </button>
      </div>
    </div>
  )
}

function SkinNav({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: MenuNode[]
  pathname: string | null
  onNavigate: () => void
}) {
  const t = useTranslations('account')
  const getLabel = (n: MenuNode) => {
    const key = (n as any).i18nKey as string | undefined
    if (!key) return n.label
    try {
      const has = (t as any).has ? (t as any).has(key) : true
      return has ? (t(key as any) as unknown as typeof n.label) : n.label
    } catch {
      return n.label
    }
  }

  const isActive = (href?: string, match?: 'exact' | 'prefix') => {
    if (!href || !pathname) return false
    const norm = pathname.replace(/\/$/, '') || '/'
    const target = href.replace(/\/$/, '') || '/'
    if (match === 'exact') return norm === target
    return norm === target || norm.startsWith(target + '/')
  }

  const renderItem = (node: MenuNode): React.ReactNode => {
    if (isMenuSection(node)) {
      return (
        <div key={node.id}>
          <div className='wa-nav-section'>{getLabel(node)}</div>
          {node.children.map(renderItem)}
        </div>
      )
    }
    if (isMenuSubMenu(node)) {
      return (
        <div key={node.id}>
          <div className='wa-nav-section'>{getLabel(node)}</div>
          {node.children.map(renderItem)}
        </div>
      )
    }
    if (isMenuItem(node)) {
      const active = isActive(node.href, node.activeMatch)
      const content = (
        <>
          {node.icon && <i className={node.icon} aria-hidden='true' />}
          <span>{getLabel(node)}</span>
        </>
      )
      if (!node.href) {
        return (
          <span key={node.id} className='wa-nav-link' aria-disabled='true'>
            {content}
          </span>
        )
      }
      return (
        <Link
          key={node.id}
          href={node.href}
          className='wa-nav-link'
          aria-current={active ? 'page' : undefined}
          onClick={onNavigate}
        >
          {content}
        </Link>
      )
    }
    return null
  }

  return <nav className='wa-nav'>{navItems.map(renderItem)}</nav>
}
