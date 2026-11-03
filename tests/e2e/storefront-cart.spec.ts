import { expect, test, type Page, type Route } from '@playwright/test'

const item = (quantity = 2) => ({
  item_id: 11,
  product_id: 101,
  product_name: 'USB-C Sensor Kit',
  product: { id: 101, name: 'USB-C Sensor Kit', brand: 'BFG' },
  price: '24.50',
  image_url: '/media/sensor-kit.jpg',
  variant_options: { size: 'Standard', color: 'Blue' },
  quantity
})

async function mockCart(page: Page, quantity = 2, token = 'guest-cart-token') {
  await page.route('**/api/v1/store/cart/current/', route => route.fulfill({
    json: { id: 7, cart_token: token, items: [item(quantity)] }
  }))
  await page.route('**/api/v1/store/cart/preview/**', route => route.fulfill({
    json: { subtotal: '49.00', discount: '0.00', shipping_cost: '8.00', tax: '7.35', total: '64.35' }
  }))
}

test('loads a guest cart, persists its signed token, and uses the API price preview', async ({ page }) => {
  let previewHeader: string | undefined
  await page.route('**/api/v1/store/cart/current/', route => route.fulfill({
    json: { id: 7, cart_token: 'guest-cart-token', items: [item()] }
  }))
  await page.route('**/api/v1/store/cart/preview/**', route => {
    previewHeader = route.request().headers()['x-bfg-cart-session']
    return route.fulfill({
      json: { subtotal: '49.00', discount: '0.00', shipping_cost: '8.00', tax: '7.35', total: '64.35' }
    })
  })

  await page.goto('/cart')

  await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'BFG USB-C Sensor Kit' })).toBeVisible()
  await expect(page.locator('.sf-cart-summary').getByText('NZ$49.00', { exact: true })).toBeVisible()
  await expect.poll(() => previewHeader).toBe('guest-cart-token')
  expect(await page.evaluate(() => Object.entries(localStorage)
    .find(([key]) => key.startsWith('bfg_guest_cart_token:'))?.[1])).toBe('guest-cart-token')
})

test('updates item quantity using the signed guest cart session', async ({ page }) => {
  await mockCart(page)
  let requestBody: unknown
  let requestToken: string | undefined
  await page.route('**/api/v1/store/cart/update_item/', async route => {
    requestBody = route.request().postDataJSON()
    requestToken = route.request().headers()['x-bfg-cart-session']
    await route.fulfill({ json: { id: 7, cart_token: 'guest-cart-token', items: [item(3)] } })
  })

  await page.goto('/cart')
  await page.locator('.sf-quantity-btn').last().click()

  await expect(page.locator('.sf-quantity-input')).toHaveValue('3')
  expect(requestBody).toEqual({ item_id: 11, quantity: 3 })
  expect(requestToken).toBe('guest-cart-token')
})

test('removes the final cart item and shows the empty state', async ({ page }) => {
  await mockCart(page)
  let requestBody: unknown
  await page.route('**/api/v1/store/cart/remove_item/', async route => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({ json: { id: 7, cart_token: 'guest-cart-token', items: [] } })
  })

  await page.goto('/cart')
  await page.getByTitle('Remove item').click()

  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible()
  expect(requestBody).toEqual({ item_id: 11 })
})

test('recovers from an expired guest cart token and stores the replacement', async ({ page }) => {
  let currentRequests = 0
  await page.route('**/api/v1/store/cart/current/', async route => {
    currentRequests += 1
    const token = route.request().headers()['x-bfg-cart-session']
    if (token === 'expired-token') {
      await route.fulfill({ status: 400, json: { detail: 'Expired cart', cart_token: true } })
      return
    }
    await route.fulfill({ json: {
      id: 7,
      cart_token: currentRequests === 1 ? 'expired-token' : 'replacement-token',
      items: [item()]
    } })
  })
  await page.route('**/api/v1/store/cart/preview/**', route => route.fulfill({
    json: { subtotal: '49.00', discount: '0.00', shipping_cost: '8.00', tax: '7.35', total: '64.35' }
  }))

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'BFG USB-C Sensor Kit' })).toBeVisible()
  await page.reload()

  await expect.poll(() => currentRequests).toBe(3)
  expect(await page.evaluate(() => Object.entries(localStorage)
    .find(([key]) => key.startsWith('bfg_guest_cart_token:'))?.[1])).toBe('replacement-token')
})
