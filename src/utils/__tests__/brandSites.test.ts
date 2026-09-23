import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  brandImagePath,
  brandImageStem,
  fetchBrandPost,
  getBrandLegacyPath,
  getBrandPostImage,
  getBrandSite,
  isBrandHomeAlias,
} from '../brandSites.ts'

test('brand sites require both the exact workspace slug and theme', () => {
  assert.equal(getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })?.name, 'The Repair Hub')
  assert.equal(getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' })?.name, 'Ultimate Space Design')
  assert.equal(getBrandSite({ workspace_slug: 'repair-hub', theme: 'atelier-grid' }), null)
  assert.equal(getBrandSite({ workspace_slug: 'another-workspace', theme: 'repair-grid' }), null)
  assert.equal(getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'store' }), null)
})

test('/home is an alias only for the two matched brand workspaces', () => {
  assert.equal(isBrandHomeAlias({ workspace_slug: 'repair-hub', theme: 'repair-grid' }, 'home'), true)
  assert.equal(isBrandHomeAlias({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' }, 'home'), true)
  assert.equal(isBrandHomeAlias({ workspace_slug: 'geeker', theme: 'store' }, 'home'), false)
  assert.equal(isBrandHomeAlias({ workspace_slug: 'repair-hub', theme: 'store' }, 'home'), false)
  assert.equal(isBrandHomeAlias({ workspace_slug: 'repair-hub', theme: 'repair-grid' }, 'about'), false)
})

test('image normalization preserves random numeric source suffixes', () => {
  assert.equal(
    brandImageStem('https://therepairhub.co.nz/uploads/1776850444971-730008485.webp'),
    '1776850444971-730008485'
  )
  assert.equal(
    brandImageStem('/brand-assets/repair-hub/1776850444971-730008485-960.webp'),
    '1776850444971-730008485'
  )
  assert.equal(brandImageStem('/uploads/photo-123.webp'), 'photo-123')
  assert.equal(brandImageStem('/brand-assets/repair-hub/photo-123.webp'), 'photo-123')

  const repair = getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!
  assert.equal(
    brandImagePath(repair, '/brand-assets/repair-hub/1776850444971-730008485-960.webp', 1600),
    '/brand-assets/repair-hub/1776850444971-730008485-1600.webp'
  )
})

test('rendered custom brand image wins without writing a local path to ImageField', () => {
  const repair = getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!
  const item = repair.posts[0]
  assert.equal(
    getBrandPostImage({
      featured_image: 'https://cdn.example/old.jpg',
      custom_fields: { brand_image: '/brand-assets/repair-hub/custom-960.webp' },
    }, item),
    '/brand-assets/repair-hub/custom-960.webp'
  )
  assert.equal(getBrandPostImage({ featured_image: 'https://cdn.example/current.jpg' }, item), 'https://cdn.example/current.jpg')
})

test('unknown and cross-section slugs do not call the CMS endpoint', async () => {
  const config = { workspace_slug: 'repair-hub', theme: 'repair-grid' }
  let calls = 0
  const fetcher = async () => {
    calls += 1
    return { title: 'Rendered post' }
  }

  assert.equal(await fetchBrandPost(config, 'does-not-exist', 'projects', fetcher), null)
  assert.equal(await fetchBrandPost(config, 'puncture-repair', 'projects', fetcher), null)
  assert.equal(
    await fetchBrandPost(
      { workspace_slug: 'another-workspace', theme: 'repair-grid' },
      'wheel-chair-general-service',
      'projects',
      fetcher
    ),
    null
  )
  assert.equal(calls, 0)

  const result = await fetchBrandPost(config, 'puncture-repair', 'service', fetcher)
  assert.equal(result?.post.title, 'Rendered post')
  assert.equal(calls, 1)
})

test('catalog paths are unique and Ultimate category URLs are independent of detail URLs', () => {
  const brands = [
    getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!,
    getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' })!,
  ]
  const paths = brands.flatMap(brand => brand.posts.map(post => post.path))
  assert.equal(paths.length, 31)
  assert.equal(new Set(paths).size, paths.length)
  assert.ok(!paths.includes('/projects/residential'))
  assert.ok(!paths.includes('/projects/commercial'))
  assert.equal(paths.filter(path => path === '/home').length, 0)
})

test('every verified source ID resolves to its explicit brand canonical path', () => {
  const repair = getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!
  const ultimate = getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' })!
  const cases = [
    [repair, 'projects', '14', '/projects/wheel-chair-general-service'],
    [repair, 'projects', '15', '/projects/mobility-scooter-service-and-repair'],
    [repair, 'projects', '16', '/projects/powerchair-service-and-repair'],
    [repair, 'services', '14', '/service/puncture-repair'],
    [repair, 'services', '15', '/service/battery-replacement'],
    [repair, 'services', '16', '/service/wheelchair-service'],
    [repair, 'services', '17', '/service/call-out-service'],
    [repair, 'products', '11', '/parts/4135-4'],
    [repair, 'products', '12', '/parts/12v-75ah-deepcycle-battery'],
    [repair, 'products', '13', '/parts/call-out-service-product'],
    [ultimate, 'projects', '1', '/projects/karaka-pines-village'],
    [ultimate, 'projects', '2', '/projects/metlifecare-fairway-gardens'],
    [ultimate, 'projects', '3', '/projects/intracare-mercy-hospital'],
    [ultimate, 'projects', '6', '/projects/te-whare-manaaki-o-tama'],
    [ultimate, 'projects', '7', '/projects/trinity-changing-room'],
    [ultimate, 'projects', '8', '/projects/commercial-office'],
    [ultimate, 'projects', '9', '/projects/healthcare-facility-suspended-privacy-and-cubical-track'],
    [ultimate, 'projects', '10', '/projects/shutter-design-and-installation'],
    [ultimate, 'projects', '12', '/projects/office-partition-curtain'],
    [ultimate, 'projects', '14', '/projects/window-treatment-design-and-install'],
    [ultimate, 'services', '1', '/service/window-treatment-manufacture-and-repair'],
    [ultimate, 'services', '2', '/service/interior-design'],
    [ultimate, 'services', '4', '/service/window-treatment-alteration-and-repair'],
    [ultimate, 'services', '5', '/service/automation'],
    [ultimate, 'products', '1', '/parts/luxaflex-singledouble-track-system'],
    [ultimate, 'products', '2', '/parts/ceiling-fix-wave-track-system'],
    [ultimate, 'products', '3', '/parts/james-dunlop-textile'],
    [ultimate, 'products', '4', '/parts/nettex-textile'],
    [ultimate, 'products', '5', '/parts/recess-fit-ceiling-track-system'],
    [ultimate, 'products', '6', '/parts/warwick-fabric'],
    [ultimate, 'products', '7', '/parts/basswood-shutters'],
  ] as const

  for (const [brand, kind, id, expected] of cases) {
    assert.equal(getBrandLegacyPath(brand, kind, id), expected, `${brand.slug} ${kind}/${id}`)
  }
  assert.equal(getBrandLegacyPath(repair, 'projects', '999'), undefined)
  assert.equal(getBrandLegacyPath(ultimate, 'products', '999'), undefined)
})

test('verified source slug aliases redirect without crossing content types', () => {
  const repair = getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!
  const ultimate = getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' })!
  assert.equal(getBrandLegacyPath(repair, 'services', 'wheelchair-general-service'), '/service/wheelchair-service')
  assert.equal(getBrandLegacyPath(repair, 'products', 'call-out-service'), '/parts/call-out-service-product')
  assert.equal(getBrandLegacyPath(ultimate, 'projects', 'commericial-office'), '/projects/commercial-office')
  assert.equal(getBrandLegacyPath(repair, 'products', 'puncture-repair'), undefined)
  assert.equal(getBrandLegacyPath(ultimate, 'services', 'commercial-office'), undefined)
})

test('every catalog image maps to all three generated local variants', () => {
  const manifestPath = path.join(process.cwd(), 'public/brand-assets/manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    assets: Record<string, { basePath: string; variants: Record<string, { path: string }> }>
  }
  assert.equal(Object.keys(manifest.assets).length, 56)
  assert.equal(
    Object.values(manifest.assets).flatMap(asset => Object.values(asset.variants)).length,
    168
  )
  const variants = new Set(
    Object.values(manifest.assets).flatMap(asset => Object.values(asset.variants).map(variant => variant.path))
  )
  const brands = [
    getBrandSite({ workspace_slug: 'repair-hub', theme: 'repair-grid' })!,
    getBrandSite({ workspace_slug: 'ultimate-space-design', theme: 'atelier-grid' })!,
  ]
  for (const brand of brands) {
    for (const post of brand.posts) {
      for (const width of [480, 960, 1600]) {
        const variant = brandImagePath(brand, post.image, width)
        assert.ok(variants.has(variant), `Missing manifest entry for ${variant}`)
        assert.ok(fs.existsSync(path.join(process.cwd(), 'public', variant)), `Missing file ${variant}`)
      }
    }
  }
})
