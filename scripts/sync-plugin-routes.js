#!/usr/bin/env node

// Sync plugin routes to src/app directory
// This script scans all plugins in src/plugins/*/app/ and syncs their
// route files to src/app/ to comply with Next.js routing conventions.
//
// Usage:
//   node scripts/sync-plugin-routes.js
//   npm run sync-plugins

const fs = require('fs')
const path = require('path')

const SRC_DIR = path.join(__dirname, '..', 'src')
const PLUGINS_DIR = path.join(SRC_DIR, 'plugins')
const APP_DIR = path.join(SRC_DIR, 'app')

// Track synced files for cleanup
const MANIFEST_FILE = path.join(SRC_DIR, '.plugin-routes-manifest.json')

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
  let removed = 0
  for (const file of manifest.files) {
    const fullPath = path.join(SRC_DIR, file)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      removed++

      // Try to remove empty parent directories
      let dir = path.dirname(fullPath)
      while (dir !== APP_DIR && dir.startsWith(APP_DIR)) {
        try {
          const contents = fs.readdirSync(dir)
          if (contents.length === 0) {
            fs.rmdirSync(dir)
            dir = path.dirname(dir)
          } else {
            break
          }
        } catch (err) {
          break
        }
      }
    }
  }
  if (removed > 0) {
    console.log('Cleaned up ' + removed + ' old synced file(s)')
  }
}

// Files to ignore during sync
const IGNORE_FILES = ['.DS_Store', 'Thumbs.db', '.gitkeep']

function copyRecursive(src, dest, syncedFiles) {
  if (!fs.existsSync(src)) return

  const stat = fs.statSync(src)
  const basename = path.basename(src)

  // Skip ignored files
  if (IGNORE_FILES.includes(basename)) {
    return
  }

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item), syncedFiles)
    }
  } else {
    // Copy file
    fs.copyFileSync(src, dest)
    // Track relative path from src/
    const relativePath = path.relative(SRC_DIR, dest)
    syncedFiles.push(relativePath)
  }
}

function syncPluginRoutes() {
  console.log('Syncing plugin routes...\n')

  // Load previous manifest and cleanup
  const oldManifest = loadManifest()
  cleanupOldFiles(oldManifest)

  const syncedFiles = []

  // Check if plugins directory exists
  if (!fs.existsSync(PLUGINS_DIR)) {
    console.log('No plugins directory found')
    saveManifest({ files: [] })
    return
  }

  // Scan all plugins
  const plugins = fs.readdirSync(PLUGINS_DIR).filter(function (name) {
    const pluginPath = path.join(PLUGINS_DIR, name)
    return fs.statSync(pluginPath).isDirectory()
  })

  for (const plugin of plugins) {
    const pluginAppDir = path.join(PLUGINS_DIR, plugin, 'app')

    if (!fs.existsSync(pluginAppDir)) {
      continue
    }

    console.log('  [' + plugin + '] Syncing routes...')

    // Copy plugin app directory contents to src/app
    copyRecursive(pluginAppDir, APP_DIR, syncedFiles)
  }

  // Save new manifest
  saveManifest({ files: syncedFiles, timestamp: new Date().toISOString() })

  console.log('\nSynced ' + syncedFiles.length + ' file(s) from ' + plugins.length + ' plugin(s)')

  if (syncedFiles.length > 0) {
    console.log('\nSynced files:')
    for (const file of syncedFiles) {
      console.log('  - ' + file)
    }
  }
}

// Run
syncPluginRoutes()
