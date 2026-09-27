import Link from 'next/link'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import BrandImage from './BrandImage'
import { fetchRenderedCmsPage } from '@/services/storefrontCmsApi'
import { cmsPosts, cmsPostImage, type CmsBrandPost } from '@/utils/cmsBrandContent'
import { getBrandSite } from '@/utils/brandSites'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { buildBreadcrumbJsonLd, clampDescription, getRequestOrigin, jsonLdScript } from '@/utils/seo'

type Category = 'residential' | 'commercial'
export type BrandProjectCategoryProps = { params: Promise<{ slug: string }> }

function isCategory(value: string): value is Category {
  return value === 'residential' || value === 'commercial'
}

function postPath(post: CmsBrandPost): string {
  const path = post.custom_fields?.public_path
  return typeof path === 'string' && path.startsWith('/projects/') ? path : '/projects/' + post.slug
}

const loadCategory = cache(async (category: Category) => {
  const locale = await getLocale()
  const host = (await headers()).get('host') || undefined
  const config = await getStorefrontConfigForServer(locale, host)
  const brand = getBrandSite(config)
  if (!brand) return null
  const page = await fetchRenderedCmsPage('projects', locale, host, {
    revalidate: 60,
    languages: config?.languages,
  })
  const posts = cmsPosts(page).filter(post => post.custom_fields?.project_category === category)
  return posts.length
    ? {
      brand,
      posts,
      origin: await getRequestOrigin(),
      siteName: config?.site_name?.trim() || brand.slug,
      siteDescription: config?.site_description?.trim() || '',
    }
    : null
})

export async function brandProjectCategoryMetadata({ params }: BrandProjectCategoryProps): Promise<Metadata> {
  const category = (await params).slug
  if (!isCategory(category)) return { title: 'Not found', robots: { index: false, follow: false } }
  const data = await loadCategory(category)
  if (!data) return { title: 'Not found', robots: { index: false, follow: false } }
  const label = category === 'residential' ? 'Residential projects' : 'Commercial projects'
  const title = `${label} | ${data.siteName}`
  const description = clampDescription(data.posts[0].meta_description || data.posts[0].excerpt || data.siteDescription || title)
  const image = cmsPostImage(data.posts[0])
  const localImage = image ? `${data.origin}${image}` : undefined
  const images = localImage ? [{ url: localImage, alt: data.posts[0].title }] : undefined
  const path = '/projects/' + category
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${data.origin}${path}` },
    openGraph: { type: 'website', title, description, url: `${data.origin}${path}`, siteName: data.siteName, images },
    twitter: { card: 'summary_large_image', title, description, images: images?.map(item => item.url) },
  }
}

export default async function BrandProjectCategoryPage({ params }: BrandProjectCategoryProps) {
  const category = (await params).slug
  if (!isCategory(category)) notFound()
  const data = await loadCategory(category)
  if (!data) notFound()
  const label = category === 'residential' ? 'Residential projects' : 'Commercial projects'
  const path = '/projects/' + category
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
        {data.posts.map((post, index) => (
          <figure key={post.slug}>
            <Link href={postPath(post)} aria-label={post.title}>
              <div className='ag-photo'>
                <BrandImage
                  brand={data.brand.assetFolder}
                  src={cmsPostImage(post)}
                  alt={post.title || ''}
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
