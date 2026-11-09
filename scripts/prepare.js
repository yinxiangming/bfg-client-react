#!/usr/bin/env node

/**
 * Run all pre-build tasks: plugin loaders, plugin routes, theme registry.
 * Usage: node scripts/prepare.js
 *
 * Plugin routes: each plugin may ship `plugins/<id>/app/<segment>/...` (e.g. admin, account, storefront, portal).
 * Storefront segment is copied under `app/(storefront)/plugins/<id>/...` so routes use the storefront layout.
 * See syncPluginRoutes() for how that maps into `src/app/`.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Match Next's environment-file precedence when discovery runs before Next starts.
try {
  require.resolve('@next/env')
  require('@next/env').loadEnvConfig(path.join(__dirname, '..'), !process.argv.includes('--production'))
} catch (error) {
  // Isolated generator fixtures have no Next installation. Real installs require it.
  if (error.code !== 'MODULE_NOT_FOUND') throw error
}

const SRC_DIR = path.join(__dirname, '..', 'src')
const PLUGINS_DIR = path.join(SRC_DIR, 'plugins')
const EXTENSIONS_DIRS = [
  path.join(__dirname, '..', '..', 'extensions'),
  path.join(__dirname, '..', '..', '..', 'extensions'),
]
const APP_DIR = path.join(SRC_DIR, 'app')
const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const MANIFEST_FILE = path.join(SRC_DIR, '.plugin-routes-manifest.json')
const SKIN_MANIFEST_FILE = path.join(SRC_DIR, '.skin-sync-manifest.json')
const BUILTIN_SKINS_DIR = path.join(SRC_DIR, 'skins')
const THEMES_DIR = path.join(SRC_DIR, 'components', 'storefront', 'themes')
const ACCOUNT_THEMES_DIR = path.join(SRC_DIR, 'components', 'account', 'themes')
const AUTH_THEMES_DIR = path.join(SRC_DIR, 'components', 'auth', 'themes')
const SKIN_AREA_DESTS = {
  storefront: THEMES_DIR,
  account: ACCOUNT_THEMES_DIR,
  auth: AUTH_THEMES_DIR,
}

// Populated while skins are synchronised so the generated registry can retain the
// extension that owns each skin after files are copied into the shared theme folders.
let skinOrigins = new Map()
let skinSourceDirs = new Map()
const enabledSetting = process.env.ENABLED_PLUGINS ?? process.env.NEXT_PUBLIC_ENABLED_PLUGINS
const enabledPlugins = enabledSetting === undefined ? null : new Set(enabledSetting.split(',').map(id => id.trim()).filter(Boolean))
const isDeployed = id => enabledPlugins === null || enabledPlugins.has(id)
const validId = id => typeof id === 'string' && /^[a-z][a-z0-9_-]*$/.test(id)
const digest = data => crypto.createHash('sha256').update(data).digest('hex')
const generatedPlans = []
const generatedWrites = []
function safeGeneratedPath(base, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid generated path')
  const full = path.join(base, relative)
  for (let cursor = full;; cursor = path.dirname(cursor)) {
    try { if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Generated path crosses a symlink: ${relative}`) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    if (cursor === base) break
  }
  return full
}
function checkedGeneratedFile(filename) {
  const full = safeGeneratedPath(SRC_DIR, path.relative(SRC_DIR, filename).split(path.sep).join('/'))
  try { if (!fs.lstatSync(full).isFile()) throw new Error('Generated control must be a regular file') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  return full
}
function writeGeneratedFile(filename, data, encoding) {
  generatedWrites.push([checkedGeneratedFile(filename), Buffer.isBuffer(data) ? data : Buffer.from(data, encoding)])
}
function flushGeneratedWrites() {
  for (const [full, next] of generatedWrites) {
  if (fs.existsSync(full) && fs.readFileSync(full).equals(next)) continue
  const staging = `${full}.tmp-${process.pid}-${crypto.randomBytes(6).toString('hex')}`
  fs.writeFileSync(staging, next, { flag: 'wx' })
  fs.renameSync(staging, full)
  }
}
function readGeneratedManifest(filename, key) {
  checkedGeneratedFile(filename)
  if (!fs.existsSync(filename)) return []
  const records = JSON.parse(fs.readFileSync(filename, 'utf8'))[key]
  if (!Array.isArray(records)) throw new Error('Invalid generated manifest')
  return records
}
function planGeneratedFiles(base, previous, next, accepts, filename, key) {
  const owned = new Map()
  for (const item of previous) {
    const relative = typeof item === 'string' ? item : item?.path
    if (!accepts(relative) || owned.has(relative)) throw new Error('Invalid generated ownership path')
    const full = safeGeneratedPath(base, relative)
    if (typeof item === 'string') {
      if (base === SRC_DIR && relative.startsWith('app/') && !relative.includes('/plugins/')) throw new Error(`Legacy shared route ownership cannot be verified: ${relative}`)
      // Legacy manifests have no hashes. Only adopt bytes that match today's source.
      if (fs.existsSync(full) && (!next.has(relative) || !fs.readFileSync(full).equals(next.get(relative)))) throw new Error(`Legacy generated file cannot be verified: ${relative}. Remove this ignored output after reviewing it, then prepare again.`)
    } else {
      if (!/^[a-f0-9]{64}$/.test(item.sha256)) throw new Error('Invalid generated ownership hash')
      if (fs.existsSync(full) && digest(fs.readFileSync(full)) !== item.sha256) throw new Error(`Generated file was modified: ${relative}`)
    }
    owned.set(relative, item)
  }
  for (const [relative] of next) {
    if (!accepts(relative)) throw new Error('Invalid generated output path')
    const full = safeGeneratedPath(base, relative)
    if (fs.existsSync(full) && !owned.has(relative)) throw new Error(`Generated output would overwrite a host file: ${relative}`)
    if (generatedPlans.some(plan => plan.base === base && plan.next.has(relative))) throw new Error(`Generated output collision: ${relative}`)
  }
  generatedPlans.push({base, owned, next, filename, key})
}
function commitGeneratedPlans() {
  const manifests = new Map()
  for (const plan of generatedPlans) {
    for (const relative of plan.owned.keys()) {
      const full = safeGeneratedPath(plan.base, relative)
      if (!plan.next.has(relative) && fs.existsSync(full)) { fs.unlinkSync(full); pruneEmptyDirs(path.dirname(full), plan.base) }
    }
    for (const [relative, data] of plan.next) {
      const full = safeGeneratedPath(plan.base, relative)
      if (fs.existsSync(full) && fs.readFileSync(full).equals(data)) continue
      fs.mkdirSync(path.dirname(full), {recursive:true})
      const staging = `${full}.tmp-${process.pid}-${crypto.randomBytes(6).toString('hex')}`
      fs.writeFileSync(staging, data, {flag:'wx'}); fs.renameSync(staging, full)
    }
    if (!manifests.has(plan.filename)) manifests.set(plan.filename, {})
    manifests.get(plan.filename)[plan.key] = [...plan.next].map(([relative, data]) => ({path:relative, sha256:digest(data)}))
  }
  for (const [filename, manifest] of manifests) { fs.mkdirSync(path.dirname(filename), {recursive:true}); writeGeneratedFile(filename, JSON.stringify(manifest, null, 2)) }
}
function collectDirectory(source, destination, base, files) {
  if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Generated source cannot contain symlinks: ${source}`)
  for (const item of fs.readdirSync(source, {withFileTypes:true})) {
    if (item.name.startsWith('.') || IGNORE_FILES.includes(item.name)) continue
    if (item.isSymbolicLink()) throw new Error(`Generated source cannot contain symlinks: ${item.name}`)
    const from = path.join(source, item.name), to = path.join(destination, item.name)
    if (item.isDirectory()) collectDirectory(from, to, base, files)
    else if (item.isFile()) {
      const relative = path.relative(base, to).split(path.sep).join('/')
      if (files.has(relative)) throw new Error(`Generated output collision: ${relative}`)
      files.set(relative, fs.readFileSync(from))
    } else throw new Error('Unsupported generated source')
  }
}
const URL_RESERVED = new Set(['api', '_next', 'auth', 'admin', 'account', 'plugins', 'cart', 'category', 'checkout', 'product', 'post', 'search', 'shop', 'media', 'unknown', 'workspaces', 'icon.svg', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'llms.txt'])
const urlClaims = []
function claimUrl(prefix, owner) {
  if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) throw new Error('Invalid plugin URL prefix')
  if (urlClaims.some(item => item.prefix === prefix || item.prefix.startsWith(prefix + '/') || prefix.startsWith(item.prefix + '/'))) throw new Error(`Plugin URL collision: ${prefix}`)
  urlClaims.push({prefix, owner})
}


// --- 1. Generate plugin loaders ---
function generatePluginLoaders() {
  const outputFile = path.join(PLUGINS_DIR, 'loaders.generated.ts')
  const entries = []

  if (fs.existsSync(PLUGINS_DIR)) {
    const items = fs.readdirSync(PLUGINS_DIR)
    for (const name of items) {
      if (name.startsWith('.') || name.endsWith('.generated.ts')) continue
      const pluginPath = path.join(PLUGINS_DIR, name)
      let stat
      try {
        stat = fs.statSync(pluginPath)
      } catch (e) {
        if (e.code === 'ENOENT') continue
        throw e
      }
      if (!stat.isDirectory()) continue
      if (!validId(name)) throw new Error('Invalid plugin identifier')
      if (!isDeployed(name)) continue
      if (!fs.existsSync(path.join(pluginPath, 'index.ts'))) continue
      entries.push(name)
    }
  }

  const loaderLines = entries.map((id) => `  ${JSON.stringify(id)}: () => import('@/plugins/${id}'),`).join('\n')
  const content = `/**
 * Auto-generated. Do not edit. Run: node scripts/prepare.js
 */
