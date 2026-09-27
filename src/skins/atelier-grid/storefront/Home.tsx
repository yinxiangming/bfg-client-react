'use client'

import Link from 'next/link'
import { useState } from 'react'
import BrandImage from '@/components/storefront/BrandImage'
import { cmsHero } from '@/utils/cmsBrandContent'

type Props = { pageData?: any; locale?: string }

export default function AtelierGridHome({ pageData, locale = 'en' }: Props) {
  const hero = cmsHero(pageData, locale)
  const slides = hero.slides.length
    ? hero.slides
    : hero.image
      ? [{ image: hero.image, title: hero.title, subtitle: hero.subtitle, link: '' }]
      : []
  const [active, setActive] = useState(0)
  return (
    <section className='atelier-grid-hero' aria-label='Selected interiors'>
      <div className='ag-slides'>{slides.map((slide, index) => <BrandImage key={slide.image} brand='ultimate-space' src={slide.image} alt={slide.title || ''} sizes='100vw' loading={index === 0 ? 'eager' : 'lazy'} className={active === index ? 'is-active' : ''} aria-hidden={active !== index} fetchPriority={index === 0 ? 'high' : 'auto'} />)}</div>
      <div className='atelier-grid-hero-copy'>
        {hero.title && <h1>{hero.title}</h1>}
        {hero.subtitle && <p>{hero.subtitle}</p>}
        <Link href='/projects' className='atelier-grid-arrow-link'>View Projects</Link>
      </div>
      {slides.length > 1 && <div className='atelier-grid-slide-count' aria-label='Select interior image'>{slides.map((slide, index) => <button key={slide.image} type='button' aria-label={`Show image ${index + 1}: ${slide.title || 'image'}`} aria-pressed={active === index} onClick={() => setActive(index)}><span /></button>)}</div>}
    </section>
  )
}
