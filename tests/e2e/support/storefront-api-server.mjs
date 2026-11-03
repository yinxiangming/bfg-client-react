import { createServer } from 'node:http'

const storefrontConfig = {
  site_name: 'Playwright Store',
  site_description: 'Mock storefront for browser tests',
  default_currency: 'NZD',
  default_language: 'en',
  languages: ['en'],
  allowed_color_modes: ['light'],
  default_color_mode: 'light',
  theme: 'store',
  read_only: false,
  storefront_display: {
    sku_display: 'plain',
    stock_display: 'exact',
    out_of_stock_policy: 'notify'
  },
  workspace_domain: '',
  extensions: [],
  header_menus: [],
  footer_menus: [],
  header_options: {
    show_search: true,
    show_cart: true,
    show_language_switcher: false,
    show_style_selector: false,
    show_login: true
  }
}

const products = {
  'sensor-hub': {
    id: 301,
    slug: 'sensor-hub',
    name: 'Wireless Sensor Hub',
    brand: 'BFG',
    price: '89.00',
    compare_price: '99.00',
    short_description: 'Connect and monitor workshop sensors.',
    description: '<p>Connect and monitor workshop sensors.</p>',
    sku: 'BFG-HUB-301',
    stock_quantity: 8,
    in_stock: true,
    low_stock: false,
    purchasable: true,
    images: ['/media/sensor-hub.jpg'],
    categories: [{ id: 4, name: 'Sensors', slug: 'sensors' }],
    variants: [
      { id: 701, options: { size: 'Standard', color: 'Black' } },
      { id: 702, options: { size: 'Pro', color: 'Blue' } }
    ]
  },
  'sold-out-sensor': {
    id: 302,
    slug: 'sold-out-sensor',
    name: 'Sold-out Temperature Sensor',
    brand: 'BFG',
    price: '29.00',
    short_description: 'A compact temperature sensor.',
    description: '<p>A compact temperature sensor.</p>',
    sku: 'BFG-TEMP-302',
    stock_quantity: 0,
    in_stock: false,
    low_stock: false,
    purchasable: false,
    images: ['/media/temperature-sensor.jpg'],
    categories: [{ id: 4, name: 'Sensors', slug: 'sensors' }],
    variants: []
  }
}

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1:8787')
  const requestOrigin = request.headers.origin
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Access-Control-Allow-Origin', requestOrigin || 'http://127.0.0.1:3000')
  response.setHeader('Access-Control-Allow-Credentials', 'true')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bfg-Cart-Session, X-Forwarded-Host')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.end()
    return
  }

  if (url.pathname === '/health') {
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.pathname === '/api/v1/settings/storefront/') {
    response.end(JSON.stringify(storefrontConfig))
    return
  }

  const productMatch = url.pathname.match(/^\/api\/v1\/store\/products\/([^/]+)\/$/)
  if (productMatch && products[productMatch[1]]) {
    response.end(JSON.stringify(products[productMatch[1]]))
    return
  }

  response.statusCode = 404
  response.end(JSON.stringify({ detail: `No mock configured for ${url.pathname}` }))
})

server.listen(8787, '127.0.0.1')

const close = () => server.close(() => process.exit(0))
process.on('SIGINT', close)
process.on('SIGTERM', close)
