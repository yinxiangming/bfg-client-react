'use client'

/**
 * The console shell: the tree of workspaces on the left, the console's bar on top, and
 * the page itself.
 *
 * It borrows the admin's `Sidebar` and its layout classes, so the console looks like the
 * back office a shop owner already knows, but its tree spans every workspace the account
 * runs instead of the pages of one workspace.
 */

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Sidebar from '@components/layout/Sidebar'
import ConsoleTopbar from '@/components/console/ConsoleTopbar'
import { buildConsoleNav } from '@/components/console/consoleNav'
import { useConsole } from '@/contexts/ConsoleContext'

/** Matches the drawer breakpoint in styles/layout.css. */
const MOBILE_BREAKPOINT = 960

export default function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations('admin.console')
  const { state, openWorkspace } = useConsole()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)

    check()
    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const navItems = useMemo(() => {
    const loaded = state.kind === 'loaded' ? state : null
    // A workspace is shown under Platform only while it is the one being looked at, and
    // only when it is not already a node of its own further up the tree.
    // A locale prefix, where the deployment serves one, sits in front of the path the
    // console's links are written in; Sidebar strips it the same way.
    const path = (pathname ?? '').replace(/^\/[a-z]{2}(-[A-Z]{2})?(?=\/|$)/, '')
    const insideWorkspace = /^\/workspaces\/\d+(\/|$)/.test(path)
    const owns = openWorkspace
      ? Boolean(loaded?.workspaces.some(workspace => workspace.id === openWorkspace.id && workspace.is_owner))
      : false

    return buildConsoleNav({
      owned: (loaded?.workspaces ?? []).filter(workspace => workspace.is_owner),
      isPlatformAdmin: Boolean(loaded?.isPlatformAdmin),
      showClusters: Boolean(loaded?.platformCapabilities.cluster_management),
      showAuditLog: Boolean(loaded?.platformCapabilities.audit_log),
      showPlatformSettings: Boolean(loaded?.platformCapabilities.configuration),
      openWorkspace: insideWorkspace && !owns ? openWorkspace : null,
      labels: {
        workspaces: t('nav.workspaces'),
        myWorkspaces: t('nav.myWorkspaces'),
        overview: t('nav.overview'),
        extensions: t('nav.extensions'),
        usage: t('nav.usage'),
        billing: t('nav.billing'),
        bills: t('nav.bills'),
        platform: t('nav.platform'),
        allWorkspaces: t('nav.allWorkspaces'),
        clusters: t('nav.clusters'),
        auditLog: t('nav.auditLog'),
        platformSettings: t('nav.platformSettings')
      }
    })
  }, [state, openWorkspace, pathname, t])

  return (
    <div className='admin-shell console-shell'>
      <Sidebar navItems={navItems} activePath={pathname} mobileOpen={mobileOpen} />
      {isMobile && mobileOpen && <div className='sidebar-overlay' onClick={() => setMobileOpen(false)} />}
      <div className='admin-main'>
        <div className='admin-content'>
          <ConsoleTopbar showMenuToggle={isMobile} onMenuToggle={() => setMobileOpen(open => !open)} />
          <main className='d365-content-body'>{children}</main>
        </div>
      </div>
    </div>
  )
}
