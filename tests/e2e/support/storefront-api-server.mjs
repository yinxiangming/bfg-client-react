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

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1:8787')
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Access-Control-Allow-Origin', '*')

  if (url.pathname === '/health') {
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.pathname === '/api/v1/settings/storefront/') {
    response.end(JSON.stringify(storefrontConfig))
    return
  }

  response.statusCode = 404
  response.end(JSON.stringify({ detail: `No mock configured for ${url.pathname}` }))
})

server.listen(8787, '127.0.0.1')

const close = () => server.close(() => process.exit(0))
process.on('SIGINT', close)
process.on('SIGTERM', close)
