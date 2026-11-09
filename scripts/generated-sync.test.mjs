import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync, symlinkSync, existsSync, renameSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'bfg-generated-sync-')), host = join(root, 'client')
  mkdirSync(join(host, 'scripts'), {recursive:true})
  copyFileSync(new URL('./prepare.js', import.meta.url), join(host, 'scripts/prepare.js'))
  function plugin(id, route = id) {
    const directory = join(host, 'src/plugins', id)
    mkdirSync(join(directory, `app/storefront/${route}`), {recursive:true})
    writeFileSync(join(directory, 'index.ts'), 'export default {}')
    writeFileSync(join(directory, `app/storefront/${route}/page.tsx`), `export default function Page() { return '${id}' }`)
    return directory
  }
  function skin(id, owner) {
    const directory = join(host, owner ? `src/plugins/${owner}/skins/${id}` : `src/skins/${id}`)
    for (const area of ['storefront', 'account', 'auth']) {
      mkdirSync(join(directory, area), {recursive:true})
      for (const file of ['Layout', 'Header', 'Footer']) writeFileSync(join(directory, area, `${file}.tsx`), 'export default function Component() {return null}')
    }
    return directory
  }
  const prepare = (env, production=false) => execFileSync(process.execPath, [join(host, 'scripts/prepare.js'), ...(production ? ['--production'] : [])], {stdio:'pipe', env:{...process.env, ENABLED_PLUGINS:undefined, NEXT_PUBLIC_ENABLED_PLUGINS:undefined, ...env}})
  try { run({root, host, plugin, skin, prepare}) } finally { rmSync(root, {recursive:true, force:true}) }
}

test('route and skin collisions are detected before old outputs are deleted', () => fixture(({host, plugin, skin, prepare}) => {
  plugin('one', 'gallery'); skin('store'); skin('friendly', 'one'); prepare()
  const output = join(host, 'src/app/(storefront)/plugins/one/gallery/page.tsx')
  plugin('two', 'gallery')
  assert.throws(prepare, /URL collision/)
  assert.match(readFileSync(output, 'utf8'), /one/)
  rmSync(join(host, 'src/plugins/two'), {recursive:true})
  skin('store', 'one')
  assert.throws(prepare, /contributed by both/)
  assert.match(readFileSync(output, 'utf8'), /one/)
  assert.equal(existsSync(join(host, 'src/components/storefront/themes/friendly/Layout.tsx')), true)
}))

test('routes cannot shadow mounts; core post stays reserved', () => fixture(({host, plugin, prepare}) => {
  const one = plugin('one', 'gallery'); prepare()
  mkdirSync(join(one, 'public/media'), {recursive:true})
  writeFileSync(join(one, 'public/media/file.txt'), 'photo')
  writeFileSync(join(one, 'public-mounts.json'), JSON.stringify([{source:'/gallery', directory:'media'}]))
  assert.throws(prepare, /URL collision/)
  assert.equal(existsSync(join(host, 'src/app/(storefront)/plugins/one/gallery/page.tsx')), true)
  rmSync(join(one, 'public-mounts.json'))
  plugin('two', 'post'); prepare()
  const rewrites = JSON.parse(readFileSync(join(host, 'src/.plugin-route-rewrites.json'), 'utf8'))
  assert.equal(rewrites.some(rule => rule.source.startsWith('/post')), false)
  assert.equal(existsSync(join(host, 'src/app/(storefront)/plugins/two/post/page.tsx')), true)
}))

test('storefront aliases leave index paths to the host when a plugin only has detail routes', () => fixture(({host, plugin, prepare}) => {
  const source = plugin('one', 'projects')
  const projects = join(source, 'app/storefront/projects')
  const index = join(projects, 'page.tsx')
  mkdirSync(join(projects, '[slug]'))
  renameSync(index, join(projects, '[slug]/page.tsx'))
  prepare()

  const rewrites = () => JSON.parse(readFileSync(join(host, 'src/.plugin-route-rewrites.json'), 'utf8'))
  const detailRule = { source: '/projects/:path+', destination: '/plugins/one/projects/:path+' }
  assert.deepEqual(rewrites(), [detailRule])

  mkdirSync(join(projects, '(listing)'))
  writeFileSync(join(projects, '(listing)/page.tsx'), 'export default function Page() { return null }')
  prepare()
  assert.deepEqual(rewrites(), [
    { source: '/projects', destination: '/plugins/one/projects' },
    { source: '/projects/:path*', destination: '/plugins/one/projects/:path*' },
  ])
}))

