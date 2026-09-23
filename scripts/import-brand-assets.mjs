import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const TARGET_WIDTHS = [480, 960, 1600]
const DOWNLOAD_CONCURRENCY = 4
const REQUEST_TIMEOUT_MS = 30_000
const IMAGE_FILE_PATTERN = /\b\d{10,}-\d+\.(?:avif|gif|jpe?g|png|webp)\b/gi

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const clientRoot = resolve(scriptDirectory, '..')
const outputRoot = join(clientRoot, 'public', 'brand-assets')
const importRoot = resolve(
  process.env.BRAND_ASSET_IMPORT_ROOT
    ?? '/Users/mac/Documents/Codex/2026-09-17/chogn/bfg-server-django-community/docs/imports',
)

const brands = [
  {
    id: 'repair-hub',
    origin: 'https://therepairhub.co.nz',
    manifest: join(importRoot, 'repair-hub', 'assets-manifest.json'),
    skin: join(clientRoot, 'src', 'skins', 'repair-grid', 'storefront'),
  },
  {
    id: 'ultimate-space',
    origin: 'https://ultimatespacedesign.co.nz',
    manifest: join(importRoot, 'ultimate-space', 'assets-manifest.json'),
    skin: join(clientRoot, 'src', 'skins', 'atelier-grid', 'storefront'),
  },
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeUploadUrl(value, expectedOrigin) {
  try {
    const url = new URL(value, expectedOrigin)
    if (url.origin !== expectedOrigin || !url.pathname.startsWith('/uploads/')) return null
    url.search = ''
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  }))
  return nested.flat()
}

async function collectBrandUrls(brand) {
  const imported = JSON.parse(await readFile(brand.manifest, 'utf8'))
  const urls = new Set()

  for (const asset of imported.assets ?? []) {
    const url = normalizeUploadUrl(asset.source_url, brand.origin)
    if (url) urls.add(url)
  }

  for (const file of await listFiles(brand.skin)) {
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(IMAGE_FILE_PATTERN)) {
      const url = normalizeUploadUrl(`/uploads/${match[0]}`, brand.origin)
      if (url) urls.add(url)
    }
  }

  return [...urls].sort()
}

async function download(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Nexus brand asset importer/1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`Expected image response, received ${contentType || 'unknown content type'}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function importAsset(brand, url) {
  const sourceName = decodeURIComponent(basename(new URL(url).pathname))
  const stem = sourceName.slice(0, -extname(sourceName).length)
  if (!/^\d{10,}-\d+$/.test(stem)) throw new Error(`Unsafe upload basename: ${sourceName}`)

  const input = await download(url)
  const metadata = await sharp(input).metadata()
  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error('Sharp could not read the source image dimensions')
  }

  const directory = join(outputRoot, brand.id)
  await mkdir(directory, { recursive: true })
  const variants = {}

  for (const requestedWidth of TARGET_WIDTHS) {
    const filename = `${stem}-${requestedWidth}.webp`
    const path = join(directory, filename)
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: requestedWidth })
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true })

    await writeFile(path, data)
    const verified = await sharp(path).metadata()
    if (verified.format !== 'webp' || verified.width !== requestedWidth || !verified.height) {
      throw new Error(`Variant validation failed for ${filename}`)
    }

    variants[String(requestedWidth)] = {
      path: `/brand-assets/${brand.id}/${filename}`,
      width: verified.width,
      height: verified.height,
      bytes: info.size,
      sha256: sha256(data),
    }
  }

  return {
    brand: brand.id,
    sourceBasename: sourceName,
    basePath: `/brand-assets/${brand.id}/${stem}`,
    original: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      bytes: input.length,
      sha256: sha256(input),
    },
    variants,
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run))
  return results
}

const sources = (await Promise.all(brands.map(async (brand) => {
  const urls = await collectBrandUrls(brand)
  return urls.map((url) => ({ brand, url }))
}))).flat()

const failures = []
const imported = await mapWithConcurrency(sources, DOWNLOAD_CONCURRENCY, async ({ brand, url }) => {
  try {
    const asset = await importAsset(brand, url)
    console.log(`Imported ${url}`)
    return [url, asset]
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push({ url, error: message })
    console.error(`Failed ${url}: ${message}`)
    return null
  }
})

const assets = Object.fromEntries(imported.filter(Boolean).sort(([left], [right]) => left.localeCompare(right)))
const manifest = {
  version: 1,
  targetWidths: TARGET_WIDTHS,
  assets,
  failures: failures.sort((left, right) => left.url.localeCompare(right.url)),
}

await mkdir(outputRoot, { recursive: true })
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

const outputBytes = Object.values(assets).reduce(
  (total, asset) => total + Object.values(asset.variants).reduce((sum, variant) => sum + variant.bytes, 0),
  0,
)
console.log(`Completed: ${Object.keys(assets).length} assets, ${sources.length * TARGET_WIDTHS.length} requested variants, ${outputBytes} output bytes, ${failures.length} failures`)

if (failures.length > 0) process.exitCode = 1
