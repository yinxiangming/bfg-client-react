import assert from 'node:assert/strict'
import test from 'node:test'
import { cmsHero, cmsPosts, cmsPostImage, cmsText } from '../cmsBrandContent.ts'

const page = {
  title: 'Projects from CMS',
  blocks: [
    {
      type: 'hero_carousel_v1',
      data: {
        title: { en: 'A CMS hero' },
        subtitle: { en: 'A CMS subtitle' },
        slides: [{ image: '/brand-assets/example/hero-1600.webp', title: { en: 'Slide one' } }],
      },
    },
    { type: 'text_block_v1', data: { content: { en: '<p>CMS copy</p>' } } },
    {
      type: 'post_list_v1',
      resolvedData: [{ slug: 'cms-post', title: 'CMS post', excerpt: 'Excerpt', custom_fields: { brand_image: '/brand-assets/example/post-960.webp' } }],
    },
  ],
}

test('reads hero, text and posts from CMS blocks', () => {
  assert.equal(cmsHero(page).title, 'A CMS hero')
  assert.equal(cmsHero(page).slides[0].image, '/brand-assets/example/hero-1600.webp')
  assert.deepEqual(cmsText(page), ['<p>CMS copy</p>'])
  const posts = cmsPosts(page)
  assert.equal(posts[0].title, 'CMS post')
  assert.equal(cmsPostImage(posts[0]), '/brand-assets/example/post-960.webp')
})

test('does not invent content when CMS blocks are absent', () => {
  assert.deepEqual(cmsHero({}), { image: '', title: '', subtitle: '', slides: [] })
  assert.deepEqual(cmsPosts({}), [])
  assert.deepEqual(cmsText({}), [])
})