test('tampered manifests and dangling output links cannot delete host files', () => fixture(({root, host, plugin, skin, prepare}) => {
  plugin('one'); skin('friendly', 'one'); prepare()
  const manifest = join(host, 'src/.plugin-routes-manifest.json')
  const original = readFileSync(manifest)
  writeFileSync(join(root, 'keep.txt'), 'keep')
  writeFileSync(manifest, JSON.stringify({files:['../../keep.txt']}))
  assert.throws(prepare, /ownership path/)
  assert.equal(readFileSync(join(root, 'keep.txt'), 'utf8'), 'keep')
  writeFileSync(manifest, original)
  const skinOutput = join(host, 'src/components/storefront/themes/friendly/Layout.tsx')
  rmSync(skinOutput); symlinkSync(join(root, 'absent'), skinOutput)
  assert.throws(prepare, /symlink/)
  assert.equal(existsSync(join(host, 'src/app/(storefront)/plugins/one/page.tsx')), true)
}))

test('generated route edits and host collisions are preserved', () => fixture(({host, plugin, prepare}) => {
  plugin('one'); prepare()
  const output = join(host, 'src/app/(storefront)/plugins/one/page.tsx')
  writeFileSync(output, 'manual edit')
  assert.throws(prepare, /was modified/)
  assert.equal(readFileSync(output, 'utf8'), 'manual edit')
  const two = plugin('two')
  mkdirSync(join(host, 'src/app/(storefront)/plugins/two'), {recursive:true})
  writeFileSync(join(host, 'src/app/(storefront)/plugins/two/page.tsx'), 'host')
  // Resolve the manual edit without changing its ownership record.
  writeFileSync(output, readFileSync(join(host, 'src/plugins/one/app/storefront/one/page.tsx')))
  assert.throws(prepare, /overwrite a host file/)
  assert.equal(readFileSync(join(host, 'src/app/(storefront)/plugins/two/page.tsx'), 'utf8'), 'host')
}))

test('deployment exclusion removes routes, skins, providers, assets and mounts', () => fixture(({host, plugin, skin, prepare}) => {
  const one = plugin('one'); skin('store'); skin('friendly', 'one')
  mkdirSync(join(one, 'public/media'), {recursive:true})
  writeFileSync(join(one, 'public/media/file.txt'), 'photo')
  writeFileSync(join(one, 'public-mounts.json'), JSON.stringify([{source:'/gallery', directory:'media'}]))
  writeFileSync(join(one, 'storefront-server.ts'), 'export default {}')
  prepare(); prepare({ENABLED_PLUGINS:''})
  assert.equal(existsSync(join(host, 'src/app/(storefront)/plugins/one/page.tsx')), false)
  assert.equal(existsSync(join(host, 'src/components/storefront/themes/friendly/Layout.tsx')), false)
  assert.equal(existsSync(join(host, 'public/plugins/one/media/file.txt')), false)
  assert.deepEqual(JSON.parse(readFileSync(join(host, 'src/.plugin-public-mounts.json'), 'utf8')), [])
  assert.doesNotMatch(readFileSync(join(host, 'src/plugins/storefront-server.generated.ts'), 'utf8'), /plugins\/one/)
  assert.doesNotMatch(readFileSync(join(host, 'src/components/storefront/themes/registry.generated.ts'), 'utf8'), /friendly/)
  prepare({ENABLED_PLUGINS:'one'})
  assert.equal(existsSync(join(host, 'src/app/(storefront)/plugins/one/page.tsx')), true)
}))

