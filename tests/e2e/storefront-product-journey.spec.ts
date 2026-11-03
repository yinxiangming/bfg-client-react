import { expect, test, type Page, type Route } from '@playwright/test'

const searchProduct = {
  id: 301,
  slug: 'sensor-hub',
  name: 'Wireless Sensor Hub',
  brand: 'BFG',
  price: '89.00',
  compare_price: '99.00',
  rating: 4.5,
  reviews_count: 12,
  primary_image: '/media/sensor-hub.jpg',
  in_stock: true,
  purchasable: true
}

async function mockSearchDependencies(page: Page) {
  await page.route('**/api/v1/store/categories/**', route => route.fulfill({
    json: [{ id: 4, name: 'Sensors', slug: 'sensors', children: [] }]
  }))
  await page.route('**/api/v1/store/cart/current/', route => route.fulfill({
    json: { id: 10, cart_token: 'product-journey-token', items: [] }
  }))
}

async function fulfillProducts(route: Route, products = [searchProduct], count = products.length) {
  await route.fulfill({ json: { count, results: products } })
}

test.beforeEach(async ({ page }) => {
  await mockSearchDependencies(page)
})

test('searches the catalogue and links to the canonical product slug', async ({ page }) => {
  let requestUrl = ''
  await page.route('**/api/v1/store/products/**', async route => {
    requestUrl = route.request().url()
    await fulfillProducts(route)
  })

  await page.goto('/search?q=sensor')

  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'BFG Wireless Sensor Hub' })).toBeVisible()
  await expect(page.locator('a[href="/product/sensor-hub"]').first()).toBeVisible()
  expect(new URL(requestUrl).searchParams.get('q')).toBe('sensor')
  expect(new URL(requestUrl).searchParams.get('page_size')).toBe('12')
})

test('maps category and price sorting controls to API query parameters', async ({ page }) => {
  const requests: URL[] = []
  await page.route('**/api/v1/store/products/**', async route => {
    requests.push(new URL(route.request().url()))
    await fulfillProducts(route)
  })

  await page.goto('/search?q=sensor&page=2')
  await page.getByRole('button', { name: 'Sensors' }).click()
  await expect(page).toHaveURL(url =>
    url.searchParams.get('category') === 'sensors' && !url.searchParams.has('page')
  )
  await page.locator('.sf-sort-select').selectOption('price-desc')

  await expect(page).toHaveURL(/q=sensor/)
  await expect(page).toHaveURL(/category=sensors/)
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(page).toHaveURL(url => !url.searchParams.has('page'))
  await expect.poll(() => requests.some(url =>
    url.searchParams.get('category') === 'sensors' && url.searchParams.get('sort') === 'price_desc'
  )).toBe(true)
})

test('requests and renders the next search results page', async ({ page }) => {
  let requestedPage = ''
  await page.route('**/api/v1/store/products/**', async route => {
    requestedPage = new URL(route.request().url()).searchParams.get('page') || ''
    await fulfillProducts(route, [searchProduct], 13)
  })

  await page.goto('/search?q=sensor')
  await page.getByRole('button', { name: 'Next' }).click()

  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect.poll(() => requestedPage).toBe('2')
})

test('shows a stable empty state for a search with no matches', async ({ page }) => {
  await page.route('**/api/v1/store/products/**', route => fulfillProducts(route, [], 0))

  await page.goto('/search?q=missing-part')

  await expect(page.getByText('No products found. Try different keywords or filters.')).toBeVisible()
  await expect(page.getByText('There are 0 products.')).toBeVisible()
})

test('adds the selected product variant and quantity to the guest cart', async ({ page }) => {
  let requestBody: unknown
  let requestToken: string | undefined
  await page.route('**/api/v1/store/products/sensor-hub/', route => route.continue())
  await page.route('**/api/v1/store/products/?category=sensors**', route => fulfillProducts(route, []))
  await page.route('**/api/v1/store/cart/add_item/', async route => {
    requestBody = route.request().postDataJSON()
    requestToken = route.request().headers()['x-bfg-cart-session']
    await route.fulfill({ json: {
      id: 10,
      cart_token: 'product-journey-token',
      items: [{
        item_id: 91,
        product_id: 301,
        product_name: 'Wireless Sensor Hub',
        price: '89.00',
        quantity: 2,
        variant_options: { size: 'Pro', color: 'Blue' }
      }]
    } })
  })

  await page.goto('/product/sensor-hub')
  await page.getByRole('button', { name: 'Pro' }).click()
  await page.getByRole('button', { name: 'Blue' }).click()
  await page.locator('.sf-quantity-input').fill('2')
  page.once('dialog', async dialog => {
    expect(dialog.message()).toBe('Product added to cart!')
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await expect.poll(() => requestBody).toEqual({ product: 301, variant: 702, quantity: 2 })
  expect(requestToken).toBe('product-journey-token')
})

test('registers an email notification for a sold-out product', async ({ page }) => {
  let notifyPayload: unknown
  await page.route('**/api/v1/store/products/sold-out-sensor/', route => route.continue())
  await page.route('**/api/v1/store/products/?category=sensors**', route => fulfillProducts(route, []))
  await page.route('**/api/v1/store/products/302/notify-me/', async route => {
    notifyPayload = route.request().postDataJSON()
    await route.fulfill({ json: { registered: true } })
  })

  await page.goto('/product/sold-out-sensor')
  await expect(page.getByRole('button', { name: 'Sold out' })).toBeDisabled()
  await page.getByPlaceholder('you@example.com').fill('alerts@example.com')
  await page.getByRole('button', { name: 'Notify me' }).click()

  await expect(page.getByText("Thanks — we'll email you when it's back.")).toBeVisible()
  expect(notifyPayload).toEqual({ email: 'alerts@example.com' })
})
