'use client'

import Link from 'next/link'

export default function AtelierGridHome() {
  return (
    <>
      <section className='atelier-grid-hero'>
        <div className='atelier-grid-hero-copy'><div className='atelier-grid-kicker'>Architecture · Interiors · Window treatments</div><h1>Space, edited down to what matters.</h1><p>Thoughtful design and precise installation for rooms that feel calm, capable, and entirely their own.</p><Link href='/projects' className='atelier-grid-arrow-link'>View selected work <span aria-hidden='true'>↗</span></Link></div>
        <div className='atelier-grid-hero-panel'><div className='atelier-grid-panel-number'>01</div><div className='atelier-grid-panel-shape' aria-hidden='true'><span /></div><div className='atelier-grid-panel-caption'>Material / light / proportion</div></div>
      </section>
      <section className='atelier-grid-intro'><div className='atelier-grid-kicker'>The approach</div><div className='atelier-grid-intro-copy'><h2>Useful beauty, made for the way you live and work.</h2><p>From the first sketch to the final adjustment, every decision is grounded in context, comfort, and craft.</p><Link href='/about' className='atelier-grid-arrow-link'>About the studio <span aria-hidden='true'>↗</span></Link></div></section>
      <section className='atelier-grid-cards'><article><span>01 /</span><h3>Selected projects</h3><p>Commercial, healthcare, and residential work shaped around people and place.</p><Link href='/projects'>Explore projects ↗</Link></article><article><span>02 /</span><h3>Made to fit</h3><p>Window treatments, shutters, tracks, and automation specified and installed with care.</p><Link href='/services'>See services ↗</Link></article><article><span>03 /</span><h3>A considered start</h3><p>Bring us a room, a brief, or a question. We will help make the next step clear.</p><Link href='/contact'>Talk to the studio ↗</Link></article></section>
    </>
  )
}