test('malformed or linked metadata and widened area scope fail before cleanup', () => fixture(({root, host, plugin, skin, prepare}) => {
  plugin('one'); const source = skin('friendly', 'one')
  const manifest = join(source, 'manifest.json')
  writeFileSync(manifest, JSON.stringify({workspaceSlugs:['chosen']})); prepare()
  const output = join(host, 'src/components/storefront/themes/friendly/Layout.tsx')
  writeFileSync(manifest, '{broken')
  assert.throws(prepare, /metadata JSON/); assert.equal(existsSync(output), true)
  rmSync(manifest); writeFileSync(join(root, 'metadata.json'), JSON.stringify({workspaceSlugs:['chosen']})); symlinkSync(join(root, 'metadata.json'), manifest)
  assert.throws(prepare, /regular file|symlinks/); assert.equal(existsSync(output), true)
  rmSync(manifest); writeFileSync(manifest, JSON.stringify({workspaceSlugs:['chosen']}))
  writeFileSync(join(source, 'auth/theme.json'), JSON.stringify({workspaceSlugs:['chosen','other']}))
  assert.throws(prepare, /cannot override workspaceSlugs/); assert.equal(existsSync(output), true)
}))

test('route and mount control ownership rejects host collisions and later manual edits', () => fixture(({host, plugin, prepare}) => {
  plugin('one')
  const output = join(host, 'src/.plugin-route-rewrites.json')
  writeFileSync(output, '[]')
  assert.throws(prepare, /overwrite a host file/)
  rmSync(output); prepare()
  writeFileSync(output, '[{"source":"/edited"}]')
  assert.throws(prepare, /was modified/)
  assert.match(readFileSync(output, 'utf8'), /edited/)
  assert.equal(existsSync(join(host, 'src/app/(storefront)/plugins/one/page.tsx')), true)
}))

test('skin roots cannot link outside the installed extension', () => fixture(({root, host, plugin, skin, prepare}) => {
  plugin('one'); const source = skin('friendly', 'one'); prepare()
  const skins = join(host, 'src/plugins/one/skins'), outside = join(root, 'outside-skins')
  mkdirSync(outside); rmSync(skins, {recursive:true}); symlinkSync(outside, skins)
  assert.throws(prepare, /Skin root cannot be a symlink/)
  assert.equal(existsSync(join(host, 'src/components/storefront/themes/friendly/Layout.tsx')), true)
}))

test('ownership controls and generated registries cannot follow symlinks outside the host', () => fixture(({root, host, plugin, skin, prepare}) => {
  plugin('one'); skin('store'); prepare()
  for (const relative of ['.plugin-routes-manifest.json','.skin-sync-manifest.json','.plugin-public-assets.json','.plugin-route-control.json','.plugin-public-control.json','plugins/loaders.generated.ts','plugins/storefront-server.generated.ts','components/storefront/themes/registry.generated.ts']) {
    const output = join(host, 'src', relative), original = readFileSync(output), external = join(root, 'external.txt')
    writeFileSync(external, original); rmSync(output); symlinkSync(external, output)
    assert.throws(prepare, /symlink/, relative)
    assert.deepEqual(readFileSync(external), original)
    rmSync(output); writeFileSync(output, original)
  }
}))

test('account/admin route aliases stay isolated and cannot replace core folders', () => fixture(({host, plugin, prepare}) => {
  const source = plugin('one')
  for (const area of ['admin','account']) {
    mkdirSync(join(source, `app/${area}/profileplus`), {recursive:true})
    writeFileSync(join(source, `app/${area}/profileplus/page.tsx`), 'export default function Page() {return null}')
  }
  prepare()
  assert.equal(existsSync(join(host,'src/app/account/plugins/one/layout.tsx')), true)
  assert.equal(existsSync(join(host,'src/app/account/profileplus/page.tsx')), false)
  const owners=readFileSync(join(host,'src/plugins/route-owners.generated.ts'),'utf8')
  assert.match(owners, /\/admin\/plugins\/one/)
  const rewrites=JSON.parse(readFileSync(join(host,'src/.plugin-route-rewrites.json'),'utf8'))
  assert.ok(rewrites.some(rule=>rule.source==='/account/profileplus'&&rule.destination==='/account/plugins/one/profileplus'))
  mkdirSync(join(host,'src/app/admin/settings'),{recursive:true})
  writeFileSync(join(host,'src/app/admin/settings/page.tsx'),'host')
  mkdirSync(join(source,'app/admin/settings'),{recursive:true})
  writeFileSync(join(source,'app/admin/settings/new.tsx'),'plugin')
  assert.throws(prepare,/overlaps a host area/)
  assert.equal(readFileSync(join(host,'src/app/admin/settings/page.tsx'),'utf8'),'host')
  assert.equal(existsSync(join(host,'src/app/account/plugins/one/profileplus/page.tsx')), true)
}))

