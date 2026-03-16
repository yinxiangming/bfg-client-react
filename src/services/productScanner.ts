// Product Scanner API service

export type ProductCandidate = {
  name: string
  brand?: string
  model?: string
  confidence?: number
  /** Thumbnail or first image URL for list display */
  image_url?: string
  /** All image URLs for this product (for badge count and ImageViewerDialog) */
  image_urls?: string[]
}

export type ProductDetails = {
  name: string
  brand?: string
  model?: string
  description?: string
  image_url?: string
  specifications?: Record<string, any>
}

export type ProductScannerConfig = {
  apiUrl: string
  apiKey: string
}

const API_URL_NOT_CONFIGURED = 'Product Scanner API URL is not configured. Please set it in Settings.'
const NETWORK_ERROR_HINT = 'Cannot reach the API. Check the URL, network, and CORS settings.'

function ensureApiUrl(config: ProductScannerConfig): void {
  if (!config.apiUrl?.trim()) {
    throw new Error(API_URL_NOT_CONFIGURED)
  }
}

function wrapNetworkError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err)
  if (message === 'Failed to fetch' || message.includes('NetworkError') || message.includes('Load failed')) {
    return new Error(`${message}. ${NETWORK_ERROR_HINT}`)
  }
  return err instanceof Error ? err : new Error(message)
}

/**
 * Search for product candidates using text query.
 * @param includeImageUrls - When true (default), API returns image_urls per candidate for thumbnails; set false to speed up response.
 */
export async function searchProductsByText(
  query: string,
  config: ProductScannerConfig,
  includeImageUrls = true
): Promise<ProductCandidate[]> {
  ensureApiUrl(config)
  const baseUrl = config.apiUrl.replace(/\/+$/, '')
  let response: Response
  try {
    response = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey
    },
    body: JSON.stringify({ query, include_image_urls: includeImageUrls })
  })
  } catch (e) {
    throw wrapNetworkError(e)
  }

  if (!response.ok) {
    throw new Error(`Product Scanner API error: ${response.statusText}`)
  }

  const data = await response.json()
  const raw = data.candidates || []
  return raw.map(normalizeCandidate)
}

/**
 * Search for product candidates using image upload
 */
export async function searchProductsByImage(
  imageFile: File,
  config: ProductScannerConfig
): Promise<ProductCandidate[]> {
  ensureApiUrl(config)
  const baseUrl = config.apiUrl.replace(/\/+$/, '')
  const formData = new FormData()
  formData.append('image', imageFile)

  let response: Response
  try {
    response = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: {
      'X-API-Key': config.apiKey
    },
    body: formData
  })
  } catch (e) {
    throw wrapNetworkError(e)
  }

  if (!response.ok) {
    throw new Error(`Product Scanner API error: ${response.statusText}`)
  }

  const data = await response.json()
  const raw = data.candidates || []
  return raw.map(normalizeCandidate)
}

/** Normalize API candidate (product_name, image_urls[], white_bg_images[]) to ProductCandidate */
function normalizeCandidate(c: Record<string, unknown>): ProductCandidate {
  const imageUrls = c.image_urls as string[] | undefined
  const whiteBg = c.white_bg_images as string[] | undefined
  const urls = Array.isArray(imageUrls) && imageUrls.length > 0
    ? imageUrls
    : Array.isArray(whiteBg)
      ? whiteBg
      : []
  const firstFromUrls = urls[0]
  const firstFromWhiteBg = Array.isArray(whiteBg) && whiteBg.length > 0 ? whiteBg[0] : undefined
  return {
    name: (c.product_name as string) || (c.name as string) || '',
    brand: c.brand as string | undefined,
    model: c.model as string | undefined,
    confidence: c.confidence as number | undefined,
    image_url: (c.image_url as string) || firstFromUrls || firstFromWhiteBg,
    image_urls: urls.length > 0 ? urls : undefined
  }
}

/**
 * Get detailed product information for a candidate
 */
export async function getProductDetails(
  candidate: ProductCandidate,
  config: ProductScannerConfig
): Promise<ProductDetails> {
  ensureApiUrl(config)
  const baseUrl = config.apiUrl.replace(/\/+$/, '')
  let response: Response
  try {
    response = await fetch(`${baseUrl}/product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey
    },
    body: JSON.stringify({
      product_name: candidate.name,
      brand: candidate.brand,
      model: candidate.model
    })
  })
  } catch (e) {
    throw wrapNetworkError(e)
  }

  if (!response.ok) {
    throw new Error(`Product Scanner API error: ${response.statusText}`)
  }

  const data = await response.json()
  const whiteBg = data.white_bg_images as string[] | undefined
  const firstImage = Array.isArray(whiteBg) && whiteBg.length > 0 ? whiteBg[0] : undefined
  return {
    name: data.product_name || data.name || '',
    brand: data.brand,
    model: data.model,
    description: data.description,
    image_url: data.image_url || firstImage,
    specifications: data.specifications
  }
}
