#!/usr/bin/env node

/**
 * Run all pre-build tasks: plugin loaders, plugin routes, theme registry.
 * Usage: node scripts/prepare.js
 *
 * Plugin routes: each plugin may ship `plugins/<id>/app/<segment>/...` (e.g. admin, account, storefront).
 * Storefront segment is copied under `app/(storefront)/plugins/<id>/...` so routes use the storefront layout.
 * See syncPluginRoutes() for how that maps into `src/app/`.
 */

const fs = require('fs')
const path = require('path')

const SRC_DIR = path.join(__dirname, '..', 'src')
const PLUGINS_DIR = path.join(SRC_DIR, 'plugins')
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
      if (!fs.existsSync(path.join(pluginPath, 'index.ts'))) continue
      entries.push(name)
    }
  }

  const loaderLines = entries.map((id) => `  ${id}: () => import('@/plugins/${id}'),`).join('\n')
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
  fs.writeFileSync(outputFile, content)
  if (entries.length > 0) console.log('Plugin loaders:', entries.join(', '))
}

// --- 2. Sync plugin routes ---
const IGNORE_FILES = ['.DS_Store', 'Thumbs.db', '.gitkeep']

function loadManifest() {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'))
    }
  } catch (e) {
    console.warn('Could not load manifest:', e.message)
  }
  return { files: [] }
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
}

function cleanupOldFiles(manifest) {
  for (const file of manifest.files || []) {
    const fullPath = path.join(SRC_DIR, file)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      let dir = path.dirname(fullPath)
      while (dir !== APP_DIR && dir.startsWith(APP_DIR)) {
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
  }
}

function copyRecursive(src, dest, syncedFiles) {
  if (!fs.existsSync(src)) return
  const stat = fs.statSync(src)
  const basename = path.basename(src)
  if (IGNORE_FILES.includes(basename)) return

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item), syncedFiles)
    }
  } else {
    fs.copyFileSync(src, dest)
    syncedFiles.push(path.relative(SRC_DIR, dest))
  }
}

function syncPluginRoutes() {
  const oldManifest = loadManifest()
  cleanupOldFiles(oldManifest)
  const syncedFiles = []

  if (fs.existsSync(PLUGINS_DIR)) {
    const plugins = fs.readdirSync(PLUGINS_DIR).filter((name) => {
      const p = path.join(PLUGINS_DIR, name)
      let stat
      try {
        stat = fs.statSync(p)
      } catch (e) {
        if (e.code === 'ENOENT') return false
        throw e
      }
      return stat.isDirectory() && fs.existsSync(path.join(p, 'app'))
    })
    for (const plugin of plugins) {
      const pluginAppDir = path.join(PLUGINS_DIR, plugin, 'app')
      const topLevel = fs.readdirSync(pluginAppDir, { withFileTypes: true })
      for (const dirent of topLevel) {
        if (dirent.name.startsWith('.')) continue
        if (!dirent.isDirectory()) continue
        const segment = dirent.name
        const segmentDir = path.join(pluginAppDir, segment)
        // One top-level folder per area (admin / account / (storefront) / …).
        for (const child of fs.readdirSync(segmentDir, { withFileTypes: true })) {
          if (!child.isDirectory() || child.name.startsWith('.')) continue
          const name = child.name
          const srcPath = path.join(segmentDir, name)
          // Storefront lives in the `(storefront)` route group (not a literal `storefront` URL segment).
          // Always nest under app/(storefront)/plugins/<id>/ so pages get the storefront layout; mirrors
          // admin/account using .../plugins/<id>/ in the extension tree.
          let destPath
          if (segment === 'storefront') {
            destPath =
              name === plugin
                ? path.join(APP_DIR, '(storefront)', 'plugins', plugin)
                : path.join(APP_DIR, '(storefront)', 'plugins', plugin, name)
          } else {
            // Folder name === plugin id → isolate under app/<segment>/plugins/<id>/ (rewritten in next.config).
            // Otherwise merge into app/<segment>/<name>/ (shared routes, e.g. settings).
            destPath =
              name === plugin
                ? path.join(APP_DIR, segment, 'plugins', plugin)
                : path.join(APP_DIR, segment, name)
          }
          copyRecursive(srcPath, destPath, syncedFiles)
        }
      }
    }
    if (plugins.length > 0) {
      console.log('Plugin routes:', plugins.join(', '), '->', syncedFiles.length, 'file(s)')
    }
  }
  saveManifest({ files: syncedFiles, timestamp: new Date().toISOString() })
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

function loadSkinManifest() {
  try {
    if (fs.existsSync(SKIN_MANIFEST_FILE)) {
      return JSON.parse(fs.readFileSync(SKIN_MANIFEST_FILE, 'utf-8'))
    }
  } catch (e) {
    console.warn('Could not load skin manifest:', e.message)
  }
  return { srcFiles: [], publicFiles: [] }
}

function saveSkinManifest(manifest) {
  fs.writeFileSync(SKIN_MANIFEST_FILE, JSON.stringify(manifest, null, 2))
}

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

function cleanupOldSkinFiles(manifest) {
  for (const rel of manifest.srcFiles || []) {
    const full = path.join(SRC_DIR, rel)
    if (fs.existsSync(full)) {
      fs.unlinkSync(full)
      pruneEmptyDirs(path.dirname(full), SRC_DIR)
    }
  }
  for (const rel of manifest.publicFiles || []) {
    const full = path.join(PUBLIC_DIR, rel)
    if (fs.existsSync(full)) {
      fs.unlinkSync(full)
      pruneEmptyDirs(path.dirname(full), PUBLIC_DIR)
    }
  }
}

function copyFileTracked(srcFile, destFile, syncedList, baseDir) {
  if (IGNORE_FILES.includes(path.basename(srcFile))) return
  fs.mkdirSync(path.dirname(destFile), { recursive: true })
  fs.copyFileSync(srcFile, destFile)
  syncedList.push(path.relative(baseDir, destFile))
}

function copyDirTracked(srcDir, destDir, syncedList, baseDir) {
  if (!fs.existsSync(srcDir)) return
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    if (IGNORE_FILES.includes(entry.name)) continue
    const s = path.join(srcDir, entry.name)
    const d = path.join(destDir, entry.name)
    if (entry.isDirectory()) {
      copyDirTracked(s, d, syncedList, baseDir)
    } else if (entry.isFile()) {
      copyFileTracked(s, d, syncedList, baseDir)
    }
  }
}

