import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { resolveStorefrontServerProvider } from '../src/extensions/storefrontServerCore.ts'
import { isExtensionEnabled } from '../src/extensions/availability.ts'

import { categoryCatalogueHref, categoryProductFilters, parseCategoryQuery } from '../src/utils/categoryCatalogue.ts'

test('category queries constrain choices to known inclusive bounds and sort options', () => {
  assert.deepEqual(parseCategoryQuery({ page: ['2', '3'], price: '100-plus', sort: 'price-asc' }), {
    page: 2, price: '100-plus', sort: 'price-asc'
  })
  assert.deepEqual(parseCategoryQuery({ page: '2oops', price: '__proto__', sort: 'constructor' }), {
    page: 1, price: null, sort: 'relevance'
  })
  assert.deepEqual(categoryProductFilters('0-50', 'price-desc'), {
    min_price: 0, max_price: 50, sort: 'price_desc'
  })
  assert.deepEqual(categoryProductFilters('50-100', 'name-asc'), {
    min_price: 50, max_price: 100, sort: 'name'
  })
  assert.deepEqual(categoryProductFilters('100-plus', 'sales'), {
    min_price: 100, max_price: undefined, sort: 'sales'
  })
  assert.deepEqual(categoryProductFilters(null, 'relevance'), {
    min_price: undefined, max_price: undefined, sort: undefined
  })
})

test('category controls reset page without discarding other choices', () => {
  const query = parseCategoryQuery({ page: '2', price: '100-plus', sort: 'price-asc' })
  assert.equal(categoryCatalogueHref('parts', query), '/category/parts?price=100-plus&sort=price-asc&page=2')
  assert.equal(categoryCatalogueHref('parts', { ...query, page: 1 }), '/category/parts?price=100-plus&sort=price-asc')
  assert.equal(categoryCatalogueHref('parts', { ...query, price: null, page: 1 }), '/category/parts?sort=price-asc')
  assert.equal(categoryCatalogueHref('parts', parseCategoryQuery({})), '/category/parts')
})

test('workspace-disabled and deployment-excluded providers are never loaded', async () => {
  let calls = 0
  const loaders = { fixture: async () => { calls++; return { default: { matches: () => true } } } }
  const disabled = { extensions: { offered: ['fixture'], available: [] } }
  assert.equal(await resolveStorefrontServerProvider(loaders, disabled, undefined, id => isExtensionEnabled(id, disabled.extensions)), null)
  assert.equal(await resolveStorefrontServerProvider(loaders, null, ['other'], () => true), null)
  assert.equal(await resolveStorefrontServerProvider(loaders, null, [], () => true), null)
  assert.equal(calls, 0)
})

test('provider scope isolates workspaces sharing one skin', async () => {
  const provider = { matches: config => config?.theme === 'fixture' && config?.workspace_slug === 'chosen' }
  const loaders = { fixture: async () => ({ default: provider }) }
  assert.equal(await resolveStorefrontServerProvider(loaders, { theme: 'fixture', workspace_slug: 'other' }, undefined, () => true), null)
  assert.equal(await resolveStorefrontServerProvider(loaders, { theme: 'fixture', workspace_slug: 'chosen' }, undefined, () => true), provider)
})

test('ambiguous ownership and failed provider imports are explicit errors', async () => {
  const provider = { matches: () => true }
  await assert.rejects(resolveStorefrontServerProvider({ one: async () => ({ default: provider }), two: async () => ({ default: provider }) }, null, undefined, () => true), /Multiple/)
  await assert.rejects(resolveStorefrontServerProvider({ broken: async () => { throw new Error('load failed') } }, null, undefined, () => true), /load failed/)
})

const optionalFontBlocks = [
  {
    name: 'hero',
    directory: '../src/views/storefront/blocks/library/hero/InsuranceHeroV1/',
    stylesheet: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Manrope:wght@300;400;500&display=swap',
  },
  {
    name: 'service grid',
    directory: '../src/views/storefront/blocks/library/content/InsuranceServiceGridV1/',
    stylesheet: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Manrope:wght@300;400;500&display=swap',
  },
]

for (const block of optionalFontBlocks) {
  test(`optional ${block.name} fonts load from the rendered block without blocking shared CSS`, () => {
    const directory = new URL(block.directory, import.meta.url)
    const css = fs.readFileSync(new URL('styles.module.css', directory), 'utf8')
    assert.doesNotMatch(css, /@import\s+url\([^)]*fonts\.googleapis\.com/)
    assert.match(css, /font-family:\s*'Manrope',\s*sans-serif/)
    assert.match(css, /font-family:\s*'Cormorant Garamond',\s*serif/)

    const source = ts.createSourceFile('index.tsx', fs.readFileSync(new URL('index.tsx', directory), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const fontLinks = []
    function visit(node) {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'link') {
        const attributes = node.attributes.properties.filter(ts.isJsxAttribute)
        const rel = attributes.find(attribute => attribute.name.getText(source) === 'rel')
        const href = attributes.find(attribute => attribute.name.getText(source) === 'href')
        if (rel?.initializer && ts.isStringLiteral(rel.initializer) && rel.initializer.text === 'stylesheet' &&
            href?.initializer && ts.isStringLiteral(href.initializer) && href.initializer.text === block.stylesheet) {
          assert.equal(attributes.some(attribute => attribute.name.getText(source) === 'precedence'), false)
          fontLinks.push(node)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
    assert.equal(fontLinks.length, 1)
  })
}
