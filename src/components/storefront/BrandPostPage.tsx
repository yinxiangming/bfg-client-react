import Link from 'next/link'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { fetchRenderedCmsPost } from '@/services/storefrontCmsApi'
import { brandImagePath, fetchBrandPost, getBrandPostImage, type BrandSection } from '@/utils/brandSites'
import { getRequestOrigin, clampDescription, jsonLdScript, buildBreadcrumbJsonLd } from '@/utils/seo'
import BrandImage from './BrandImage'
import './BrandPostPage.css'
import { buildBrandContentSchema } from '@/utils/brandContentSchema'

export type BrandPostProps = { params: Promise<{ slug: string }> }
export const loadBrandPost = cache(async (slug: string, section: BrandSection) => {
  const locale = await getLocale()
  const host = (await headers()).get('host') || undefined
  const config = await getStorefrontConfigForServer(locale, host)
  const result = await fetchBrandPost(config, slug, section, () =>
    fetchRenderedCmsPost(slug, locale, host, { revalidate: 60, languages: config?.languages })
  )
  return result ? { ...result, origin: await getRequestOrigin() } : null
})

export async function brandPostMetadata({ params }: BrandPostProps, section: BrandSection): Promise<Metadata> {
  const data = await loadBrandPost((await params).slug, section)
  if (!data) return { title: 'Not found', robots: { index: false, follow: false } }
  const { brand, item, post, origin } = data
  const title = post.meta_title || `${post.title} | ${brand.name}`
  const description = clampDescription(post.meta_description || post.excerpt || post.content)
  const image = getBrandPostImage(post, item)
  const localImage = image ? brandImagePath(brand, image, 1600) : ''
  const images = localImage ? [{ url: `${origin}${localImage}`, alt: post.title }] : undefined
  return { title: { absolute: title }, description, alternates: { canonical: `${origin}${item.path}` },
    openGraph: { title, description, url: `${origin}${item.path}`, siteName: brand.name, type: 'article', images },
    twitter: { card: 'summary_large_image', title, description, images: images?.map(i => i.url) } }
}

export default async function BrandPostPage({ params, section }: BrandPostProps & { section: BrandSection }) {
  const data = await loadBrandPost((await params).slug, section)
  if (!data) notFound()
  const { brand, item, post, origin } = data
  const repair = brand.slug === 'repair-hub'
  const parent = section === 'service' ? '/services' : section === 'parts' ? '/products' : '/projects'
  const parentLabel = section === 'service'
    ? 'Services'
    : section === 'parts'
      ? repair ? 'Parts' : 'Products'
      : 'Projects'
  const related = brand.posts.filter(p => p.category === item.category && p.slug !== item.slug).slice(0, 3)
  const sourceImage = getBrandPostImage(post, item)
  const image = sourceImage ? brandImagePath(brand, sourceImage, 1600) : undefined
  const schema = buildBrandContentSchema({
    brandSlug: brand.slug, section, slug: item.slug,
    url: `${origin}${item.path}`, organizationId: `${origin}/#organization`, name: post.title,
    description: post.excerpt || clampDescription(post.content), image: image ? `${origin}${image}` : undefined,
    dateModified: post.updated_at || undefined,
  })
  return <article className={repair ? 'repair-grid-cms brand-detail' : 'ag-page brand-detail'}>
    <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: jsonLdScript([schema, buildBreadcrumbJsonLd(origin, [{ name: 'Home', path: '/' }, { name: parentLabel, path: parent }, { name: post.title, path: item.path }])]) }} />
    <nav aria-label='Breadcrumb' style={{ fontSize: 13, marginBottom: 32 }}><Link href='/'>Home</Link> / <Link href={parent}>{parentLabel}</Link> / <span aria-current='page'>{post.title}</span></nav>
    <h1 style={{ textAlign: 'left', maxWidth: 1050, marginBottom: 32 }}>{post.title}</h1>
    <div className='brand-detail-grid'>
      {sourceImage && <BrandImage brand={brand.assetFolder} src={sourceImage} alt={post.title} loading='eager' fetchPriority='high' sizes='(max-width: 900px) 100vw, 58vw' style={{ width: '100%', height: 'auto' }} />}
      <div className='brand-detail-copy'><div dangerouslySetInnerHTML={{ __html: post.content || '' }} /><p><Link href='/contact'>Discuss your {section === 'projects' ? 'project' : 'requirements'} ↗</Link></p><p><Link href='/services'>Explore our services</Link></p></div>
    </div>
    {related.length > 0 && <aside className='brand-related'><h2>Related {parentLabel.toLowerCase()}</h2>{related.map(p => <Link key={p.slug} href={p.path}>{p.title} ↗</Link>)}</aside>}
  </article>
}
