import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'bfg-portal-routes-'))
  const host = join(root, 'client')
  mkdirSync(join(host, 'scripts'), {recursive: true})
  copyFileSync(new URL('./prepare.js', import.meta.url), join(host, 'scripts/prepare.js'))
  const guard = join(root, 'preserve-files.cjs')
  writeFileSync(guard, "const fs = require('fs'); for (const key of ['unlinkSync', 'rmSync', 'rmdirSync']) fs[key] = path => {throw new Error('Deletion blocked: ' + path)}\n")
  function page(id, area, prefix, name = 'page.tsx') {
    const plugin = join(host, 'src/plugins', id)
    const source = join(plugin, 'app', area, prefix)
    mkdirSync(source, {recursive: true})
    writeFileSync(join(plugin, 'index.ts'), `export default {id: '${id}', name: '${id}'}`)
    writeFileSync(join(source, name), 'export default function Component() {return null}')
    return source
  }
  function prepare(enabled) {
    return execFileSync(process.execPath, ['--require', guard, join(host, 'scripts/prepare.js')], {
      encoding: 'utf8', stdio: 'pipe', env: {PATH: process.env.PATH, HOME: process.env.HOME,
        ...(enabled === undefined ? {} : {ENABLED_PLUGINS: enabled})},
    })
  }
  return {root, host, page, prepare}
}

test('standalone routes have a separate physical namespace and activation guard', () => {
  const {host, page, prepare} = fixture()
  const source = page('sample', 'portal', 'hub')
  writeFileSync(join(source, 'layout.tsx'), "import type {ReactNode} from 'react'; export default function Layout({children}: {children: ReactNode}) {return children}")
  prepare()
  const output = join(host, 'src/app/(portals)/plugins/sample/portals/hub/page.tsx')
  assert.equal(readFileSync(output, 'utf8'), readFileSync(join(source, 'page.tsx'), 'utf8'))
  assert.match(readFileSync(join(host, 'src/app/(portals)/plugins/sample/layout.tsx'), 'utf8'), /ExtensionRouteGuard id=\{"sample"\}/)
  assert.ok(existsSync(join(host, 'src/app/(portals)/plugins/sample/portals/hub/layout.tsx')))
  assert.equal(existsSync(join(host, 'src/app/(storefront)/plugins/sample/hub/page.tsx')), false)
  const rewrites = JSON.parse(readFileSync(join(host, 'src/.plugin-route-rewrites.json'), 'utf8'))
  assert.ok(rewrites.some(row => row.source === '/hub' && row.destination === '/plugins/sample/portals/hub'))
  assert.ok(rewrites.some(row => row.source === '/hub/:path*' && row.destination === '/plugins/sample/portals/hub/:path*'))
  prepare()
  assert.ok(existsSync(output))
})

test('disabled deployment excludes standalone pages before generation', () => {
  const {host, page, prepare} = fixture()
  page('sample', 'portal', 'hub')
  prepare('another')
  assert.equal(existsSync(join(host, 'src/app/(portals)/plugins/sample/portals/hub/page.tsx')), false)
  assert.deepEqual(JSON.parse(readFileSync(join(host, 'src/.plugin-route-rewrites.json'), 'utf8')), [])
})

test('portal aliases reject reserved and existing host prefixes', () => {
  for (const prefix of ['api', 'admin', 'account', 'auth', 'plugins', 'checkout', 'workspaces']) {
    const {page, prepare} = fixture()
    page('sample', 'portal', prefix)
    assert.throws(() => prepare(), /Portal route overlaps a host area|Plugin namespace may contain only its owner/)
  }
  const {host, page, prepare} = fixture()
  mkdirSync(join(host, 'src/app/(storefront)/custom'), {recursive: true})
  page('sample', 'portal', 'custom')
  assert.throws(() => prepare(), /Portal route overlaps a host area/)
})

test('portal and storefront collisions preserve previously generated pages', () => {
  const {host, page, prepare} = fixture()
  page('sample', 'portal', 'hub')
  prepare()
  const output = join(host, 'src/app/(portals)/plugins/sample/portals/hub/page.tsx')
  const before = readFileSync(output, 'utf8')
  page('other', 'storefront', 'hub')
  assert.throws(() => prepare(), /Plugin URL collision/)
  assert.equal(readFileSync(output, 'utf8'), before)
})

test('portal layouts remain inside their generated guard and linked sources are rejected', () => {
  const one = fixture()
  one.page('sample', 'portal', 'sample', 'layout.tsx')
  one.prepare()
  assert.ok(existsSync(join(one.host, 'src/app/(portals)/plugins/sample/portals/layout.tsx')))
  assert.match(readFileSync(join(one.host, 'src/app/(portals)/plugins/sample/layout.tsx'), 'utf8'), /ExtensionRouteGuard/)
  const two = fixture()
  const source = two.page('sample', 'portal', 'hub')
  symlinkSync(source, join(two.host, 'src/plugins/sample/app/portal/linked'))
  assert.throws(() => two.prepare(), /cannot contain symlinks/)
})

test('existing administration, account and auth aliases retain their namespaces', () => {
  const {host, page, prepare} = fixture()
  for (const area of ['admin', 'account', 'auth']) page('sample', area, 'hub')
  prepare()
  for (const area of ['admin', 'account', 'auth']) assert.ok(existsSync(join(host, `src/app/${area}/plugins/sample/hub/page.tsx`)))
  const rewrites = JSON.parse(readFileSync(join(host, 'src/.plugin-route-rewrites.json'), 'utf8'))
  assert.equal(rewrites.length, 6)
  assert.ok(rewrites.some(row => row.source === '/account/hub' && row.destination === '/account/plugins/sample/hub'))
})


test('legacy storefront portal prefixes remain available and adoption conflicts preserve output', () => {
  const {host, page, prepare} = fixture()
  page('sample', 'storefront', 'portals')
  mkdirSync(join(host, 'src/plugins/sample/app/portal'), {recursive: true})
  prepare()
  const output = join(host, 'src/app/(storefront)/plugins/sample/portals/page.tsx')
  const original = readFileSync(output, 'utf8')
  const rewrites = JSON.parse(readFileSync(join(host, 'src/.plugin-route-rewrites.json'), 'utf8'))
  assert.ok(rewrites.some(row => row.source === '/portals' && row.destination === '/plugins/sample/portals'))
  page('sample', 'portal', 'hub')
  assert.throws(() => prepare(), /Portal namespace overlaps storefront routes/)
  assert.equal(readFileSync(output, 'utf8'), original)
})
