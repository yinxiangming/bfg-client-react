import { expect, test, type Page, type Route } from '@playwright/test'

type Address = {
  id: number
  full_name: string
  phone: string
  email: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

const existingAddress: Address = {
  id: 41,
  full_name: 'Alice Shopper',
  phone: '021 123 4567',
  email: 'alice@example.com',
  address_line1: '10 Queen Street',
  address_line2: '',
  city: 'Auckland',
  state: 'Auckland',
  postal_code: '1010',
  country: 'New Zealand',
  is_default: true
}

const user = {
  id: 7,
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Shopper',
  email: 'alice@example.com'
}

const stats = {
  wallet_balance: null,
  wallet_currency: null,
  order_counts: {},
  unread_messages_count: 0
}

async function seedSignedInSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bfg_jwt:workspace:http://127.0.0.1:8787', 'address-test-token')
  })
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    json
  })
}

async function mockAccountDependencies(page: Page, initialAddresses: Address[] = []) {
  let addresses = initialAddresses.map(address => ({ ...address }))
  const writes: Array<{ method: string; body?: Record<string, unknown> }> = []

  await page.route('**/api/v1/geo/**', route => fulfillJson(route, []))
  await page.route('**/api/v1/me/dashboard-stats/', route => fulfillJson(route, stats))
  await page.route('**/api/v1/me/', route => fulfillJson(route, user))
  await page.route('**/api/v1/me/addresses/**', async route => {
    const request = route.request()
    const method = request.method()
    const detailMatch = new URL(request.url()).pathname.match(/\/addresses\/(\d+)\/$/)

    expect(request.headers().authorization).toBe('Bearer address-test-token')

    if (method === 'GET' && !detailMatch) return fulfillJson(route, { results: addresses })

    if (method === 'POST') {
      const body = request.postDataJSON() as Omit<Address, 'id'>
      writes.push({ method, body })
      const created = { id: 42, ...body }
      addresses = [...addresses, created]
      return fulfillJson(route, created, 201)
    }

    if (method === 'PATCH' && detailMatch) {
      const body = request.postDataJSON() as Partial<Address>
      writes.push({ method, body })
      addresses = addresses.map(address => address.id === Number(detailMatch[1]) ? { ...address, ...body } : address)
      return fulfillJson(route, addresses.find(address => address.id === Number(detailMatch[1])))
    }

    if (method === 'DELETE' && detailMatch) {
      writes.push({ method })
      addresses = addresses.filter(address => address.id !== Number(detailMatch[1]))
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' })
    }

    return fulfillJson(route, { detail: `Unexpected ${method}` }, 500)
  })

  return writes
}

test.beforeEach(async ({ page }) => {
  await seedSignedInSession(page)
})

test('creates a default address with profile details and blocks incomplete submissions', async ({ page }) => {
  const writes = await mockAccountDependencies(page)

  await page.goto('/account/addresses')
  await expect(page.getByText('No addresses found')).toBeVisible()
  await page.getByRole('button', { name: 'Add Address' }).first().click()

  const dialog = page.getByRole('dialog', { name: 'Add Address' })
  await expect(dialog.getByLabel('Full Name')).toHaveValue('Alice Shopper')
  await expect(dialog.getByLabel('Email')).toHaveValue('alice@example.com')
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled()

  await dialog.getByLabel('Phone').fill('021 987 6543')
  await dialog.getByLabel('Address Line 1').fill('25 Victoria Street')
  await dialog.getByLabel('City').fill('Wellington')
  await dialog.getByLabel('Postal Code').fill('6011')
  await dialog.getByLabel('Country').fill('New Zealand')
  await dialog.getByRole('checkbox', { name: 'Set as default address' }).check()
  await dialog.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Address saved successfully')).toBeVisible()
  await expect(page.getByText('25 Victoria Street')).toBeVisible()
  expect(writes).toEqual([{ method: 'POST', body: {
    full_name: 'Alice Shopper',
    phone: '021 987 6543',
    email: 'alice@example.com',
    address_line1: '25 Victoria Street',
    address_line2: '',
    city: 'Wellington',
    state: '',
    postal_code: '6011',
    country: 'New Zealand',
    is_default: true
  } }])
})

test('edits an existing address and refreshes the rendered card', async ({ page }) => {
  const writes = await mockAccountDependencies(page, [existingAddress])

  await page.goto('/account/addresses')
  await expect(page.getByText('10 Queen Street')).toBeVisible()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Edit Address' })
  await dialog.getByLabel('Address Line 1').fill('88 Albert Street')
  await dialog.getByLabel('Postal Code').fill('1011')
  await dialog.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Address saved successfully')).toBeVisible()
  await expect(page.getByText('88 Albert Street')).toBeVisible()
  expect(writes).toHaveLength(1)
  expect(writes[0]).toMatchObject({
    method: 'PATCH',
    body: { address_line1: '88 Albert Street', postal_code: '1011', is_default: true }
  })
})

test('deletes an address after confirmation and returns to the empty state', async ({ page }) => {
  const writes = await mockAccountDependencies(page, [existingAddress])

  await page.goto('/account/addresses')
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete Address' })
  await expect(dialog.getByText('Are you sure you want to delete this address?')).toBeVisible()
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

  await expect(page.getByText('Address deleted successfully')).toBeVisible()
  await expect(page.getByText('No addresses found')).toBeVisible()
  expect(writes).toEqual([{ method: 'DELETE' }])
})

test('keeps the edit dialog open and reports a rejected save', async ({ page }) => {
  await mockAccountDependencies(page, [existingAddress])
  await page.route('**/api/v1/me/addresses/41/', route =>
    fulfillJson(route, { detail: 'Address could not be saved.' }, 400)
  )

  await page.goto('/account/addresses')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit Address' })
  await dialog.getByLabel('City').fill('Hamilton')
  await dialog.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Address could not be saved.', { exact: true }).first()).toBeVisible()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('City')).toHaveValue('Hamilton')
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled()
})