import type { Extension } from '@/extensions/registry'

export const PLUGIN_LOADERS: Record<
  string,
  () => Promise<{ default: Extension }>
> = {
${entries.length ? loaderLines + '\n' : ''}}
`
  if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true })
  writeGeneratedFile(outputFile, content)
  if (entries.length > 0) console.log('Plugin loaders:', entries.join(', '))
  // Server-only contributions must never enter the shared/client plugin bundle.
  const serverEntries = entries.filter(id => fs.existsSync(path.join(PLUGINS_DIR, id, 'storefront-server.ts')))
  const serverLoaders = serverEntries.map(id => `  ${JSON.stringify(id)}: () => import('@/plugins/${id}/storefront-server'),`).join('\n')
  writeGeneratedFile(path.join(PLUGINS_DIR, 'storefront-server.generated.ts'), `// Generated by scripts/prepare.js. Server-only loader list.\nimport 'server-only'\nimport type { StorefrontServerProvider } from '@/extensions/storefrontServerTypes'\nexport const STOREFRONT_SERVER_LOADERS: Record<string, () => Promise<{ default: StorefrontServerProvider }>> = {\n${serverLoaders}\n}\n`)

}

// --- 2. Sync plugin routes ---
const IGNORE_FILES = ['.DS_Store', 'Thumbs.db', '.gitkeep']

