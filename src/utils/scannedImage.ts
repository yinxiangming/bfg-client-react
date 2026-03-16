/**
 * Helpers for scanned product image: detect base64 data URL, convert to File, or fetch from URL.
 */

const DATA_URL_IMAGE_PREFIX = 'data:image/'

export function isBase64ImageUrl(value: string): boolean {
  return typeof value === 'string' && value.startsWith(DATA_URL_IMAGE_PREFIX)
}

/**
 * Convert a data URL (base64 image) to a File for upload.
 */
export function dataUrlToFile(dataUrl: string, filename = 'scanned-product.png'): File {
  const arr = dataUrl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  const ext = mime.split('/')[1] || 'png'
  const name = filename.replace(/\.[^.]+$/, '') + '.' + ext
  return new File([u8arr], name, { type: mime })
}

/**
 * Fetch image from URL and return as File. Fails if CORS or network error.
 * Prefer urlToFileViaProxy in browser to avoid CORS with external domains.
 */
export async function urlToFile(imageUrl: string, filename = 'scanned-product.png'): Promise<File> {
  const res = await fetch(imageUrl, { mode: 'cors' })
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const blob = await res.blob()
  const mime = blob.type || 'image/png'
  const ext = mime.split('/')[1] || 'png'
  const name = filename.replace(/\.[^.]+$/, '') + '.' + ext
  return new File([blob], name, { type: mime })
}

/**
 * Fetch image from URL via same-origin API proxy (no CORS). Use for external URLs in browser.
 */
export async function urlToFileViaProxy(imageUrl: string, filename = 'scanned-product.png'): Promise<File> {
  const res = await fetch('/api/proxy-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string })?.error || `Proxy failed: ${res.status}`)
  }
  const blob = await res.blob()
  const mime = blob.type || 'image/png'
  const ext = mime.split('/')[1] || 'png'
  const name = filename.replace(/\.[^.]+$/, '') + '.' + ext
  return new File([blob], name, { type: mime })
}
