'use client'

import Link from 'next/link'
import BrandImage from '@/components/storefront/BrandImage'
import { cmsHero, cmsPosts, cmsPostImage } from '@/utils/cmsBrandContent'
import { brandImageStem } from '@/utils/brandSites'

type Props = { pageData?: any; locale?: string }

export default function RepairGridHome({ pageData, locale = 'en' }: Props) {
  const hero = cmsHero(pageData, locale)
  const featured = cmsPosts(pageData).slice(0, 3)
  return (
    <>
      <section className='repair-grid-hero'>
        {hero.image && <BrandImage brand='repair-hub' src={brandImageStem(hero.image)} alt='' sizes='100vw' loading='eager' fetchPriority='high' aria-hidden='true' />}
        <div className='repair-grid-hero-copy'>
          {hero.title && <h1>{hero.title}<span>.</span></h1>}
          {hero.subtitle && <p>{hero.subtitle}</p>}
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
          {featured.map(project => {
            const path = `/projects/${project.slug}`
            return <article key={path}>
            <Link href={path} aria-label={project.title}><BrandImage brand='repair-hub' src={cmsPostImage(project)} alt={project.title} sizes='(max-width: 780px) 100vw, 33vw' /></Link>
            <div className='repair-grid-card-body'><h3><Link href={path}>{project.title}</Link></h3><p>{project.excerpt || ''}</p><Link href={path}>View Details</Link></div>
          </article>})}
        </div>
        <Link className='repair-grid-view-all' href='/projects'>View All Projects</Link>
      </section>
    </>
  )
}
