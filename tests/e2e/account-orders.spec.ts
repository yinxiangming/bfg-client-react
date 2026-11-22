import { expect, test, type Page, type Route } from '@playwright/test'

type Order = {
  id: number
  order_number: string
  status: string
  payment_status: string
  fulfillment_method: 'shipping' | 'pickup'
  pickup_code?: string
  pickup_point?: Record<string, unknown> | null
  consignments?: Array<{ id: number; tracking_number: string; carrier_name?: string }>
  amounts: Record<string, string>
  addresses?: Record<string, Record<string, string> | null>
  items: Array<Record<string, unknown>>
  timestamps: Record<string, string | null>
  activities?: Array<Record<string, unknown>>
  freight_service?: Record<string, unknown> | null
  customer_note?: string
}

type MockOptions = {
  orders?: Order[]
  total?: number
  stats?: Record<string, number>
  payments?: Array<Record<string, unknown>>
  invoices?: Array<Record<string, unknown>>
  cancelFailures?: number
}

const apiOrigin = 'http://127.0.0.1:8787'
const authToken = 'orders-test-token'

const user = {
  id: 7,
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Shopper',
  email: 'alice@example.com'
}

const shippingAddress = {
  full_name: 'Alice Shopper',
  phone: '021 123 4567',
  address_line1: '10 Queen Street',
  city: 'Auckland',
  state: 'Auckland',
  postal_code: '1010',
  country: 'New Zealand'
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const id = overrides.id ?? 101

  return {
    id,
    order_number: `WEB-${id}`,
    status: 'processing',
    payment_status: 'paid',
    fulfillment_method: 'shipping',
    amounts: {
      subtotal: '89.00',
      shipping_cost: '10.00',
      discount: '5.00',
      tax: '14.10',
      total: '108.10'
    },
    addresses: { shipping: shippingAddress, billing: shippingAddress },
    items: [{
      id: id * 10,
      product_name: 'Wireless Sensor Hub',
      variant_name: 'Black / Standard',
      quantity: 2,
      price: '44.50',
      subtotal: '89.00',
      image_url: null
    }],
    timestamps: {
      created_at: '2026-11-18T01:30:00Z',
      updated_at: '2026-11-18T03:30:00Z',
      paid_at: '2026-11-18T01:35:00Z',
      shipped_at: null,
      delivered_at: null
    },
    activities: [{
      id: id * 100,
      title: 'Order confirmed',
      description: 'Payment received and stock reserved.',
      time: '2026-11-18T01:35:00Z'
    }],
    freight_service: {
      id: 3,
      name: 'Tracked delivery',
      carrier_name: 'NZ Post',
      estimated_days_min: 2,
      estimated_days_max: 3
    },
    ...overrides
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://127.0.0.1:3000',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Forwarded-Host, Accept-Language',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', headers: corsHeaders, json: body })
}

async function seedSession(page: Page) {
  await page.addInitScript(({ key, token }) => localStorage.setItem(key, token), {
    key: `bfg_jwt:workspace:${apiOrigin}`,
    token: authToken
  })
}

async function mockAccountApi(page: Page, options: MockOptions = {}) {
  let orders = (options.orders ?? []).map(order => structuredClone(order))
  let cancelFailures = options.cancelFailures ?? 0
  let statsRequests = 0
  const orderQueries: Array<Record<string, string>> = []
  const cancellations: Array<{ id: number; reason: string }> = []

  await page.route('**/api/v1/me/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url

    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders, body: '' })
    }

    expect(request.headers().authorization).toBe(`Bearer ${authToken}`)

    if (pathname === '/api/v1/me/') return json(route, user)

    if (pathname === '/api/v1/me/dashboard-stats/') {
      statsRequests += 1
      return json(route, {
        wallet_balance: null,
        wallet_currency: null,
        order_counts: options.stats ?? {},
        unread_messages_count: 0
      })
    }

    if (pathname === '/api/v1/me/orders/' && request.method() === 'GET') {
      const query = Object.fromEntries(url.searchParams)
      orderQueries.push(query)
      const filtered = query.status ? orders.filter(order => order.status === query.status) : orders
      const pageNumber = Number(query.page ?? '1')
      const pageSize = Number(query.page_size ?? '10')
      const start = (pageNumber - 1) * pageSize

      return json(route, {
        count: query.status ? filtered.length : options.total ?? filtered.length,
        results: filtered.slice(start, start + pageSize)
      })
    }

    const cancelMatch = pathname.match(/^\/api\/v1\/me\/orders\/(\d+)\/cancel\/$/)
    if (cancelMatch && request.method() === 'POST') {
      const id = Number(cancelMatch[1])
      const body = request.postDataJSON() as { reason?: string }

      cancellations.push({ id, reason: body.reason ?? '' })
      if (cancelFailures > 0) {
        cancelFailures -= 1
        return json(route, { detail: 'This order could not be cancelled yet.' }, 409)
      }

      orders = orders.map(order => order.id === id
        ? { ...order, status: 'cancelled', timestamps: { ...order.timestamps, updated_at: '2026-11-23T02:00:00Z' } }
        : order)

      return json(route, orders.find(order => order.id === id))
    }

    const detailMatch = pathname.match(/^\/api\/v1\/me\/orders\/(\d+)\/$/)
    if (detailMatch && request.method() === 'GET') {
      const order = orders.find(candidate => candidate.id === Number(detailMatch[1]))
      return order ? json(route, order) : json(route, { detail: 'Order not found' }, 404)
    }

    if (pathname === '/api/v1/me/payments/') return json(route, { results: options.payments ?? [] })
    if (pathname === '/api/v1/me/invoices/') return json(route, { results: options.invoices ?? [] })

    const invoiceDownload = pathname.match(/^\/api\/v1\/me\/invoices\/(\d+)\/download\/$/)
    if (invoiceDownload) {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: corsHeaders,
        body: '%PDF-1.4 mocked invoice'
      })
    }

    return json(route, { detail: `No mock configured for ${request.method()} ${pathname}` }, 500)
  })

  return {
    cancellations,
    orderQueries,
    statsRequestCount: () => statsRequests
  }
}

