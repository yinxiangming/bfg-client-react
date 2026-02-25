'use client'

import React from 'react'
import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import type { StorefrontFooterMenuGroup } from '@/utils/storefrontConfig'

type Props = { mode?: 'light' | 'dark' }

const PLACEHOLDER_SITE_NAME = '[Storefront Settings · Site name]'
const PLACEHOLDER_SITE_DESC = '[Site · Site description]'
const PLACEHOLDER_COPYRIGHT = '[Storefront Settings · Footer copyright]'

/**
 * Footer content from CMS (config.footer_menu_groups, site_description from Site, footer_copyright).
 * Styles from website-theme-blocks.css.
 */
export default function WebsiteFooter({ mode = 'light' }: Props) {
  const config = useStorefrontConfigSafe()
  const groups = (config?.footer_menu_groups ?? []) as StorefrontFooterMenuGroup[]
  const brandName = config?.site_name?.trim() || PLACEHOLDER_SITE_NAME
  const description = (config?.site_description ?? '').trim() || PLACEHOLDER_SITE_DESC
  const copyrightText = config?.footer_copyright?.trim() || PLACEHOLDER_COPYRIGHT

  const FOOTER_LEGAL_SLUG = 'footer-legal'
  const isLegalGroup = (g: StorefrontFooterMenuGroup) =>
    g.slug ? g.slug === FOOTER_LEGAL_SLUG : g.name === 'Legal'
  const columnGroups = groups.filter((g) => !isLegalGroup(g))
  const legalGroup = groups.find(isLegalGroup)

  return (
    <footer className="website-footer border-t" data-mode={mode}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="website-footer-logo w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
                X
              </div>
              <span className="website-footer-brand font-bold text-xl">{brandName}</span>
            </div>
            <p className="website-footer-desc text-sm max-w-xs mb-8 leading-relaxed">{description}</p>
            <div className="website-footer-social flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" aria-label="Website">
                <span className="material-symbols-outlined text-lg">public</span>
              </Link>
              <Link href={config?.contact_email ? `mailto:${config.contact_email}` : '#'} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" aria-label="Email">
                <span className="material-symbols-outlined text-lg">mail</span>
              </Link>
            </div>
          </div>
          {columnGroups.map((group) => (
            <div key={group.slug ?? group.name} className="website-footer-col">
              <h4 className="font-bold mb-6 text-sm">{group.name}</h4>
              <ul className="space-y-4 text-sm">
                {group.items.map((item) => (
                  <li key={item.title}>
                    <Link href={item.url || '#'} className="transition-colors" target={item.open_in_new_tab ? '_blank' : undefined} rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="website-footer-legal flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">{copyrightText}</p>
          <div className="flex gap-8 text-sm">
            {legalGroup?.items.map((item) => (
              <Link key={item.title} href={item.url || '#'} className="transition-colors" target={item.open_in_new_tab ? '_blank' : undefined}>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
