'use client'

import Link from 'next/link'
import BrandImage from '@/components/storefront/BrandImage'

const featured = [
  { title: 'Wheelchair general service', path: '/projects/wheel-chair-general-service', image: '1776850444971-730008485.webp' },
  { title: 'Mobility scooter service and repair', path: '/projects/mobility-scooter-service-and-repair', image: '1776850658369-648600445.webp' },
  { title: 'Powerchair service and repair', path: '/projects/powerchair-service-and-repair', image: '1776851070926-759348583.jpg' },
]

export default function RepairGridHome() {
  return (
    <>
      <section className='repair-grid-hero'>
        <BrandImage brand='repair-hub' src='1778651484785-339303501.jpg' alt='' sizes='100vw' loading='eager' fetchPriority='high' aria-hidden='true' />
        <div className='repair-grid-hero-copy'>
          <h1>Your trusted local mobility service and repair provider<span>.</span></h1>
          <div className='repair-grid-actions'>
            <Link className='repair-grid-button repair-grid-button-primary' href='/projects'>View Our Work</Link>
            <Link className='repair-grid-button repair-grid-button-quiet' href='/contact'>Get In Touch</Link>
          </div>
        </div>
      </section>
      <section className='repair-grid-featured'>
        <h2>Featured Projects</h2>
        <p>Explore our latest service and repair work</p>
        <div className='repair-grid-cards'>
          {featured.map(project => <article key={project.path}>
            <Link href={project.path} aria-label={project.title}><BrandImage brand='repair-hub' src={project.image} alt={project.title} sizes='(max-width: 780px) 100vw, 33vw' /></Link>
            <div className='repair-grid-card-body'><h3><Link href={project.path}>{project.title}</Link></h3><p>Auckland, NZ • 2026</p><Link href={project.path}>View Details</Link></div>
          </article>)}
        </div>
        <Link className='repair-grid-view-all' href='/projects'>View All Projects</Link>
      </section>
    </>
  )
}
