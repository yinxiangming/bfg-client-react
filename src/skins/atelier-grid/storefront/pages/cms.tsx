'use client'

import Link from 'next/link'
import { useState } from 'react'
import BrandImage from '@/components/storefront/BrandImage'
import { projects, services, products } from '../content'

type Props = { pageData: { title?: string; slug?: string }; slug?: string }

export default function CmsPage({ pageData, slug }: Props) {
  const current = slug || pageData.slug || ''
  const [filter, setFilter] = useState('All')
  const title = pageData.title || current

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
        {projects.filter(project => filter === 'All' || project.category === filter).map((project, index) => <figure key={project.title}>
          <Link href={project.path}><div className='ag-photo'><BrandImage brand='ultimate-space' src={project.image} alt={project.title} sizes='(max-width: 760px) 100vw, 50vw' loading={index < 2 ? 'eager' : 'lazy'} width={1200} height={900} /></div>
          <figcaption><div><h2>{project.title}</h2><p>{project.location}</p></div><span className='ag-project-number'>{String(projects.indexOf(project) + 1).padStart(2, '0')}</span></figcaption></Link>
        </figure>)}
      </div>}
      {current === 'services' && <div className='ag-service-grid'>
        {services.map((service, index) => <article className='ag-service' key={service.title}>
          <Link href={service.path} aria-label={service.title}><div className='ag-photo'><BrandImage brand='ultimate-space' src={service.image} alt={service.title} sizes='(max-width: 760px) 100vw, 50vw' width={800} height={600} loading={index < 2 ? 'eager' : 'lazy'} /></div></Link>
          <h2><Link href={service.path}>{service.title}</Link></h2><p>{service.description}</p><Link className='ag-text-link' href={service.path}>View service <span aria-hidden='true'>↗</span></Link>
        </article>)}
      </div>}
      {current === 'products' && <div className='ag-products'>
        {products.map((product, index) => <article className='ag-product' key={product.title}>
          <Link href={product.path} aria-label={product.title}><div className='ag-photo'><BrandImage brand='ultimate-space' src={product.image} alt={product.title} sizes='(max-width: 760px) 100vw, 33vw' width={800} height={800} loading={index < 3 ? 'eager' : 'lazy'} /></div></Link>
          <h2><Link href={product.path}>{product.title}</Link></h2><p>{product.description}</p><Link href={product.path} className='ag-text-link'>View product <span aria-hidden='true'>↗</span></Link>
        </article>)}
      </div>}
      {(current === 'contact' || current === 'about') && <div className='ag-studio'>
        <BrandImage brand='ultimate-space' src={services[3].image} alt='Interior materials and spaces' sizes='(max-width: 760px) 100vw, 50vw' width={800} height={1000} />
        <div>{current === 'about' ? <>
          <h2>Window treatments, thoughtfully considered.</h2>
          <p>Ultimate Space Design provides window treatments and interior design for Auckland homes and commercial spaces.</p>
          <p>Our services include curtains, shutters, window-system installation, automation, alterations and repairs. We bring together materials, light and practical details to suit each space.</p>
          <p>Explore our completed projects to see examples of our work, or talk with us about your requirements.</p>
        </> : <>
          <h2>Talk to us about your space.</h2>
          <p>Contact our Auckland team about curtains, shutters, interior design, automation or repairs to existing window treatments.</p>
          <p>To help us understand your enquiry, include your location, the service you need and any available measurements or photos. For repairs, describe the issue and the type of window treatment.</p>
        </>}
          <div className='ag-contact-details'>
            <div><small>Visit the studio</small><address>7/28 Harrison Road<br />Auckland 1060, New Zealand</address></div>
            <div><small>Start a conversation</small><a href='mailto:info@dygroup.co.nz'>info@dygroup.co.nz ↗</a><br /><a href='tel:+6492650797'>+64 9 265 0797</a></div>
            <Link href='/services' className='ag-text-link'>Explore our services <span aria-hidden='true'>↗</span></Link>
          </div>
        </div>
      </div>}
    </section>
  )
}
