'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Logo from '@components/Logo'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { getStoreImageUrl } from '@/utils/media'
import { bfgApi, getApiHeaders } from '@/utils/api'

type StoreFooterProps = { mode?: 'light' | 'dark' }

export default function StoreFooter(_props: StoreFooterProps) {
  const t = useTranslations('storefront')
  const config = useStorefrontConfigSafe()
  const hasSocial = config.facebook_url || config.twitter_url || config.instagram_url
  const hasFooterMenus = config.footer_menus && config.footer_menus.length > 0

  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = newsletterEmail.trim()
    if (!email) return
    setNewsletterLoading(true)
    setNewsletterMessage(null)
    try {
      const res = await fetch(bfgApi.newsletterSubscriptions(), {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email }),
        credentials: 'include',
      })
      if (res.ok) {
        setNewsletterMessage({ type: 'success', text: t('footer.newsletterSuccess') })
        setNewsletterEmail('')
      } else {
        const data = await res.json().catch(() => ({}))
        setNewsletterMessage({ type: 'error', text: (data.email?.[0] || data.detail) || t('footer.newsletterError') })
      }
    } catch {
      setNewsletterMessage({ type: 'error', text: t('footer.newsletterError') })
    } finally {
      setNewsletterLoading(false)
    }
  }

  return (
    <footer className='sf-footer'>
      <div className='sf-footer-content'>
        <div className='sf-footer-grid'>
          <div className='sf-footer-section'>
            <div style={{ marginBottom: '1rem' }}>
              <Logo color='#ffffff' />
            </div>
            <h3>{t('footer.contactUs')}</h3>
            <div style={{ marginBottom: '1rem' }}>
              {config.footer_contact?.trim() && (
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                  {config.footer_contact.trim()}
                </p>
              )}
              {config.site_name && (
                <p style={{ fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <i className='tabler-map-pin' style={{ marginRight: '0.5rem' }} />
                  {config.site_name}
                </p>
              )}
              {config.site_description && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>{config.site_description}</p>
              )}
              {config.contact_email && (
                <p style={{ fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <i className='tabler-mail' style={{ marginRight: '0.5rem' }} />
                  {config.contact_email}
                </p>
              )}
              {config.contact_phone && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  {t('footer.questionsCallUs', { phone: config.contact_phone })}
                </p>
              )}
            </div>
            {hasSocial && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                {config.facebook_url && (
                  <a href={config.facebook_url} target='_blank' rel='noopener noreferrer' style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }} aria-label='Facebook'>
                    <i className='tabler-brand-facebook' style={{ fontSize: '1.25rem' }} />
                  </a>
                )}
                {config.twitter_url && (
                  <a href={config.twitter_url} target='_blank' rel='noopener noreferrer' style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }} aria-label='Twitter'>
                    <i className='tabler-brand-twitter' style={{ fontSize: '1.25rem' }} />
                  </a>
                )}
                {config.instagram_url && (
                  <a href={config.instagram_url} target='_blank' rel='noopener noreferrer' style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }} aria-label='Instagram'>
                    <i className='tabler-brand-instagram' style={{ fontSize: '1.25rem' }} />
                  </a>
                )}
              </div>
            )}
          </div>
          {hasFooterMenus && (
            <div className='sf-footer-section'>
              <h3>{t('footer.ourCompany')}</h3>
              <ul className='sf-footer-links'>
                {config.footer_menus!.map((item, idx) => (
                  <li key={idx}>
                    {item.open_in_new_tab ? <a href={item.url} target='_blank' rel='noopener noreferrer'>{item.title}</a> : <Link href={item.url}>{item.title}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className='sf-footer-section'>
            <h3>{t('footer.newsletterTitle')}</h3>
            <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type='email'
                placeholder={t('footer.yourEmail')}
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                disabled={newsletterLoading}
                style={{ padding: '0.625rem 1rem', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.875rem', outline: 'none' }}
              />
              <button type='submit' className='sf-btn sf-btn-primary sf-btn-full' disabled={newsletterLoading}>
                {newsletterLoading ? t('footer.newsletterSubmitting') : t('buttons.subscribe')}
              </button>
              {newsletterMessage && (
                <p style={{ fontSize: '0.8125rem', color: newsletterMessage.type === 'success' ? 'rgba(255,255,255,0.9)' : 'rgba(255,200,200,0.95)' }}>{newsletterMessage.text}</p>
              )}
            </form>
          </div>
        </div>
        <div className='sf-footer-bottom'>
          <p className='sf-footer-text'>{config.footer_copyright || t('footer.copyright')}</p>
          <div>
            <img src={getStoreImageUrl('modules/cp_footercms1/views/img/payment.png')} alt='Payment methods' style={{ height: '24px', opacity: 0.9 }} />
          </div>
        </div>
      </div>
    </footer>
  )
}