function syncPluginRoutes() {
  const files = new Map(), rewrites = [], owners = []
  if (fs.existsSync(PLUGINS_DIR)) for (const plugin of fs.readdirSync(PLUGINS_DIR).sort()) {
    if (plugin.startsWith('.') || plugin.endsWith('.generated.ts')) continue
    if (!validId(plugin)) throw new Error('Invalid plugin identifier')
    const root = path.join(PLUGINS_DIR, plugin, 'app')
    if (!fs.existsSync(root) || !isDeployed(plugin)) continue
    if (fs.lstatSync(root).isSymbolicLink()) throw new Error('Plugin app root cannot be a symlink')
    const portalRoot = path.join(root, 'portal')
    const portalEntries = fs.existsSync(portalRoot) && fs.lstatSync(portalRoot).isDirectory()
      ? fs.readdirSync(portalRoot, {withFileTypes:true}) : []
    const hasPortals = portalEntries.some(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    for (const segmentEntry of fs.readdirSync(root, {withFileTypes:true})) {
      if (segmentEntry.name.startsWith('.')) continue
      if (segmentEntry.isSymbolicLink()) throw new Error('Plugin route source cannot contain symlinks')
      if (!segmentEntry.isDirectory()) continue
      const segment = segmentEntry.name
      if (!['storefront', 'admin', 'account', 'auth', 'portal'].includes(segment)) throw new Error(`Unsupported plugin route area: ${segment}`)
      const segmentRoot = path.join(root, segment)
      for (const child of fs.readdirSync(segmentRoot, {withFileTypes:true})) {
        if (child.name.startsWith('.')) continue
        if (child.isSymbolicLink()) throw new Error('Plugin route source cannot contain symlinks')
        if (!child.isDirectory()) continue
        let name = child.name
        let source = path.join(segmentRoot, name)
        // Existing packages may already spell the owned physical namespace.
        if (name === 'plugins') {
          const nested = fs.readdirSync(source, {withFileTypes:true}).filter(entry => !entry.name.startsWith('.') && !IGNORE_FILES.includes(entry.name))
          if (nested.length !== 1 || nested[0].name !== plugin || !nested[0].isDirectory() || nested[0].isSymbolicLink()) throw new Error(`Plugin namespace may contain only its owner: ${plugin}`)
          name = plugin; source = path.join(source, plugin)
        }
        if (!validId(name)) throw new Error('Invalid plugin route prefix')
        const standalone = segment === 'portal'
        const group = standalone ? '(portals)' : segment === 'storefront' ? '(storefront)' : segment
        if (!standalone && segment !== 'storefront' && (name === 'plugins' || fs.existsSync(path.join(APP_DIR, group, name)))) throw new Error(`Plugin route overlaps a host area: /${segment}/${name}`)
        if (standalone && (URL_RESERVED.has(name) || fs.existsSync(path.join(APP_DIR, name)) || fs.existsSync(path.join(APP_DIR, '(storefront)', name)))) throw new Error(`Portal route overlaps a host area: /${name}`)
        if (segment === 'storefront' && hasPortals && (name === 'portals' || (name === plugin && fs.existsSync(path.join(source, 'portals'))))) throw new Error(`Portal namespace overlaps storefront routes for extension ${plugin}`)
        const dest = path.join(APP_DIR, group, 'plugins', plugin, ...(standalone ? ['portals'] : []), ...(name === plugin ? [] : [name]))
        collectDirectory(source, dest, SRC_DIR, files)
        if (segment === 'storefront' || standalone) {
          if (!URL_RESERVED.has(name)) {
            claimUrl('/' + name, plugin)
            const routeRoot = `/plugins/${plugin}${standalone ? '/portals' : ''}`
            const target = name === plugin ? routeRoot : `${routeRoot}/${name}`
            if (standalone) owners.push({prefix: '/' + name, id: plugin}, {prefix: target, id: plugin})
            const routePrefix = path.relative(SRC_DIR, dest).split(path.sep).join('/') + '/'
            // Route groups, parallel slots and optional catch-alls can serve the bare prefix.
            const indexRoute = /^(?:(?:\([^/]+\)|@[^/]+|\[\[\.\.\.[^/]+\]\])\/)*(?:page|route)\.[jt]sx?$/
            const hasIndex = [...files.keys()].some(file =>
              file.startsWith(routePrefix) && indexRoute.test(file.slice(routePrefix.length))
            )
            // Leave the bare prefix to the host CMS when the plugin only serves subpaths.
            if (hasIndex) rewrites.push({source:`/${name}`, destination:target})
            rewrites.push({source:`/${name}/:path+`, destination:`${target}/:path+`})
          }
        } else {
          const prefix = `/${segment}/${name}`
          claimUrl(prefix, plugin); owners.push({prefix, id:plugin})
          const target = name === plugin ? `/${segment}/plugins/${plugin}` : `/${segment}/plugins/${plugin}/${name}`
          rewrites.push({source:prefix, destination:target}, {source:`${prefix}/:path*`, destination:`${target}/:path*`})
          if (!owners.some(item => item.prefix === `/${segment}/plugins/${plugin}`)) owners.push({prefix:`/${segment}/plugins/${plugin}`, id:plugin})
        }
      }
    }
    for (const area of ['(storefront)', 'account', 'auth', '(portals)']) {
      const relative = `app/${area}/plugins/${plugin}/layout.tsx`
      const prefix = `app/${area}/plugins/${plugin}/`
      if (![...files.keys()].some(key => key.startsWith(prefix))) continue
      if (['tsx', 'ts', 'jsx', 'js'].some(ext => files.has(`app/${area}/plugins/${plugin}/layout.${ext}`))) throw new Error(`Plugin ${plugin} owns a root layout; move it into a route child so the generated extension guard always applies`)
      files.set(relative, Buffer.from(routeGuardSource(plugin)))
    }
  }
  const accepts = relative => typeof relative === 'string' && /^(?:app\/(?:\(storefront\)|admin|account|auth)\/(?:plugins\/[a-z][a-z0-9_-]*|[a-z][a-z0-9_-]*)|app\/\(portals\)\/plugins\/[a-z][a-z0-9_-]*)\/.+/.test(relative)
  planGeneratedFiles(SRC_DIR, readGeneratedManifest(MANIFEST_FILE, 'files'), files, accepts, MANIFEST_FILE, 'files')
  // Rewrites and admin ownership are generated from this same validated route plan.
  const routeControl = path.join(SRC_DIR, '.plugin-route-control.json')
  planGeneratedFiles(SRC_DIR, readGeneratedManifest(routeControl, 'files'), new Map([
    ['.plugin-route-rewrites.json', Buffer.from(JSON.stringify(rewrites))],
    ['plugins/route-owners.generated.ts', Buffer.from(`// Generated by prepare.js\nexport const PLUGIN_ROUTE_OWNERS = ${JSON.stringify(owners)} as Array<{ prefix: string; id: string }>\n`)]
  ]), relative => ['.plugin-route-rewrites.json', 'plugins/route-owners.generated.ts'].includes(relative), routeControl, 'files')
}

function routeGuardSource(plugin) {
  return `// Generated by scripts/prepare.js: these pages answer 404 while the extension is switched off.
import type { ReactNode } from 'react'
import ExtensionRouteGuard from '@/extensions/ExtensionRouteGuard'

export default function PluginRoutesLayout({ children }: { children: ReactNode }) {
  return <ExtensionRouteGuard id={${JSON.stringify(plugin)}}>{children}</ExtensionRouteGuard>
}
`
}

// Plugin public files preserve their declared relative URLs. Plan and validate the
// whole sync before deleting any output; never overwrite host/another plugin files.
function syncPluginPublicAssets() {
  const manifestFile = path.join(SRC_DIR, '.plugin-public-assets.json')
  const digest = data => crypto.createHash('sha256').update(data).digest('hex')
  const safePath = relative => {
    if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid plugin public asset path')
    const full = path.join(PUBLIC_DIR, relative)
    let cursor = full
    while (true) {
      try {
        if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Plugin public asset path crosses a symlink: ${relative}`)
      } catch (error) { if (error.code !== 'ENOENT') throw error }
      if (cursor === PUBLIC_DIR) break
      cursor = path.dirname(cursor)
    }
    return full
  }
  let previous = []
  checkedGeneratedFile(manifestFile)
  if (fs.existsSync(manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
    if (!Array.isArray(manifest.files)) throw new Error('Invalid plugin public asset manifest')
    previous = manifest.files
  }
  const owned = new Map()
  for (const record of previous) {
    if (!record || !/^plugins\/[a-z][a-z0-9_-]*\/.+/.test(record.path)) throw new Error('Invalid plugin public asset ownership path')
    const full = safePath(record.path)
    if (!/^[a-f0-9]{64}$/.test(record.sha256) || owned.has(record.path)) throw new Error('Invalid plugin public asset ownership record')
    if (fs.existsSync(full) && digest(fs.readFileSync(full)) !== record.sha256) throw new Error(`Generated plugin public asset was modified: ${record.path}`)
    owned.set(record.path, record)
  }
  const next = new Map()
  const mounts = []
  if (fs.existsSync(PLUGINS_DIR)) {
    for (const id of fs.readdirSync(PLUGINS_DIR).sort()) {
      if (id.startsWith('.') || id.endsWith('.generated.ts')) continue
      if (!validId(id)) throw new Error('Invalid plugin identifier for public assets')
      if (!isDeployed(id)) continue
      const root = path.join(PLUGINS_DIR, id, 'public')
      if (!fs.existsSync(root)) continue
      if (fs.lstatSync(root).isSymbolicLink()) throw new Error(`Plugin public root must be a directory: ${id}`)
      const mountFile = path.join(PLUGINS_DIR, id, 'public-mounts.json')
      if (fs.existsSync(mountFile)) {
        const declarations = JSON.parse(fs.readFileSync(mountFile, 'utf8'))
        if (!Array.isArray(declarations)) throw new Error('Plugin public mounts must be an array')
        const reserved = new Set(['api', '_next', 'auth', 'admin', 'account', 'plugins', 'cart', 'category', 'checkout', 'product', 'post', 'search', 'shop', 'media', 'unknown', 'workspaces', 'icon.svg', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'llms.txt'])
        for (const mount of declarations) {
          if (!mount || !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(mount.source) || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(mount.directory) || reserved.has(mount.source.slice(1).split('/')[0])) throw new Error('Invalid or reserved plugin public mount')
          if (!fs.existsSync(path.join(root, mount.directory)) || !fs.statSync(path.join(root, mount.directory)).isDirectory()) throw new Error('Plugin public mount directory is missing')
          if (mounts.some(item => item.prefix === mount.source || item.prefix.startsWith(mount.source + '/') || mount.source.startsWith(item.prefix + '/'))) throw new Error('Plugin public mount collision')
          claimUrl(mount.source, id)
          mounts.push({ prefix: mount.source, source: `${mount.source}/:path*`, destination: `/plugins/${id}/${mount.directory}/:path*` })
        }
      }
      const walk = (dir, prefix = '') => {
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          if (item.name.startsWith('.') || IGNORE_FILES.includes(item.name)) continue
          const relative = `plugins/${id}/` + prefix + item.name
          const source = path.join(dir, item.name)
          if (item.isSymbolicLink()) throw new Error(`Plugin public assets cannot contain symlinks: ${id}/${relative}`)
          if (item.isDirectory()) { walk(source, prefix + item.name + '/'); continue }
          if (!item.isFile()) throw new Error(`Unsupported plugin public asset: ${relative}`)
          const destination = safePath(relative)
          if (next.has(relative)) throw new Error(`Plugin public asset collision: ${relative}`)
          if (fs.existsSync(destination) && !owned.has(relative)) throw new Error(`Plugin public asset would overwrite a host file: ${relative}`)
          const data = fs.readFileSync(source)
          next.set(relative, { path: relative, owner: id, sha256: digest(data), data })
        }
      }
      walk(root)
    }
  }
  planGeneratedFiles(PUBLIC_DIR, previous, new Map([...next].map(([key, record]) => [key, record.data])), relative => typeof relative === 'string' && /^plugins\/[a-z][a-z0-9_-]*\/.+/.test(relative), manifestFile, 'files')
  const publicControl = path.join(SRC_DIR, '.plugin-public-control.json')
  planGeneratedFiles(SRC_DIR, readGeneratedManifest(publicControl, 'files'), new Map([['.plugin-public-mounts.json', Buffer.from(JSON.stringify(mounts.map(({prefix, ...rewrite}) => rewrite)))]]), relative => relative === '.plugin-public-mounts.json', publicControl, 'files')
  if (next.size) console.log('Plugin public assets:', next.size, 'file(s)')
}

// --- 2b. Sync skins (built-in and extension-contributed) ---
//
// A skin is a self-contained folder shaped like:
//   <skin-root>/
//     <area>/             one of: storefront | account | auth
//       Layout.tsx, theme.json, *.css, pages/<key>.tsx, ...
//     *.css               (optional) shared stylesheet at the skin root; copied into
//                         every synced destination area so siblings can @import it
//     public/             (optional) static assets; copied into public/<publicPrefix>/<skinId>/
//
// Two sources are scanned in order:
//   1. Built-in: `src/skins/<skinId>/` — skins shipped with bfg-client itself
//   2. Extension: `src/plugins/<plugin>/skins/<skinId>/` — symlinked target of
//      `extensions/<plugin>/skins/<skinId>/`
//
// In both cases prepare.js copies the area subdirs into `src/components/<area>/themes/<skinId>/`
// so the existing generateThemeRegistry / generateAreaSkinRegistry functions discover the skin
// and register it with zero further changes.
//
// Sources are tracked in `.skin-sync-manifest.json` so a re-run cleans the previous output
// before re-syncing. Two sources contributing the same skinId throw — pick distinct ids.

function pruneEmptyDirs(startDir, stopAt) {
  let dir = startDir
  while (dir.startsWith(stopAt) && dir !== stopAt) {
    try {
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir)
        dir = path.dirname(dir)
      } else break
    } catch {
      break
    }
  }
}

function syncSkins() {
  const srcFiles = new Map(), publicFiles = new Map(), claims = new Map(), sourceDirs = new Map()
  function oneSkin(root, id, owner) {
    if (!validId(id) || !validId(owner)) throw new Error('Invalid skin or extension identifier')
    if (claims.has(id)) {
      if (claims.get(id) === owner && fs.realpathSync(sourceDirs.get(id)) === fs.realpathSync(root)) return
      throw new Error(`skin id "${id}" contributed by both "${claims.get(id)}" and "${owner}" — pick distinct ids`)
    }
    claims.set(id, owner); sourceDirs.set(id, root)
    const directory = path.join(root, id)
    if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('Skin source cannot contain symlinks')
    for (const [area, dest] of Object.entries(SKIN_AREA_DESTS)) {
      const source = path.join(directory, area)
      if (!fs.existsSync(source)) continue
      collectDirectory(source, path.join(dest, id), SRC_DIR, srcFiles)
      for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
        if (entry.isSymbolicLink()) throw new Error('Skin source cannot contain symlinks')
        if (entry.isFile() && entry.name.endsWith('.css')) {
          const relative = path.relative(SRC_DIR, path.join(dest, id, entry.name))
          if (srcFiles.has(relative)) throw new Error('Shared skin stylesheet collision')
          srcFiles.set(relative, fs.readFileSync(path.join(directory, entry.name)))
        }
      }
    }
    const publicSource = path.join(directory, 'public')
    if (fs.existsSync(publicSource)) collectDirectory(publicSource, path.join(PUBLIC_DIR, owner === 'builtin' ? 'skins' : `plugins/${owner}`, id), PUBLIC_DIR, publicFiles)
  }
  function scan(root, owner) {
    if (!fs.existsSync(root)) return
    if (fs.lstatSync(root).isSymbolicLink()) {
      // A packaged plugin can link its shared skins only to the installed owner's
      // canonical package folder; arbitrary external skin roots stay forbidden.
      const packageRoots = EXTENSIONS_DIRS.flatMap(directory => [path.join(directory, owner), path.join(directory, `${owner}-client`)])
      // Linked packages need not live beside the host checkout. Their nearest
      // declared package ancestor supplies the same owner boundary.
      const moduleRoot = path.join(PLUGINS_DIR, owner)
      if (fs.existsSync(moduleRoot)) {
        let current = fs.realpathSync(moduleRoot)
        while (current !== path.dirname(current)) {
          const declaration = path.join(current, 'extension.json')
          if (fs.existsSync(declaration)) { packageRoots.push(current); break }
          current = path.dirname(current)
        }
      }
      const allowed = packageRoots.some(packageRoot => {
        const canonical = path.join(packageRoot, 'skins'), declaration = path.join(packageRoot, 'extension.json')
        if (!fs.existsSync(canonical) || fs.lstatSync(canonical).isSymbolicLink() || !fs.statSync(canonical).isDirectory()) return false
        if (fs.existsSync(declaration)) {
          if (!fs.lstatSync(declaration).isFile() || fs.lstatSync(declaration).isSymbolicLink()) throw new Error('Extension declaration must be a regular file')
          if (JSON.parse(fs.readFileSync(declaration, 'utf8')).id !== owner) return false
        } else if (path.basename(packageRoot) !== `${owner}-client`) return false
        return fs.realpathSync(canonical) === fs.realpathSync(root)
      })
      if (!allowed) throw new Error('Skin root cannot be a symlink outside its installed owner')
    }
    if (!fs.statSync(root).isDirectory()) return
    for (const id of fs.readdirSync(root).sort()) {
      if (id.startsWith('.')) continue
      if (fs.statSync(path.join(root, id)).isDirectory()) oneSkin(root, id, owner)
    }
  }
  scan(BUILTIN_SKINS_DIR, 'builtin')
  if (fs.existsSync(PLUGINS_DIR)) for (const id of fs.readdirSync(PLUGINS_DIR).sort()) {
    if (id.startsWith('.') || id.endsWith('.generated.ts')) continue
    if (!validId(id)) throw new Error('Invalid plugin identifier')
    if (isDeployed(id)) scan(path.join(PLUGINS_DIR, id, 'skins'), id)
  }
  for (const root of EXTENSIONS_DIRS) if (fs.existsSync(root)) for (const directory of fs.readdirSync(root).sort()) {
    const source = path.join(root, directory)
    if (!directory.endsWith('-client') && !(fs.existsSync(path.join(source, 'skins')) && fs.existsSync(path.join(source, 'extension.json')))) continue
    const owner = fs.existsSync(path.join(source, 'extension.json'))
      ? JSON.parse(fs.readFileSync(path.join(source, 'extension.json'), 'utf8')).id
      : directory.slice(0, -7)
    if (isDeployed(owner)) scan(path.join(source, 'skins'), owner)
  }
  planGeneratedFiles(SRC_DIR, readGeneratedManifest(SKIN_MANIFEST_FILE, 'srcFiles'), srcFiles, relative => typeof relative === 'string' && /^components\/(storefront|account|auth)\/themes\/[a-z][a-z0-9_-]*\/.+/.test(relative), SKIN_MANIFEST_FILE, 'srcFiles')
  planGeneratedFiles(PUBLIC_DIR, readGeneratedManifest(SKIN_MANIFEST_FILE, 'publicFiles'), publicFiles, relative => typeof relative === 'string' && /^(skins\/[a-z][a-z0-9_-]*|plugins\/[a-z][a-z0-9_-]*\/[a-z][a-z0-9_-]*)\/.+/.test(relative), SKIN_MANIFEST_FILE, 'publicFiles')
  skinOrigins = claims; skinSourceDirs = sourceDirs
  // Read and validate all metadata before committing any cleanup.
  for (const id of claims.keys()) for (const area of Object.keys(SKIN_AREA_DESTS)) readSkinMetadata(id, area)
  console.log('Skins:', [...claims].map(([id, owner]) => `${owner}:${id}`).join(', '))
}

// --- 3. Generate theme registry ---
const THEME_REQUIRED = ['Layout.tsx', 'Header.tsx', 'Footer.tsx']

function getThemeIds() {
  if (!fs.existsSync(THEMES_DIR)) return []
  return fs.readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .filter((e) => THEME_REQUIRED.every((f) => fs.existsSync(path.join(THEMES_DIR, e.name, f))))
    .map((e) => e.name)
    .sort()
}

function hasHomeComponent(themeId) {
  const dir = path.join(THEMES_DIR, themeId)
  if (fs.existsSync(path.join(dir, 'Home.tsx'))) return true
  try {
    const j = path.join(dir, 'theme.json')
    if (fs.existsSync(j)) {
      const d = JSON.parse(fs.readFileSync(j, 'utf8'))
      return !!(d.homeComponent && d.homeComponent !== 'none')
    }
  } catch (_) {}
  return false
}

function humanizeExtensionId(id) {
  if (id === 'builtin') return 'Built-in'
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function readSkinMetadata(themeId, area = 'storefront') {
  const origin = skinOrigins.get(themeId) || 'builtin'
  const sourceDir = skinSourceDirs.get(themeId)
    ? path.join(skinSourceDirs.get(themeId), themeId)
    : origin === 'builtin'
    ? path.join(BUILTIN_SKINS_DIR, themeId)
    : path.join(PLUGINS_DIR, origin, 'skins', themeId)
  const candidates = [
    path.join(sourceDir, 'manifest.json'),
    path.join(sourceDir, area, 'theme.json'),
  ]
  const metadata = {}
  let rootScope
  for (const [index, candidate] of candidates.entries()) {
    let stat
    try { stat = fs.lstatSync(candidate) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Skin metadata must be a regular file: ${themeId}`)
    let parsed
    try { parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) } catch { throw new Error(`Invalid skin metadata JSON: ${themeId}`) }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`Invalid skin metadata object: ${themeId}`)
    if (index === 0) rootScope = parsed.workspaceSlugs
    if (index === 1 && rootScope !== undefined && parsed.workspaceSlugs !== undefined && JSON.stringify(parsed.workspaceSlugs) !== JSON.stringify(rootScope)) throw new Error(`Area metadata cannot override workspaceSlugs: ${themeId}`)
    Object.assign(metadata, parsed)
  }
  if (rootScope !== undefined) metadata.workspaceSlugs = rootScope
  const text = (value) => typeof value === 'string' && value.trim() ? value.trim() : undefined
  const modes = Array.isArray(metadata.supportedColorModes)
    ? [...new Set(metadata.supportedColorModes.filter((mode) => mode === 'light' || mode === 'dark'))]
    : []
  if (metadata.workspaceSlugs !== undefined && (!Array.isArray(metadata.workspaceSlugs) || !metadata.workspaceSlugs.length || metadata.workspaceSlugs.some(value => typeof value !== 'string' || !value.trim() || value !== value.trim()))) throw new Error(`Invalid workspaceSlugs for skin ${themeId}`)
  return {
    ...(metadata.workspaceSlugs ? { workspaceSlugs: [...new Set(metadata.workspaceSlugs)] } : {}),
    displayName: text(metadata.displayName) || text(metadata.label) || humanizeExtensionId(themeId),
    description: text(metadata.description) || '',
    extensionId: origin,
    extensionName: humanizeExtensionId(origin),
    ...(modes.length ? { supportedColorModes: modes } : {}),
  }
}