function syncOneSkin(skinDir, skinId, publicPrefix, srcFiles, publicFiles) {
  // Discover shared top-level files (anything at <skinDir>/*.css). Each shared file gets
  // copied into every synced destination area so its sibling `@import './*.css'` works.
  const sharedFiles = []
  for (const entry of fs.readdirSync(skinDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || IGNORE_FILES.includes(entry.name)) continue
    if (entry.isFile() && entry.name.endsWith('.css')) {
      sharedFiles.push(entry.name)
    }
  }

  for (const [area, dest] of Object.entries(SKIN_AREA_DESTS)) {
    const areaSrc = path.join(skinDir, area)
    if (!fs.existsSync(areaSrc)) continue
    const areaDest = path.join(dest, skinId)
    copyDirTracked(areaSrc, areaDest, srcFiles, SRC_DIR)
    for (const f of sharedFiles) {
      copyFileTracked(path.join(skinDir, f), path.join(areaDest, f), srcFiles, SRC_DIR)
    }
  }

  const publicSrc = path.join(skinDir, 'public')
  if (fs.existsSync(publicSrc)) {
    const publicDest = path.join(PUBLIC_DIR, publicPrefix, skinId)
    copyDirTracked(publicSrc, publicDest, publicFiles, PUBLIC_DIR)
  }
}

