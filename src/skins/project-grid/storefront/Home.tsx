'use client'

import Link from 'next/link'

export default function ProjectGridHome() {
  return <>
    <section className='project-grid-hero'><div className='project-grid-hero-copy'><div className='project-grid-eyebrow'>ENGINEERING · DELIVERY · CRAFT</div><h1>Projects with a clear line from brief to build.</h1><p>A practical, confident layout for teams who plan, make, install, and deliver work that has to perform.</p><div className='project-grid-actions'><Link className='project-grid-button project-grid-button-primary' href='/contact'>Start a conversation <span>↗</span></Link><Link className='project-grid-button project-grid-button-quiet' href='/projects'>View projects</Link></div></div><div className='project-grid-hero-panel' aria-hidden='true'><div className='project-grid-panel-ring' /><div className='project-grid-panel-label'>PLAN<br />BUILD<br />DELIVER</div></div></section>
    <section className='project-grid-section'><div className='project-grid-section-heading'><div><div className='project-grid-eyebrow'>THE WORKFLOW</div><h2>Complex work, made easier to follow.</h2></div><Link href='/projects'>See selected work ↗</Link></div><div className='project-grid-cards'><article><span className='project-grid-card-number'>01</span><h3>Plan with purpose</h3><p>Turn the brief, constraints, and priorities into a clear plan everyone can work from.</p><Link href='/services'>Explore services ↗</Link></article><article><span className='project-grid-card-number'>02</span><h3>Build with care</h3><p>Show the people, methods, materials, and decisions that move each project forward.</p><Link href='/projects'>View projects ↗</Link></article><article><span className='project-grid-card-number'>03</span><h3>Deliver with confidence</h3><p>Make the next step obvious, from a first conversation to handover and ongoing support.</p><Link href='/contact'>Talk to the team ↗</Link></article></div></section>
  </>
}