test.beforeEach(async ({ page }) => {
  await seedSession(page)
})

test('shows the correct state and next action for each order stage', async ({ page }) => {
  const orders = [
    makeOrder({ id: 101, status: 'pending', payment_status: 'pending' }),
    makeOrder({
      id: 102,
      status: 'shipped',
      consignments: [{ id: 1, tracking_number: 'NZP-102', carrier_name: 'NZ Post' }]
    }),
    makeOrder({ id: 103, status: 'ready_for_pickup', fulfillment_method: 'pickup', pickup_code: 'PICK-103' }),
    makeOrder({ id: 104, status: 'delivered' }),
    makeOrder({ id: 105, status: 'cancelled' })
  ]

  await mockAccountApi(page, {
    orders,
    stats: { pending: 1, shipped: 1, ready_for_pickup: 1, delivered: 1, cancelled: 1 }
  })
  await page.goto('/account/orders')

  const pending = page.getByRole('row').filter({ hasText: 'WEB-101' })
  await expect(pending.getByText('Awaiting payment')).toBeVisible()
  await expect(pending.getByRole('button', { name: 'Pay now' })).toBeVisible()

  const shipped = page.getByRole('row').filter({ hasText: 'WEB-102' })
  await expect(shipped.getByText('Shipped')).toBeVisible()
  await expect(shipped.getByRole('link', { name: 'Track parcel' })).toHaveAttribute('href', '/account/orders/102#tracking')

  const pickup = page.getByRole('row').filter({ hasText: 'WEB-103' })
  await expect(pickup.getByText('Ready for pickup')).toBeVisible()
  await expect(pickup.getByRole('link', { name: 'Pickup code' })).toHaveAttribute('href', '/account/orders/103#pickup')

  const delivered = page.getByRole('row').filter({ hasText: 'WEB-104' })
  await expect(delivered.getByText('Delivered')).toBeVisible()
  await expect(delivered.getByRole('link', { name: 'Request a return' })).toHaveAttribute('href', '/account/returns?order=104')

  const cancelled = page.getByRole('row').filter({ hasText: 'WEB-105' })
  await expect(cancelled.getByText('Cancelled')).toBeVisible()
  await expect(cancelled.getByRole('link', { name: 'View', exact: true })).toHaveAttribute('href', '/account/orders/105')
})

test('keeps status and pagination in the URL and sends matching API queries', async ({ page }) => {
  const orders = Array.from({ length: 23 }, (_, index) => makeOrder({
    id: 200 + index,
    status: index === 22 ? 'shipped' : 'processing'
  }))
  const api = await mockAccountApi(page, { orders, total: 23, stats: { processing: 22, shipped: 1 } })

  await page.goto('/account/orders')
  await expect(page.getByText('Showing 1–10 of 23')).toBeVisible()
  await page.getByRole('button', { name: '3', exact: true }).click()
  await expect(page).toHaveURL(/\/account\/orders\?page=3$/)
  await expect(page.getByText('Showing 21–23 of 23')).toBeVisible()
  await expect(page.getByText('WEB-222')).toBeVisible()

  await page.getByRole('tab', { name: /Shipped/ }).click()
  await expect(page).toHaveURL(/\/account\/orders\?status=shipped$/)
  await expect(page.getByText('WEB-222')).toBeVisible()
  expect(api.orderQueries).toEqual(expect.arrayContaining([
    { page: '3', page_size: '10' },
    { status: 'shipped', page: '1', page_size: '10' }
  ]))
})

test('returns from an empty status tab to the complete order list', async ({ page }) => {
  await mockAccountApi(page, {
    orders: [makeOrder({ id: 301, status: 'processing' })],
    stats: { processing: 1, cancelled: 2 }
  })

  await page.goto('/account/orders?status=cancelled')
  await expect(page.getByText('No orders with this status')).toBeVisible()
  await page.getByRole('button', { name: 'Show all orders' }).click()

  await expect(page).toHaveURL(/\/account\/orders$/)
  await expect(page.getByText('WEB-301')).toBeVisible()
})