function syncSkins() {
  const oldManifest = loadSkinManifest()
  cleanupOldSkinFiles(oldManifest)

  const srcFiles = []
  const publicFiles = []
  const claims = new Map() // skinId -> origin label ("builtin" or plugin id)

  // 1. Built-in skins shipped with bfg-client (src/skins/<id>/).
  if (fs.existsSync(BUILTIN_SKINS_DIR)) {
    for (const skinId of fs.readdirSync(BUILTIN_SKINS_DIR)) {
      if (skinId.startsWith('.')) continue
      const skinDir = path.join(BUILTIN_SKINS_DIR, skinId)
      if (!fs.statSync(skinDir).isDirectory()) continue
      claims.set(skinId, 'builtin')
      syncOneSkin(skinDir, skinId, 'skins', srcFiles, publicFiles)
    }
  }

  // 2. Extension skins (plugins/<plugin>/skins/<id>/).
  if (fs.existsSync(PLUGINS_DIR)) {
    for (const pluginName of fs.readdirSync(PLUGINS_DIR)) {
      if (pluginName.startsWith('.') || pluginName.endsWith('.generated.ts')) continue
      const skinsRoot = path.join(PLUGINS_DIR, pluginName, 'skins')
      let stat
      try {
        stat = fs.statSync(skinsRoot)
      } catch {
        continue
      }
      if (!stat.isDirectory()) continue
      for (const skinId of fs.readdirSync(skinsRoot)) {
        if (skinId.startsWith('.')) continue
        const skinDir = path.join(skinsRoot, skinId)
        if (!fs.statSync(skinDir).isDirectory()) continue
        if (claims.has(skinId)) {
          throw new Error(
            `skin id "${skinId}" contributed by both "${claims.get(skinId)}" and "${pluginName}" — pick distinct ids`,
          )
        }
        claims.set(skinId, pluginName)
        syncOneSkin(skinDir, skinId, `plugins/${pluginName}`, srcFiles, publicFiles)
      }
    }
  }

  saveSkinManifest({ srcFiles, publicFiles, timestamp: new Date().toISOString() })
  if (claims.size > 0) {
    console.log(
      'Skins:',
      [...claims.entries()].map(([id, origin]) => `${origin}:${id}`).join(', '),
      '->',
      srcFiles.length + publicFiles.length,
      'file(s)',
    )
  }
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

function generateThemeRegistry() {
  const themeIds = getThemeIds()
  if (themeIds.length === 0) return

  const outputFile = path.join(THEMES_DIR, 'registry.generated.ts')
  const lines = [
    '// Auto-generated by scripts/prepare.js. Do not edit.',
    '',
    'import React from "react"',
    '',
  ]

  for (const id of themeIds) {
    const name = id.charAt(0).toUpperCase() + id.slice(1)
    lines.push(`import ${name}Layout from './${id}/Layout'`)
    lines.push(`import ${name}Header from './${id}/Header'`)
    lines.push(`import ${name}Footer from './${id}/Footer'`)
  }
  const homeThemes = themeIds.filter(hasHomeComponent)
  for (const id of homeThemes) {
    const name = id.charAt(0).toUpperCase() + id.slice(1)
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
  lines.push('export type ThemeShell = { Layout: React.ComponentType<any>; Header: React.ComponentType<any>; Footer: React.ComponentType<any> }')
  lines.push('')
  lines.push('export interface ThemeHomeProps {')
  lines.push('  // eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('  pageData: any | null')
  lines.push('  locale: string')
  lines.push('  workspace_id?: number')
  lines.push('  workspace_slug?: string')
  lines.push('}')
  lines.push('')
  lines.push('// eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('export type StorefrontSkinPage = React.ComponentType<any>')
  lines.push('')
  lines.push('export const THEME_REGISTRY: Record<string, ThemeShell> = {')
  for (const id of themeIds) {
    const name = id.charAt(0).toUpperCase() + id.slice(1)
    lines.push(`  ${id}: { Layout: ${name}Layout, Header: ${name}Header, Footer: ${name}Footer },`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export const HOME_REGISTRY: Record<string, React.ComponentType<ThemeHomeProps> | null> = {')
  for (const id of themeIds) {
    const hasHome = homeThemes.includes(id)
    const name = id.charAt(0).toUpperCase() + id.slice(1)
    lines.push(`  ${id}: ${hasHome ? name + 'Home' : 'null'},`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export const STOREFRONT_PAGE_OVERRIDES: Record<string, Record<string, StorefrontSkinPage>> = {')
  for (const id of themeIds) {
    const pages = themePages[id]
    if (!pages || pages.length === 0) {
      lines.push(`  ${id}: {},`)
      continue
    }
    const safe = safeIdent(id)
    lines.push(`  ${id}: {`)
    for (const p of pages) {
      const ident = `${safe}_pages_${safeIdent(p.key || 'index')}`
      lines.push(`    ${JSON.stringify(p.key)}: ${ident},`)
    }
    lines.push(`  },`)
  }
  lines.push('}')
  lines.push('')

  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8')
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
    skinEntries.push({ id, safe, hasLayout, pages })
  }

  lines.push('')
  lines.push('// eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('export type SkinPage = React.ComponentType<any>')
  lines.push('')
  lines.push('export type AreaSkin = {')
  lines.push('  // eslint-disable-next-line @typescript-eslint/no-explicit-any')
  lines.push('  Layout?: React.ComponentType<any>')
  lines.push('  pages?: Record<string, SkinPage>')
  lines.push('}')
  lines.push('')

  const exportName = area === 'account' ? 'ACCOUNT_SKIN_REGISTRY' : 'AUTH_SKIN_REGISTRY'
  lines.push(`export const ${exportName}: Record<string, AreaSkin> = {`)
  for (const e of skinEntries) {
    lines.push(`  ${JSON.stringify(e.id)}: {`)
    if (e.hasLayout) lines.push(`    Layout: ${e.safe}Layout,`)
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

  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8')
  if (skinIds.length > 0) {
    console.log(`${area} skins:`, skinIds.join(', '))
  } else {
    console.log(`${area} skins: (none)`)
  }
}

// --- Run all ---
console.log('Preparing...\n')
generatePluginLoaders()
syncPluginRoutes()
syncSkins()
generateThemeRegistry()
generateAreaSkinRegistry('account', ACCOUNT_THEMES_DIR)
generateAreaSkinRegistry('auth', AUTH_THEMES_DIR)
console.log('\nDone.')
