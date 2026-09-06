import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSiteConfig } from '@/utils/siteMetadata'
import { getRequestOrigin, clampDescription } from '@/utils/seo'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { fetchRenderedCmsPost } from '@/services/storefrontCmsApi'
import type { Metadata } from 'next'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

async function getPostData(slug: string, locale: string, requestHost?: string, languages?: string[]) {
  return fetchRenderedCmsPost(slug, locale, requestHost, { revalidate: 60, languages })
}

function normalizePostSlug(slug: string) {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = normalizePostSlug(rawSlug)
  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const [postData, { site_name }, origin] = await Promise.all([
    getPostData(slug, locale, requestHost, config?.languages),
    getSiteConfig(locale, requestHost),
    getRequestOrigin(),
  ])
  const title = (postData?.meta_title || postData?.title || slug) as string
  const description =
    clampDescription((postData?.meta_description || postData?.excerpt) as string | undefined) ||
    `${title} - ${site_name}`
  const canonical = origin ? `${origin}/post/${encodeURIComponent(slug)}` : `/post/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'article', title, description, url: canonical, siteName: site_name },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function StorefrontPostPage({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = normalizePostSlug(rawSlug)
  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const post = await getPostData(slug, locale, requestHost, config?.languages)

  if (!post) {
    notFound()
  }

  const imageUrl =
    post.featured_image ||
    (typeof post.custom_fields?.image_url === 'string' ? post.custom_fields.image_url : '')

  return (
    <article>
      <section className='nzcba-page-hero'>
        <div className='nzcba-page-hero__inner'>
          <p className='nzcba-eyebrow'>{post.category_name || 'Association Update'}</p>
          <h1>{post.title}</h1>
          {post.published_at && (
            <p>
              {new Date(post.published_at).toLocaleDateString(locale)}
              {post.author_name ? ` - ${post.author_name}` : ''}
            </p>
          )}
        </div>
      </section>
      <section className='nzcba-section nzcba-section--white'>
        <div className='nzcba-section__inner'>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=''
              width={1180}
              height={620}
              style={{ width: '100%', height: 'auto', borderRadius: 8, marginBottom: 28 }}
            />
          )}
          <div
            className='nzcba-rich-text'
            dangerouslySetInnerHTML={{ __html: post.content || post.excerpt || '' }}
          />
        </div>
      </section>
    </article>
  )
}
