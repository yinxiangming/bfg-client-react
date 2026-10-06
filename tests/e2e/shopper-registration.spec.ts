import { expect, test, type Page } from '@playwright/test'

async function fillPasswords(page: Page, password = 'shopper-password') {
  await page.locator('input[type="password"]').nth(0).fill(password)
  await page.locator('input[type="password"]').nth(1).fill(password)
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/providers/', route => route.fulfill({ json: { providers: [] } }))
})

test('registers a shopper, saves the session, and follows the requested redirect', async ({ page }) => {
  let merchantRequests = 0
  await page.route('**/api/v1/auth/register/', route => {
    merchantRequests += 1
    return route.fulfill({ status: 400, json: { detail: 'Wrong registration endpoint' } })
  })
  await page.route('**/api/v1/store/auth/register/', async route => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toEqual({
      email: 'shopper@example.com', password: 'shopper-password', password_confirm: 'shopper-password'
    })
    await route.fulfill({ status: 201, json: {
      user: { id: 42, email: 'shopper@example.com' }, customer: { id: 7 },
      access: 'shopper-access', refresh: 'shopper-refresh'
    } })
  })

  await page.goto('/auth/register?redirect=%2Funknown')
  await page.getByPlaceholder('Enter your email').fill('shopper@example.com')
  await fillPasswords(page)
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page).toHaveURL(/\/unknown$/)
  expect(merchantRequests).toBe(0)
  expect(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))).toMatchObject({
    'bfg_jwt:workspace:http://127.0.0.1:8787': 'shopper-access',
    'bfg_refresh:workspace:http://127.0.0.1:8787': 'shopper-refresh'
  })
})

test('blocks a matching short password before either registration endpoint is called', async ({ page }) => {
  let requests = 0
  await page.route('**/api/v1/**/register/', route => {
    requests += 1
    return route.fulfill({ status: 400, json: { detail: 'Unexpected registration request' } })
  })
  await page.goto('/auth/register')
  await page.getByPlaceholder('Enter your email').fill('shopper@example.com')
  await fillPasswords(page, 'short')
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.locator('.auth-error')).toHaveText('Password must be at least 8 characters long')
  expect(requests).toBe(0)
  await expect(page).toHaveURL(/\/auth\/register$/)
})

test('keeps an invitation email fixed and sends invitation parameters to merchant registration', async ({ page }) => {
  let shopperRequests = 0
  await page.route('**/api/v1/store/auth/register/', route => {
    shopperRequests += 1
    return route.fulfill({ status: 400, json: { detail: 'Wrong registration endpoint' } })
  })
  await page.route('**/api/v1/auth/register/', async route => {
    expect(route.request().postDataJSON()).toEqual({
      email: 'staff@example.com', password: 'shopper-password', password_confirm: 'shopper-password',
      invite_token: 'invitation-token', invite_uuid: 'invitation-uuid'
    })
    await route.fulfill({ status: 400, json: { detail: 'Invitation expired' } })
  })
  await page.goto('/auth/register?invite_token=invitation-token&invite_uuid=invitation-uuid&email=staff%40example.com')
  const email = page.getByPlaceholder('Enter your email')
  await expect(email).toHaveValue('staff@example.com')
  await expect(email).toBeDisabled()
  await fillPasswords(page)
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByText('Invitation expired', { exact: true })).toBeVisible()
  expect(shopperRequests).toBe(0)
})