function generateThemeRegistry() {
  const themeIds = getThemeIds()
  if (themeIds.length === 0) return
  const themeMetadata = Object.fromEntries(
    themeIds.map((id) => [id, readSkinMetadata(id)]),
  )

  const outputFile = path.join(THEMES_DIR, 'registry.generated.ts')
  const lines = [
    '// Auto-generated by scripts/prepare.js. Do not edit.',
    '',
    'import React from "react"',
    '',
  ]

  for (const id of themeIds) {
    const name = safeIdent(id)
    lines.push(`import ${name}Layout from './${id}/Layout'`)
    lines.push(`import ${name}Header from './${id}/Header'`)
    lines.push(`import ${name}Footer from './${id}/Footer'`)
  }
  const homeThemes = themeIds.filter(hasHomeComponent)
  for (const id of homeThemes) {
    const name = safeIdent(id)
    lines.push(`import ${name}Home from './${id}/Home'`)
  }

  // Per-theme `pages/` directory scan — enables skin authors to override
  // storefront page-level components (cart, checkout, search, product, ...).
  // Existing themes without a pages/ dir continue to work unchanged.
  const themePages = {}
  for (const id of themeIds) {
    const pagesDir = path.join(THEMES_DIR, id, 'pages')
    const pages = fs.existsSync(pagesDir) ? walkPagesDir(pagesDir) : []
    themePages[id] = pages
    const safe = safeIdent(id)
    for (const p of pages) {
      const ident = `${safe}_pages_${safeIdent(p.key || 'index')}`
      lines.push(`import ${ident} from './${id}/pages/${p.importPath}'`)
    }
  }

  lines.push('')
  lines.push('// eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('import type { ColorMode } from "@/utils/storefrontConfig"')
  lines.push('')
  lines.push('export type ThemeShell = { Layout: React.ComponentType<any>; Header: React.ComponentType<any>; Footer: React.ComponentType<any>; supportedColorModes?: ColorMode[] }')
  lines.push('')
  lines.push('export interface ThemeHomeProps {')
  lines.push('  // eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('  pageData: any | null')
  lines.push('  locale: string')
  lines.push('  workspace_id?: number')
  lines.push('  workspace_slug?: string')
  lines.push('}')
  lines.push('')
  lines.push('export type ThemeMetadata = {')
  lines.push('  workspaceSlugs?: string[]')
  lines.push('  displayName: string')
  lines.push('  description?: string')
  lines.push('  extensionId: string')
  lines.push('  extensionName: string')
  lines.push("  supportedColorModes?: Array<'light' | 'dark'>")
  lines.push('}')
  lines.push('')
  lines.push('export const THEME_METADATA: Record<string, ThemeMetadata> = {')
  for (const id of themeIds) {
    lines.push(`  ${JSON.stringify(id)}: ${JSON.stringify(readSkinMetadata(id))},`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export const THEME_REGISTRY: Record<string, ThemeShell> = {')
  for (const id of themeIds) {
    const name = safeIdent(id)
    const modes = themeMetadata[id].supportedColorModes
    const metadata = modes ? `, supportedColorModes: ${JSON.stringify(modes)}` : ''
    lines.push(`  ${JSON.stringify(id)}: { Layout: ${name}Layout, Header: ${name}Header, Footer: ${name}Footer${metadata} },`)
  }
  lines.push('}')
  lines.push('')
  lines.push('// eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('export type StorefrontSkinPage = React.ComponentType<any>')
  lines.push('')
  lines.push('export const HOME_REGISTRY: Record<string, React.ComponentType<ThemeHomeProps> | null> = {')
  for (const id of themeIds) {
    const hasHome = homeThemes.includes(id)
    const name = safeIdent(id)
    lines.push(`  ${JSON.stringify(id)}: ${hasHome ? name + 'Home' : 'null'},`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export const STOREFRONT_PAGE_OVERRIDES: Record<string, Record<string, StorefrontSkinPage>> = {')
  for (const id of themeIds) {
    const pages = themePages[id]
    if (!pages || pages.length === 0) {
      lines.push(`  ${JSON.stringify(id)}: {},`)
      continue
    }
    const safe = safeIdent(id)
    lines.push(`  ${JSON.stringify(id)}: {`)
    for (const p of pages) {
      const ident = `${safe}_pages_${safeIdent(p.key || 'index')}`
      lines.push(`    ${JSON.stringify(p.key)}: ${ident},`)
    }
    lines.push(`  },`)
  }
  lines.push('}')
  lines.push('')

  writeGeneratedFile(outputFile, lines.join('\n'), 'utf8')
  console.log('Theme registry:', themeIds.join(', '))
  for (const id of themeIds) {
    const pages = themePages[id]
    if (pages && pages.length > 0) {
      console.log(`  ${id} page overrides:`, pages.map(p => p.key).join(', '))
    }
  }
}

// --- 4. Generate area-skin registries (account / auth) ---
//
// Folder convention:
//   src/components/<area>/themes/<skin-id>/
//     ├── Layout.tsx           (optional — wraps all routes in this area)
//     ├── theme.json           (optional — metadata)
//     └── pages/               (optional — per-route overrides)
//         ├── <key>.tsx        → key '<key>'
//         ├── <key>/<sub>.tsx  → key '<key>/<sub>'
//         └── index.tsx        → key '' (area root)
//
// Skin ID matches the storefront `config.theme` value, so admin can pick a
// storefront theme and the account/auth area auto-uses the matching skin
// when one exists. Areas without a skin folder fall back to baseline.

function walkPagesDir(rootDir, current = '', acc = []) {
  if (!fs.existsSync(rootDir)) return acc
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      walkPagesDir(full, current ? `${current}/${entry.name}` : entry.name, acc)
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      const stem = entry.name.replace(/\.tsx$/, '')
      const key = stem === 'index' ? current : current ? `${current}/${stem}` : stem
      const importPath = current ? `${current}/${stem}` : stem
      acc.push({ key, importPath })
    }
  }
  return acc
}

function getSkinIds(themesDir) {
  if (!fs.existsSync(themesDir)) return []
  return fs.readdirSync(themesDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map(e => e.name)
    .sort()
}

function safeIdent(id) {
  return id.replace(/[^A-Za-z0-9]+/g, '_').replace(/^[0-9]/, '_$&')
}

function generateAreaSkinRegistry(area, themesDir) {
  if (!fs.existsSync(themesDir)) fs.mkdirSync(themesDir, { recursive: true })
  const skinIds = getSkinIds(themesDir)
  const outputFile = path.join(themesDir, 'registry.generated.ts')

  const lines = [
    '// Auto-generated by scripts/prepare.js. Do not edit.',
    '',
    'import React from "react"',
    '',
  ]

  const skinEntries = []
  for (const id of skinIds) {
    const safe = safeIdent(id)
    const skinDir = path.join(themesDir, id)
    const hasLayout = fs.existsSync(path.join(skinDir, 'Layout.tsx'))
    const pagesDir = path.join(skinDir, 'pages')
    const pages = fs.existsSync(pagesDir) ? walkPagesDir(pagesDir) : []

    if (hasLayout) {
      lines.push(`import ${safe}Layout from './${id}/Layout'`)
    }
    for (const p of pages) {
      const ident = `${safe}_${safeIdent(p.key || 'index')}`
      lines.push(`import ${ident} from './${id}/pages/${p.importPath}'`)
    }
    skinEntries.push({ id, safe, hasLayout, pages, metadata: readSkinMetadata(id, area) })
  }

  lines.push('')
  lines.push('// eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('export type SkinPage = React.ComponentType<any>')
  lines.push('')
  lines.push('import type { ColorMode } from "@/utils/storefrontConfig"')
  lines.push('')
  lines.push('export type AreaSkin = {')
  lines.push('  // eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('  Layout?: React.ComponentType<any>')
  lines.push('  pages?: Record<string, SkinPage>')
  lines.push('  supportedColorModes?: ColorMode[]')
  lines.push('}')
  lines.push('')

  const exportName = area === 'account' ? 'ACCOUNT_SKIN_REGISTRY' : 'AUTH_SKIN_REGISTRY'
  lines.push(`export const ${area.toUpperCase()}_SKIN_METADATA = ${JSON.stringify(Object.fromEntries(skinEntries.map(e => [e.id, e.metadata])))} as Record<string, { extensionId: string; workspaceSlugs?: string[] }>` )
  lines.push(`export const ${exportName}: Record<string, AreaSkin> = {`)
  for (const e of skinEntries) {
    lines.push(`  ${JSON.stringify(e.id)}: {`)
    if (e.hasLayout) lines.push(`    Layout: ${e.safe}Layout,`)
    if (e.metadata.supportedColorModes) {
      lines.push(`    supportedColorModes: ${JSON.stringify(e.metadata.supportedColorModes)},`)
    }
    if (e.pages.length > 0) {
      lines.push(`    pages: {`)
      for (const p of e.pages) {
        const ident = `${e.safe}_${safeIdent(p.key || 'index')}`
        lines.push(`      ${JSON.stringify(p.key)}: ${ident},`)
      }
      lines.push(`    },`)
    }
    lines.push(`  },`)
  }
  lines.push('}')
  lines.push('')

  writeGeneratedFile(outputFile, lines.join('\n'), 'utf8')
  if (skinIds.length > 0) {
    console.log(`${area} skins:`, skinIds.join(', '))
  } else {
    console.log(`${area} skins: (none)`)
  }
}

// --- Run all ---
// Validate controls and registries before any generated write, including dangling links.
for (const filename of [MANIFEST_FILE, SKIN_MANIFEST_FILE, ...['.plugin-public-assets.json', '.plugin-route-control.json', '.plugin-public-control.json', '.plugin-route-rewrites.json', '.plugin-public-mounts.json', 'plugins/loaders.generated.ts', 'plugins/storefront-server.generated.ts', 'plugins/route-owners.generated.ts', ...Object.values(SKIN_AREA_DESTS).map(dir => path.relative(SRC_DIR, path.join(dir, 'registry.generated.ts')))].map(file => path.join(SRC_DIR, file))]) checkedGeneratedFile(filename)
console.log('Preparing...\n')
generatePluginLoaders()
syncPluginRoutes()
syncSkins()
syncPluginPublicAssets()
commitGeneratedPlans()
generateThemeRegistry()
generateAreaSkinRegistry('account', ACCOUNT_THEMES_DIR)
generateAreaSkinRegistry('auth', AUTH_THEMES_DIR)
flushGeneratedWrites()
console.log('\nDone.')
