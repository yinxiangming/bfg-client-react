import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { createTranslator } from 'next-intl'
import { getBlockDefinitionText } from '../src/views/common/blocks/block-definition-i18n.ts'

const definition = {
  type: 'hero_carousel_v1',
  name: 'Hero Carousel',
  nameI18nKey: 'common.pageBuilder.blocks.hero_carousel_v1.name',
  description: 'Full-width carousel',
  descriptionI18nKey: 'common.pageBuilder.blocks.hero_carousel_v1.description',
  category: 'hero'
}

function translator(locale) {
  const common = JSON.parse(fs.readFileSync(new URL(`../src/messages/common/${locale}.json`, import.meta.url)))
  return createTranslator({ locale, messages: { common } })
}

test('block definition labels use the active locale when translation keys exist', () => {
  const en = translator('en')
  const zh = translator('zh-hans')

  assert.equal(getBlockDefinitionText(definition, 'name', en), 'Hero carousel')
  assert.equal(getBlockDefinitionText(definition, 'name', zh), '主视觉轮播')
  assert.equal(getBlockDefinitionText(definition, 'description', en), 'Full-width image carousel with text overlay and call-to-action buttons')
  assert.equal(getBlockDefinitionText(definition, 'description', zh), '全宽图片轮播，可叠加文字和行动按钮')
})

test('missing keys and legacy definitions fall back to metadata instead of rendering keys', () => {
  const en = translator('en')
  const missingKey = { ...definition, nameI18nKey: 'common.pageBuilder.blocks.missing.name' }
  const legacy = { type: 'legacy_block', name: 'Legacy block', category: 'content' }

  assert.equal(getBlockDefinitionText(missingKey, 'name', en), 'Hero Carousel')
  assert.equal(getBlockDefinitionText(legacy, 'name', en), 'Legacy block')
  assert.equal(getBlockDefinitionText(legacy, 'description', en), 'legacy_block')
})
