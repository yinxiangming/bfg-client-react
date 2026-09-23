'use client'

import Link from 'next/link'
import { useState } from 'react'
import BrandImage from '@/components/storefront/BrandImage'

const slides = [
  ['1778826732244-122552934.jpg', 'Considered window treatments and architectural interiors'],
  ['1778826748628-567488772.jpg', 'Kitchen interior with custom shutters'],
  ['1778826756665-702923088.jpg', 'Natural light and bespoke window treatments'],
  ['1778827080718-299272827.jpg', 'Interior details by Ultimate Space Design'],
]

export default function AtelierGridHome() {
  const [active, setActive] = useState(0)
  return (
    <section className='atelier-grid-hero' aria-label='Selected interiors'>
      <div className='ag-slides'>{slides.map(([file, alt], index) => <BrandImage key={file} brand='ultimate-space' src={file} alt={alt} sizes='100vw' loading={index === 0 ? 'eager' : 'lazy'} className={active === index ? 'is-active' : ''} aria-hidden={active !== index} fetchPriority={index === 0 ? 'high' : 'auto'} />)}</div>
      <div className='atelier-grid-hero-copy'><h1>Home</h1><Link href='/projects' className='atelier-grid-arrow-link'>View Projects</Link></div>
      <div className='atelier-grid-slide-count' aria-label='Select interior image'>{slides.map(([, alt], index) => <button key={alt} type='button' aria-label={`Show image ${index + 1}: ${alt}`} aria-pressed={active === index} onClick={() => setActive(index)}><span /></button>)}</div>
    </section>
  )
}
