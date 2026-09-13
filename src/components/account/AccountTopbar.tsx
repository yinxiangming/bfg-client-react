'use client'

import { Fragment, useMemo } from 'react'
import type { ReactNode } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Icon from '@components/Icon'
import ThemeSwitcher from '@components/theme/ThemeSwitcher'
import UserDropdown from '@components/ui/UserDropdown'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { useAccount } from '@/contexts/AccountContext'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { isMenuSection, isMenuSubMenu } from '@/types/menu'
import type { MenuNode } from '@/types/menu'

type Crumb = { label: string; href?: string }

type LinkNode = { href: string; label: ReactNode; i18nKey?: string }

/** Account routes that are reached from a page rather than from the menu. */
const ROUTE_CRUMBS: Record<string, string> = {
  '/account/change-password': 'breadcrumbs.changePassword',
  '/account/information': 'breadcrumbs.information',
  '/account/wallet/withdraw': 'breadcrumbs.withdraw',
  '/account/gdpr': 'breadcrumbs.privacy',
  '/account/comments': 'breadcrumbs.comments',
  '/account/credit-slips': 'breadcrumbs.creditSlips'
}

const trimSlash = (path: string) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path)

/** Every nav entry with a link, out of its section. */
const linkNodes = (items: MenuNode[]): LinkNode[] =>
  items.flatMap(item => {
    if (isMenuSection(item)) return linkNodes(item.children)

    const own = item.href ? [{ href: trimSlash(item.href), label: item.label, i18nKey: item.i18nKey }] : []

    return isMenuSubMenu(item) ? [...own, ...linkNodes(item.children)] : own
  })

type Props = {
  navItems: MenuNode[]
  showMenuToggle?: boolean
  onMenuToggle?: () => void
}

export default function AccountTopbar({ navItems, showMenuToggle, onMenuToggle }: Props) {
  const t = useTranslations('account')
  const pathname = trimSlash(usePathname() || '/account')
  const config = useStorefrontConfigSafe()
  const { user, stats } = useAccount()

  const crumbs = useMemo<Crumb[]>(() => {
    const has = (key: string) => ((t as any).has ? (t as any).has(key) : true)
    const labelOf = (node: LinkNode) =>
      node.i18nKey && has(node.i18nKey) ? t(node.i18nKey as any) : typeof node.label === 'string' ? node.label : ''

    const root: Crumb = { label: t('nav.account'), href: '/account' }

    if (pathname === '/account') return [root, { label: t('nav.dashboard') }]

    const match = linkNodes(navItems)
      .filter(node => node.href !== '/account' && (pathname === node.href || pathname.startsWith(`${node.href}/`)))
      .sort((a, b) => b.href.length - a.href.length)[0]

    if (match) {
      return pathname === match.href
        ? [root, { label: labelOf(match) }]
        : [root, { label: labelOf(match), href: match.href }, { label: t('breadcrumbs.details') }]
    }

    const route = Object.keys(ROUTE_CRUMBS).find(key => pathname === key || pathname.startsWith(`${key}/`))

    return route ? [root, { label: t(ROUTE_CRUMBS[route] as any) }] : [root]
  }, [navItems, pathname, t])

  const unread = stats?.unread_messages_count ?? 0
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || ''

  return (
    <header className='account-topbar'>
      <div className='account-topbar-left'>
        {showMenuToggle && (
          <button type='button' className='topbar-menu-toggle' onClick={onMenuToggle} aria-label={t('topbar.menu')}>
            <Icon icon='tabler-menu-2' />
          </button>
        )}
        {config.site_name && <span className='account-topbar-brand'>{config.site_name}</span>}
        <nav className='account-crumbs' aria-label={t('topbar.breadcrumb')}>
          {crumbs.map((crumb, index) => (
            <Fragment key={`${index}-${crumb.label}`}>
              {index > 0 && <Icon icon='tabler-chevron-right' />}
              {crumb.href && index < crumbs.length - 1 ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span aria-current='page'>{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      </div>
      <div className='account-topbar-right'>
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Link
          href='/account/alerts'
          className='admin-topbar-btn'
          aria-label={unread > 0 ? t('topbar.unread', { count: unread }) : t('topbar.inbox')}
        >
          <Icon icon='tabler-bell' />
          {unread > 0 && <span className='account-topbar-dot' aria-hidden />}
        </Link>
        {name && (
          <>
            <span className='account-topbar-divider' aria-hidden />
            <div className='current-user-display account-topbar-user'>
              <span className='current-user-display-name'>{name}</span>
              {user?.email && <span className='current-user-display-email'>{user.email}</span>}
            </div>
          </>
        )}
        <UserDropdown />
      </div>
    </header>
  )
}
