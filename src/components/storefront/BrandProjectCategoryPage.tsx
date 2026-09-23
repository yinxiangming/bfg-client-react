import Link from 'next/link'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import BrandImage from './BrandImage'
import { fetchRenderedCmsPost } from '@/services/storefrontCmsApi'
import { brandImagePath, getBrandPostImage, getBrandSite } from '@/utils/brandSites'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { buildBreadcrumbJsonLd, clampDescription, getRequestOrigin, jsonLdScript } from '@/utils/seo'

type Category = 'residential' | 'commercial'
export type BrandProjectCategoryProps = { params: Promise<{ slug: string }> }

function isCategory(value: string): value is Category {
  return value === 'residential' || value === 'commercial'
}

const loadCategory = cache(async (category: Category) => {
  const locale = await getLocale()
  const host = (await headers()).get('host') || undefined
  const config = await getStorefrontConfigForServer(locale, host)
  const brand = getBrandSite(config)
  if (!brand || brand.slug !== 'ultimate-space-design') return null
  const items = brand.posts.filter(
    post => 'projectCategory' in post && post.projectCategory === category
  )
  const rendered = await Promise.all(items.map(async item => {
    const post = await fetchRenderedCmsPost(item.slug, locale, host, {
      revalidate: 60,
      languages: config?.languages,
    })
    return post ? { item, post } : null
  }))
  const posts = rendered.filter((item): item is NonNullable<typeof item> => item !== null)
  return posts.length ? { brand, posts, origin: await getRequestOrigin() } : null
})

export async function brandProjectCategoryMetadata(
  { params }: BrandProjectCategoryProps
): Promise<Metadata> {
  const category = (await params).slug
  if (!isCategory(category)) return { title: 'Not found', robots: { index: false, follow: false } }
  const data = await loadCategory(category)
  if (!data) return { title: 'Not found', robots: { index: false, follow: false } }
  const label = category === 'residential' ? 'Residential projects' : 'Commercial projects'
  const title = `${label} | ${data.brand.name}`
  const description = clampDescription(
    `${label} by ${data.brand.name}, including interior design, window treatments and installation across Auckland.`
  )
  const path = `/projects/${category}`
  const image = brandImagePath(
    data.brand,
    getBrandPostImage(data.posts[0].post, data.posts[0].item),
    1600
  )
  const images = [{ url: `${data.origin}${image}`, alt: data.posts[0].post.title }]
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${data.origin}${path}` },
    openGraph: { type: 'website', title, description, url: `${data.origin}${path}`, siteName: data.brand.name, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(item => item.url) },
  }
}

export default async function BrandProjectCategoryPage({ params }: BrandProjectCategoryProps) {
  const category = (await params).slug
  if (!isCategory(category)) notFound()
  const data = await loadCategory(category)
  if (!data) notFound()
  const label = category === 'residential' ? 'Residential projects' : 'Commercial projects'
  const path = `/projects/${category}`
  return (
    <section className='ag-page'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildBreadcrumbJsonLd(data.origin, [
          { name: 'Home', path: '/' },
          { name: 'Projects', path: '/projects' },
          { name: label, path },
        ])) }}
      />
      <nav aria-label='Breadcrumb' style={{ fontSize: 13, marginBottom: 32 }}>
        <Link href='/'>Home</Link> / <Link href='/projects'>Projects</Link> / <span aria-current='page'>{label}</span>
      </nav>
      <div className='ag-page-heading'>
        <h1>{label}</h1>
        <nav className='ag-filters' aria-label='Project categories'>
          <Link href='/projects'>All</Link>
          <Link href='/projects/residential' aria-current={category === 'residential' ? 'page' : undefined}>Residential</Link>
          <Link href='/projects/commercial' aria-current={category === 'commercial' ? 'page' : undefined}>Commercial</Link>
        </nav>
      </div>
      <div className='ag-gallery'>
        {data.posts.map(({ item, post }, index) => (
          <figure key={item.slug}>
            <Link href={item.path} aria-label={post.title}>
              <div className='ag-photo'>
                <BrandImage
                  brand={data.brand.assetFolder}
                  src={getBrandPostImage(post, item)}
                  alt={post.title}
                  sizes='(max-width: 760px) 100vw, 50vw'
                  loading={index < 2 ? 'eager' : 'lazy'}
                  width={1200}
                  height={900}
                />
              </div>
              <figcaption><div><h2>{post.title}</h2></div></figcaption>
            </Link>
          </figure>
        ))}
      </div>
    </section>
  )
}
