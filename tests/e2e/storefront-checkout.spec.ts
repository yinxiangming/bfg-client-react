import { expect, test, type Page } from '@playwright/test'

const cartItem = {
  item_id: 21,
  product_id: 201,
  product_name: 'Automation Starter Kit',
  price: '79.00',
  quantity: 1,
  image_url: '/media/starter-kit.jpg',
  variant_options: { size: 'Standard', color: 'Black' }
}

async function mockCheckoutDependencies(page: Page) {
  await page.route('**/api/v1/store/cart/current/', route => route.fulfill({
    json: { id: 9, cart_token: 'checkout-cart-token', items: [cartItem] }
  }))
  await page.route('**/api/v1/store/cart/preview/**', route => route.fulfill({
    json: { subtotal: '79.00', discount: '0.00', shipping_cost: '12.00', tax: '13.65', total: '104.65' }
  }))
  await page.route('**/api/v1/store/payments/gateways/', route => route.fulfill({ json: [
    {
      id: 4,
      name: 'Bank transfer',
      gateway_type: 'bank_transfer',
      display_info: { instructions: 'Use the order number as your payment reference.' },
      supported_fulfillment_methods: ['shipping']
    },
    {
      id: 5,
      name: 'Pay when collecting',
      gateway_type: 'pay_in_store',
      display_info: { instructions: 'Pay at the collection counter.' },
      supported_fulfillment_methods: ['pickup']
    }
  ] }))
  await page.route('**/api/v1/delivery/pickup-points/for_storefront/', route => route.fulfill({ json: [
    { id: 8, name: 'Auckland Depot', address: '10 Queen Street', fee: '0.00', instructions: 'Bring photo ID.' }
  ] }))
  await page.route('**/api/v1/delivery/freight-services/for_country/**', route => route.fulfill({ json: [
    {
      id: 6,
      carrier: 2,
      carrier_name: 'NZ Post',
      name: 'Tracked delivery',
      code: 'tracked',
      base_price: '12.00',
      price_per_kg: '0.00',
      estimated_days_min: 2,
      estimated_days_max: 3,
      is_active: true,
      order: 1
    }
  ] }))
  await page.route('**/api/v1/store/cart/default_store/', route => route.fulfill({
    json: { id: 3, name: 'Main Store', code: 'main' }
  }))
  await page.route('**/api/v1/geo/**', route => route.fulfill({ json: [] }))
}

async function fillGuestContact(page: Page, includeAddress = true) {
  await page.getByPlaceholder('Email or mobile phone number', { exact: true }).fill('guest@example.com')
  await page.getByPlaceholder('First name (optional)', { exact: true }).fill('Alice')
  await page.getByPlaceholder('Last name', { exact: true }).fill('Shopper')
  await page.getByPlaceholder('Phone', { exact: true }).fill('0211234567')
  if (includeAddress) {
    await page.getByPlaceholder('Address', { exact: true }).fill('10 Queen Street')
    await page.getByPlaceholder('City', { exact: true }).fill('Auckland')
    await page.getByPlaceholder('State', { exact: true }).fill('Auckland')
    await page.getByPlaceholder('ZIP code', { exact: true }).fill('1010')
  }
}

async function selectPaymentGateway(page: Page, name: string) {
  await page.getByRole('radio', { name }).check()
  await expect(page.getByRole('button', { name: 'Place order' })).toBeEnabled()
}

test.beforeEach(async ({ page }) => {
  await mockCheckoutDependencies(page)
})

test('places a guest delivery order with the selected freight service', async ({ page }) => {
  let checkoutPayload: Record<string, unknown> | undefined
  let checkoutToken: string | undefined
  await page.route('**/api/v1/store/cart/guest_checkout/', async route => {
    checkoutPayload = route.request().postDataJSON()
    checkoutToken = route.request().headers()['x-bfg-cart-session']
    await route.fulfill({ json: { id: 501, number: 'WEB-501' } })
  })
  await page.route('**/api/v1/store/cart/clear/', route => route.fulfill({ json: { items: [] } }))

  await page.goto('/checkout')
  await fillGuestContact(page)
  await selectPaymentGateway(page, 'Bank transfer')
  await page.getByRole('button', { name: 'Place order' }).click()

  await expect(page).toHaveURL(/\/checkout\/success\?method=bank_transfer$/)
  expect(checkoutToken).toBe('checkout-cart-token')
  expect(checkoutPayload).toMatchObject({
    store: 3,
    fulfillment_method: 'shipping',
    freight_service_id: 6,
    billing_same_as_shipping: true,
    email: 'guest@example.com',
    full_name: 'Alice Shopper',
    phone: '0211234567',
    shipping_address: {
      full_name: 'Alice Shopper',
      address_line1: '10 Queen Street',
      city: 'Auckland',
      postal_code: '1010',
      country: 'NZ'
    }
  })
})

test('places a pickup order without shipping address or freight fields', async ({ page }) => {
  let checkoutPayload: Record<string, unknown> | undefined
  await page.route('**/api/v1/store/cart/guest_checkout/', async route => {
    checkoutPayload = route.request().postDataJSON()
    await route.fulfill({ json: { id: 502, number: 'WEB-502' } })
  })
  await page.route('**/api/v1/store/cart/clear/', route => route.fulfill({ json: { items: [] } }))

  await page.goto('/checkout')
  await page.getByText('Pick up at Auckland Depot').click()
  await expect(page.getByRole('heading', { name: 'Who is collecting' })).toBeVisible()
  await expect(page.getByPlaceholder('Address', { exact: true })).toHaveCount(0)
  await fillGuestContact(page, false)
  await selectPaymentGateway(page, 'Pay when collecting')
  await page.getByRole('button', { name: 'Place order' }).click()

  await expect(page).toHaveURL(/\/checkout\/success\?method=pay_in_store$/)
  expect(checkoutPayload).toMatchObject({
    store: 3,
    fulfillment_method: 'pickup',
    pickup_point: 8,
    email: 'guest@example.com',
    full_name: 'Alice Shopper',
    phone: '0211234567'
  })
  expect(checkoutPayload).not.toHaveProperty('shipping_address')
  expect(checkoutPayload).not.toHaveProperty('freight_service_id')
  expect(checkoutPayload).not.toHaveProperty('shipping_method')
})

test('keeps the cart on checkout and surfaces an API stock error', async ({ page }) => {
  let checkoutRequests = 0
  await page.route('**/api/v1/store/cart/guest_checkout/', async route => {
    checkoutRequests += 1
    await route.fulfill({ status: 400, json: { detail: 'The requested quantity is no longer available.' } })
  })

  await page.goto('/checkout')
  await fillGuestContact(page)
  await selectPaymentGateway(page, 'Bank transfer')
  page.once('dialog', async dialog => {
    expect(dialog.message()).toBe('The requested quantity is no longer available.')
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Place order' }).click()

  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByText('Automation Starter Kit')).toBeVisible()
  expect(checkoutRequests).toBe(1)
})
