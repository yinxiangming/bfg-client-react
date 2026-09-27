'use client'

import Link from 'next/link'
import { useState } from 'react'
import BrandImage from '@/components/storefront/BrandImage'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { cmsPosts, cmsPostImage, cmsText } from '@/utils/cmsBrandContent'

type Props = { pageData: { title?: string; slug?: string }; slug?: string }

export default function CmsPage({ pageData, slug }: Props) {
  const current = slug || pageData.slug || ''
  const [filter, setFilter] = useState('All')
  const config = useStorefrontConfigSafe()
  const posts = cmsPosts(pageData)
  const copy = cmsText(pageData)
  const title = pageData.title || current
  const hasProjectCategories = posts.some(post => typeof post.custom_fields?.project_category === 'string')
  const visibleProjects = !hasProjectCategories || filter === 'All'
    ? posts
    : posts.filter(project => String(project.custom_fields?.project_category).toLowerCase() === filter.toLowerCase())

  return (
    <section className={`ag-page ${current === 'services' ? 'ag-services' : ''}`}>
      <div className='ag-page-heading'>
        <h1>{title}</h1>
        {current === 'projects' && <nav className='ag-filters' aria-label='Project categories'>
          <button type='button' aria-pressed={filter === 'All'} onClick={() => setFilter('All')}>All</button>
          <Link href='/projects/residential' onMouseEnter={() => setFilter('Residential')} onFocus={() => setFilter('Residential')}>Residential</Link>
          <Link href='/projects/commercial' onMouseEnter={() => setFilter('Commercial')} onFocus={() => setFilter('Commercial')}>Commercial</Link>
        </nav>}
      </div>
      {current === 'projects' && <div className='ag-gallery'>
        {visibleProjects.map((project, index) => <figure key={project.slug}>
          <Link href={`/projects/${project.slug}`}><div className='ag-photo'><BrandImage brand='ultimate-space' src={cmsPostImage(project)} alt={project.title} sizes='(max-width: 760px) 100vw, 50vw' loading={index < 2 ? 'eager' : 'lazy'} width={1200} height={900} /></div>
          <figcaption><div><h2>{project.title}</h2><p>{project.excerpt || ''}</p></div><span className='ag-project-number'>{String(index + 1).padStart(2, '0')}</span></figcaption></Link>
        </figure>)}
      </div>}
      {current === 'services' && <div className='ag-service-grid'>
        {posts.map((service, index) => <article className='ag-service' key={service.slug}>
          <Link href={`/service/${service.slug}`} aria-label={service.title}><div className='ag-photo'><BrandImage brand='ultimate-space' src={cmsPostImage(service)} alt={service.title} sizes='(max-width: 760px) 100vw, 50vw' width={800} height={600} loading={index < 2 ? 'eager' : 'lazy'} /></div></Link>
          <h2><Link href={`/service/${service.slug}`}>{service.title}</Link></h2><p>{service.excerpt || ''}</p><Link className='ag-text-link' href={`/service/${service.slug}`}>View service <span aria-hidden='true'>↗</span></Link>
        </article>)}
      </div>}
      {current === 'products' && <div className='ag-products'>
        {posts.map((product, index) => <article className='ag-product' key={product.slug}>
          <Link href={`/parts/${product.slug}`} aria-label={product.title}><div className='ag-photo'><BrandImage brand='ultimate-space' src={cmsPostImage(product)} alt={product.title} sizes='(max-width: 760px) 100vw, 33vw' width={800} height={800} loading={index < 3 ? 'eager' : 'lazy'} /></div></Link>
          <h2><Link href={`/parts/${product.slug}`}>{product.title}</Link></h2><p>{product.excerpt || ''}</p><Link href={`/parts/${product.slug}`} className='ag-text-link'>View product <span aria-hidden='true'>↗</span></Link>
        </article>)}
      </div>}
      {(current === 'contact' || current === 'about') && <div className='ag-studio'>
        <div><h2>{title}</h2>{copy.map((html, index) => <div key={index} dangerouslySetInnerHTML={{ __html: html }} />)}
          <div className='ag-contact-details'>
            <div><small>Contact</small><address>{config.footer_contact || 'Contact details available on request'}</address></div>
            <div><small>Start a conversation</small>{config.contact_email && <><a href={`mailto:${config.contact_email}`}>{config.contact_email} ↗</a><br /></>}{config.contact_phone && <a href={`tel:${config.contact_phone.replace(/\s+/g, '')}`}>{config.contact_phone}</a>}</div>
            <Link href='/services' className='ag-text-link'>Explore our services <span aria-hidden='true'>↗</span></Link>
          </div>
        </div>
      </div>}
    </section>
  )
}
