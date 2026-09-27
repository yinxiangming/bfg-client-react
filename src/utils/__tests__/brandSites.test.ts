import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBrandContentSchema } from '../brandContentSchema.ts'
import {
  brandImagePath,
  brandImageStem,
  fetchBrandPost,
  getBrandLegacyPath,
  getBrandPostImage,
  getBrandSite,
  isBrandHomeAlias,
} from '../brandSites.ts'

test('brand content schemas distinguish products, services and project work without invented offers', () => {
  const base = { brandSlug: 'repair-hub', slug: '4135-4', url: 'https://example.test/parts/4135-4', organizationId: 'https://example.test/#organization', name: 'Replacement tyre' }
  const product = buildBrandContentSchema({ ...base, section: 'parts' })
  assert.equal(product['@type'], 'Product')
  for (const key of ['offers', 'aggregateRating', 'review', 'manufacturer', 'creator', 'dateModified']) assert.equal(key in product, false)
  assert.equal(buildBrandContentSchema({ ...base, section: 'service' })['@type'], 'Service')
  const callout = buildBrandContentSchema({ ...base, slug: 'call-out-service-product', section: 'parts' })
  assert.equal(callout['@type'], 'Service')
  assert.deepEqual(callout.provider, { '@id': base.organizationId })
  assert.equal(buildBrandContentSchema({ ...base, brandSlug: 'ultimate-space-design', slug: 'call-out-service-product', section: 'parts' })['@type'], 'Product')
  assert.equal(buildBrandContentSchema({ ...base, section: 'projects' })['@type'], 'CreativeWork')
})

test('brand sites require both the exact workspace slug and theme, without embedded post content', () => {
  const repair = getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!
  const ultimate = getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' })!
  assert.equal(repair.assetFolder, 'repair-hub')
  assert.equal(ultimate.assetFolder, 'ultimate-space')
  assert.equal('posts' in repair, false)
  assert.equal(getBrandSite({ workspace_slug: 'repair-hub', theme: 'atelier-grid' }), null)
  assert.equal(getBrandSite({ workspace_slug: 'another-workspace', theme: 'repair-grid' }), null)
  assert.equal(getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'store' }), null)
})

test('/home is an alias only for matched brand workspaces', () => {
  assert.equal(isBrandHomeAlias({ workspace_slug: 'repair-hub', theme: 'repair-grid' }, 'home'), true)
  assert.equal(isBrandHomeAlias({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' }, 'home'), true)
  assert.equal(isBrandHomeAlias({ workspace_slug: 'geeker', theme: 'store' }, 'home'), false)
  assert.equal(isBrandHomeAlias({ workspace_slug: 'repair-hub', theme: 'store' }, 'home'), false)
})

test('image normalization and rendered workspace image precedence', () => {
  assert.equal(brandImageStem('https://therepairhub.co.nz/uploads/1776850444971-730008485.webp'), '1776850444971-730008485')
  assert.equal(brandImageStem('/brand-assets/repair-hub/1776850444971-730008485-960.webp'), '1776850444971-730008485')
  assert.equal(brandImageStem('/uploads/photo-123.webp'), 'photo-123')
  const repair = getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!
  assert.equal(brandImagePath(repair, '/brand-assets/repair-hub/photo-123-960.webp', 1600), '/brand-assets/repair-hub/photo-123-1600.webp')
  assert.equal(getBrandPostImage({ featured_image: 'https://cdn.example/old.jpg', custom_fields: { brand_image: '/brand-assets/repair-hub/custom-960.webp' } }), '/brand-assets/repair-hub/custom-960.webp')
  assert.equal(getBrandPostImage({ featured_image: 'https://cdn.example/current.jpg' }), 'https://cdn.example/current.jpg')
  assert.equal(getBrandPostImage({}), '')
})

test('legacy URL mappings stay separate from CMS display content', () => {
  const repair = getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!
  const ultimate = getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' })!
  assert.equal(getBrandLegacyPath(repair, 'projects', '14'), '/projects/wheel-chair-general-service')
  assert.equal(getBrandLegacyPath(repair, 'services', 'wheelchair-general-service'), '/service/wheelchair-service')
  assert.equal(getBrandLegacyPath(ultimate, 'projects', 'commericial-office'), '/projects/commercial-office')
  assert.equal(getBrandLegacyPath(repair, 'projects', '999'), undefined)
  assert.equal(getBrandLegacyPath(ultimate, 'products', '999'), undefined)
})

test('workspace posts are fetched before brand rendering and section-isolated', async () => {
  const config = { workspace_slug: 'repair-hub', theme: 'repair-grid' }
  let calls = 0
  const fetcher = async () => {
    calls += 1
    return { slug: 'puncture-repair', title: 'Rendered post', custom_fields: { public_path: '/service/puncture-repair' } }
  }
  const result = await fetchBrandPost(config, 'puncture-repair', 'service', fetcher)
  assert.equal(result?.post.title, 'Rendered post')
  assert.equal(result?.path, '/service/puncture-repair')
  assert.equal(await fetchBrandPost(config, 'puncture-repair', 'projects', fetcher), null)
  assert.equal(await fetchBrandPost({ workspace_slug: 'other', theme: 'repair-grid' }, 'puncture-repair', 'service', fetcher), null)
  assert.equal(calls, 2)
})
