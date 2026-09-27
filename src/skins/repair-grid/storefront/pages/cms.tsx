'use client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import BrandImage from '@/components/storefront/BrandImage'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { cmsPosts, cmsPostImage, cmsText } from '@/utils/cmsBrandContent'
type Props={pageData:{title?:string;slug?:string};slug?:string}
export default function CmsPage({ pageData, slug }: Props) {
  const current = slug || pageData.slug || ''
  const [emailReady, setEmailReady] = useState(false)
  const config = useStorefrontConfigSafe()
  const posts = cmsPosts(pageData)
  const copy = cmsText(pageData)
  const openEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const body = `Name: ${fields.get('name')}\nEmail: ${fields.get('email')}\nPhone: ${fields.get('phone')}\n\n${fields.get('message')}`
    const email = config.contact_email?.trim()
    if (!email) return
    window.location.href = `mailto:${email}?subject=${encodeURIComponent('Website enquiry')}&body=${encodeURIComponent(body)}`
    setEmailReady(true)
  }
  if (current === 'contact') return <section className='repair-grid-cms repair-grid-contact'>
    <h1>{pageData.title || 'Contact'}</h1>{copy.map((html, index) => <div key={index} dangerouslySetInnerHTML={{ __html: html }} />)}
    <div className='repair-grid-contact-grid'>
      <form onSubmit={openEmail}>
        <label>Name<input name='name' autoComplete='name' /></label>
        <label>Email *<input name='email' type='email' autoComplete='email' required /></label>
        <label>Phone<input name='phone' type='tel' autoComplete='tel' /></label>
        <label>How can we help? *<textarea name='message' required /></label>
        <button type='submit' disabled={!config.contact_email?.trim()}>Continue in your email app ↗</button>
        <p style={{ fontSize: 13, color: '#73767b', lineHeight: 1.6 }} role='status'>{emailReady ? 'Your email app has been requested. Send the draft there, or contact us directly using the details alongside.' : 'Opens an email draft for you to review and send.'}</p>
      </form>
      <div>{config.site_name && <h2>{config.site_name}</h2>}{config.site_description && <p>{config.site_description}</p>}{config.footer_contact && <address>{config.footer_contact}</address>}{config.contact_phone && <a href={`tel:${config.contact_phone.replace(/\s+/g, '')}`}>{config.contact_phone}</a>}{config.contact_email && <a href={`mailto:${config.contact_email}`}>{config.contact_email} ↗</a>}</div>
    </div>
  </section>
  if (current === 'about') return <section className='repair-grid-cms'>
    <h1>{pageData.title || 'About'}</h1>{copy.map((html, index) => <div key={index} dangerouslySetInnerHTML={{ __html: html }} />)}<p><Link href='/contact'>Contact us ↗</Link></p>
  </section>
  return <section className='repair-grid-cms'>
    <h1>{pageData.title || current}</h1>
    <div className='repair-grid-cms-grid'>{posts.map((row, index) => { const section = current === 'projects' ? 'projects' : current === 'services' ? 'service' : 'parts'; const path = `/${section}/${row.slug}`; return <article key={row.slug}>
      <Link href={path} aria-label={row.title}><BrandImage brand='repair-hub' src={cmsPostImage(row)} alt={row.title} width={800} height={600} sizes='(max-width: 780px) 100vw, 33vw' loading={index < 3 ? 'eager' : 'lazy'} /></Link>
      <div><h2><Link href={path}>{row.title}</Link></h2><p>{row.excerpt || ''}</p><Link href={path}>View details ↗</Link></div>
    </article>})}</div>
  </section>
}
