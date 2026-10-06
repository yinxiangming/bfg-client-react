import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/providers/', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ providers: [] }) })
  )
})

test('renders the login page and account recovery link', async ({ page }) => {
  await page.goto('/auth/login')

  await expect(page.getByRole('heading', { name: /^Welcome/ })).toBeVisible()
  await expect(page.getByPlaceholder('Enter your email or username')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
    'href',
    '/auth/forgot-password'
  )
})

test('submits email credentials and displays the API error', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined

  await page.route('**/api/v1/auth/token/', async route => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Invalid email or password' })
    })
  })

  await page.goto('/auth/login')
  await page.getByPlaceholder('Enter your email or username').fill('alice@example.com')
  await page.locator('input[type="password"]').fill('incorrect-password')
  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page.getByText('Invalid email or password')).toBeVisible()
  expect(requestBody).toEqual({ email: 'alice@example.com', password: 'incorrect-password' })
})

test('redirects an unauthenticated admin visitor to login', async ({ page }) => {
  await page.goto('/admin')

  await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fadmin/)
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
})

test('prevents registration when the passwords do not match', async ({ page }) => {
  let registrationRequests = 0

  await page.route('**/api/v1/**/register/', route => {
    registrationRequests += 1
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/auth/register')
  await page.getByPlaceholder('Enter your email').fill('alice@example.com')
  await page.locator('input[type="password"]').nth(0).fill('correct-password')
  await page.locator('input[type="password"]').nth(1).fill('different-password')
  await page.getByRole('button', { name: 'Sign Up' }).click()

  await expect(page.getByText('Passwords do not match')).toBeVisible()
  expect(registrationRequests).toBe(0)
})

test('displays a registration API validation error', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined

  await page.route('**/api/v1/store/auth/register/', async route => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ email: ['A user with this email already exists.'] })
    })
  })

  await page.goto('/auth/register')
  await page.getByPlaceholder('Enter your email').fill('alice@example.com')
  await page.locator('input[type="password"]').nth(0).fill('valid-password')
  await page.locator('input[type="password"]').nth(1).fill('valid-password')
  await page.getByRole('button', { name: 'Sign Up' }).click()

  await expect(page.getByText('A user with this email already exists.')).toBeVisible()
  expect(requestBody).toEqual({
    email: 'alice@example.com',
    password: 'valid-password',
    password_confirm: 'valid-password'
  })
})
