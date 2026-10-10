import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { loadPluginMessages, resolvePluginsDir } from '../src/i18n/plugin-messages.ts'

const fixture = (relativePath) => fileURLToPath(new URL(`./fixtures/plugin-messages/${relativePath}`, import.meta.url))

test('source plugin messages take priority over an empty compiled plugins directory', () => {
  const pluginsDir = resolvePluginsDir(fixture('source-client'), fixture('compiled/server/app/admin'))
  const messagesPath = `${pluginsDir}/packgo/messages/en.json`

  assert.equal(pluginsDir, fixture('source-client/src/plugins'))
  assert.equal(existsSync(messagesPath), true)
  assert.deepEqual(JSON.parse(readFileSync(messagesPath, 'utf8')), {
    admin: { claims: { title: 'Claims' } },
  })
})

test('plugin messages load from the project source tree', async () => {
  const originalCwd = process.cwd()
  process.chdir(fixture('source-client'))
  try {
    assert.deepEqual(await loadPluginMessages('en'), {
      admin: { claims: { title: 'Claims' } },
      account: {},
    })
  } finally {
    process.chdir(originalCwd)
  }
})

test('module-relative plugins remain a fallback outside the project root', () => {
  const pluginsDir = resolvePluginsDir(fixture('missing-client'), fixture('module/i18n'))

  assert.equal(pluginsDir, fixture('module/plugins'))
  assert.equal(existsSync(`${pluginsDir}/fallback/messages/en.json`), true)
})