test('preserves the cancellation reason after a rejection and supports a successful retry', async ({ page }) => {
  const api = await mockAccountApi(page, {
    orders: [makeOrder({ id: 401, status: 'processing' })],
    stats: { processing: 1 },
    cancelFailures: 1
  })

  await page.goto('/account/orders')
  const row = page.getByRole('row').filter({ hasText: 'WEB-401' })
  await row.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: 'Cancel order' }).click()

  const dialog = page.getByRole('dialog', { name: 'Cancel Order' })
  await dialog.getByLabel('Reason').fill('  Duplicate order  ')
  await dialog.getByRole('button', { name: 'Cancel Order' }).click()

  await expect(page.getByText('This order could not be cancelled yet.')).toBeVisible()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Reason')).toHaveValue('  Duplicate order  ')

  await dialog.getByRole('button', { name: 'Cancel Order' }).click()
  await expect(dialog).toBeHidden()
  await expect(row.getByText('Cancelled')).toBeVisible()
  expect(api.cancellations).toEqual([
    { id: 401, reason: 'Duplicate order' },
    { id: 401, reason: 'Duplicate order' }
  ])
  expect(api.statsRequestCount()).toBeGreaterThan(1)
})

test('renders shipping progress, financial records, addresses and invoice download on order detail', async ({ page }) => {
  const order = makeOrder({
    id: 501,
    status: 'shipped',
    consignments: [{ id: 51, tracking_number: 'NZP-TRACK-501', carrier_name: 'NZ Post' }],
    timestamps: {
      created_at: '2026-11-18T01:30:00Z',
      updated_at: '2026-11-20T04:00:00Z',
      paid_at: '2026-11-18T01:35:00Z',
      shipped_at: '2026-11-20T04:00:00Z',
      delivered_at: null
    },
    customer_note: 'Leave the parcel at reception.'
  })
  await mockAccountApi(page, {
    orders: [order],
    stats: { shipped: 1 },
    payments: [{
      id: 71,
      payment_method_display: 'VISA •••• 4242',
      amount: '108.10',
      currency_code: 'NZD',
      status: 'completed',
      completed_at: '2026-11-18T01:35:00Z'
    }],
    invoices: [{ id: 81, invoice_number: 'INV-501', issue_date: '2026-11-18', status: 'paid' }]
  })

  await page.goto('/account/orders/501#tracking')
  await expect(page.getByRole('heading', { name: 'WEB-501' })).toBeVisible()
  await expect(page.getByText('NZ Post tracking number')).toBeVisible()
  await expect(page.getByText('NZP-TRACK-501')).toBeVisible()
  await expect(page.getByText('Wireless Sensor Hub')).toBeVisible()
  await expect(page.getByText('Payment received and stock reserved.')).toBeVisible()
  await expect(page.getByText('Leave the parcel at reception.')).toBeVisible()
  await expect(page.getByText('10 Queen Street')).toBeVisible()
  await expect(page.getByText('VISA •••• 4242')).toBeVisible()
  await expect(page.getByText(/INV-501/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Report a delivery problem' })).toHaveAttribute(
    'href',
    '/account/support?order=WEB-501&topic=delivery'
  )

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('INV-501.pdf')
})

test('shows pickup instructions and code without a delivery address', async ({ page }) => {
  const order = makeOrder({
    id: 601,
    status: 'ready_for_pickup',
    fulfillment_method: 'pickup',
    pickup_code: 'PICK-601',
    pickup_point: {
      id: 9,
      name: 'Auckland Depot',
      address: '20 Customs Street, Auckland',
      phone: '09 555 0101',
      instructions: 'Bring photo ID to the collection counter.'
    },
    addresses: { shipping: null, billing: null },
    freight_service: null
  })
  await mockAccountApi(page, { orders: [order], stats: { ready_for_pickup: 1 } })

  await page.goto('/account/orders/601#pickup')
  await expect(page.getByRole('heading', { name: 'WEB-601' })).toBeVisible()
  await expect(page.getByText('PICK-601')).toBeVisible()
  await expect(page.getByText('Auckland Depot')).toBeVisible()
  await expect(page.getByText('20 Customs Street, Auckland')).toBeVisible()
  await expect(page.getByText('Bring photo ID to the collection counter.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Delivery address' })).toHaveCount(0)
  await expect(page.getByText('Ready for pickup').first()).toBeVisible()
})

test('keeps the detail cancellation dialog open after failure and refreshes after retry', async ({ page }) => {
  const api = await mockAccountApi(page, {
    orders: [makeOrder({ id: 701, status: 'processing' })],
    stats: { processing: 1 },
    cancelFailures: 1
  })

  await page.goto('/account/orders/701')
  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: 'Cancel order' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cancel Order' })
  await dialog.getByLabel('Reason').fill('Changed my mind')
  await dialog.getByRole('button', { name: 'Cancel Order' }).click()

  await expect(page.getByText('This order could not be cancelled yet.')).toBeVisible()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Reason')).toHaveValue('Changed my mind')

  await dialog.getByRole('button', { name: 'Cancel Order' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('This order was cancelled')).toBeVisible()
  expect(api.cancellations).toHaveLength(2)
  expect(api.statsRequestCount()).toBeGreaterThan(1)
})