test('discovery uses Next production/development files and respects explicit overrides', () => fixture(({host, plugin, skin, prepare}) => {
  plugin('one');plugin('two');skin('store')
  symlinkSync(fileURLToPath(new URL('../node_modules',import.meta.url)), join(host,'node_modules'))
  writeFileSync(join(host,'.env.development'),'ENABLED_PLUGINS=one\n')
  writeFileSync(join(host,'.env.production'),'ENABLED_PLUGINS=two\n')
  const loaders=()=>readFileSync(join(host,'src/plugins/loaders.generated.ts'),'utf8')
  prepare();assert.match(loaders(),/plugins\/one/);assert.doesNotMatch(loaders(),/plugins\/two/)
  prepare({},true);assert.match(loaders(),/plugins\/two/);assert.doesNotMatch(loaders(),/plugins\/one/)
  prepare({ENABLED_PLUGINS:''},true);assert.doesNotMatch(loaders(),/plugins\/(one|two)/)
}))


test('existing owned plugins containers are normalized and cannot claim another owner', () => fixture(({host, plugin, prepare}) => {
  const source=plugin('one')
  for (const area of ['admin','account']) {
    mkdirSync(join(source,`app/${area}/plugins/one/details`),{recursive:true})
    writeFileSync(join(source,`app/${area}/plugins/one/details/page.tsx`),'export default function Page() {return null}')
  }
  prepare();prepare()
  assert.equal(existsSync(join(host,'src/app/account/plugins/one/details/page.tsx')),true)
  assert.equal(existsSync(join(host,'src/app/account/plugins/one/plugins/one/details/page.tsx')),false)
  const rewrites=JSON.parse(readFileSync(join(host,'src/.plugin-route-rewrites.json'),'utf8'))
  assert.ok(rewrites.some(rule=>rule.source==='/admin/one'&&rule.destination==='/admin/plugins/one'))
  mkdirSync(join(source,'app/account/plugins/two'),{recursive:true})
  assert.throws(prepare,/may contain only its owner/)
  assert.equal(existsSync(join(host,'src/app/account/plugins/one/details/page.tsx')),true)
}))

test('shared skin links resolve only to the installed owner canonical package', () => fixture(({root,host,plugin,skin,prepare}) => {
  const source=plugin('one');skin('friendly','one')
  const canonical=join(root,'extensions/one')
  mkdirSync(canonical,{recursive:true});writeFileSync(join(canonical,'extension.json'),JSON.stringify({id:'one'}))
  renameSync(join(source,'skins'),join(canonical,'skins'))
  symlinkSync(join(canonical,'skins'),join(source,'skins'))
  prepare();prepare()
  assert.equal(existsSync(join(host,'src/components/storefront/themes/friendly/Layout.tsx')),true)
  assert.match(readFileSync(join(host,'src/components/storefront/themes/registry.generated.ts'),'utf8'),/extensionId":"one"/)
  unlinkSync(join(source,'skins'));mkdirSync(join(root,'external'),{recursive:true});symlinkSync(join(root,'external'),join(source,'skins'))
  assert.throws(prepare,/outside its installed owner/)
  assert.equal(existsSync(join(host,'src/components/storefront/themes/friendly/Layout.tsx')),true)
}))


test('a later route collision preserves existing plugin loaders and registries', () => fixture(({host, plugin, skin, prepare}) => {
  plugin('one', 'gallery'); skin('store'); prepare()
  const controls = ['plugins/loaders.generated.ts', 'plugins/storefront-server.generated.ts',
    'components/storefront/themes/registry.generated.ts']
  const previous = controls.map(relative => readFileSync(join(host, 'src', relative)))
  plugin('two', 'gallery')
  assert.throws(prepare, /collision/)
  controls.forEach((relative, index) => assert.deepEqual(readFileSync(join(host, 'src', relative)), previous[index]))
}))
