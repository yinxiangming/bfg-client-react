import { expect, test } from '@playwright/test'

test('shows an error without exchanging when the SSO code is missing', async ({ page }) => {
  let exchangeRequests = 0

  await page.route('**/api/v1/platform/auth/sso/exchange/', route => {
    exchangeRequests += 1
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/auth/sso')

  await expect(page.getByRole('heading', { name: 'SSO Login Failed' })).toBeVisible()
  await expect(page.getByText('Missing SSO code in URL')).toBeVisible()
  expect(exchangeRequests).toBe(0)
})

test('displays the API error when the SSO code is rejected', async ({ page }) => {
  await page.route('**/api/v1/platform/auth/sso/exchange/', route =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'This SSO code has expired.' })
    })
  )

  await page.goto('/auth/sso?code=expired-code')

  await expect(page.getByRole('heading', { name: 'SSO Login Failed' })).toBeVisible()
  await expect(page.getByText('This SSO code has expired.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to login' })).toHaveAttribute('href', '/auth/login')
})

test('exchanges the SSO code, stores workspace credentials, and follows the server redirect', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined

  await page.route('**/api/v1/platform/auth/sso/exchange/', async route => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access: 'workspace-access-token',
        refresh: 'workspace-refresh-token',
        workspace_url: 'https://workspace.example.test/',
        workspace: { id: 42, uuid: 'workspace-uuid', name: 'Demo Workspace', slug: 'demo' },
        next: '/unknown',
        embedded: false
      })
    })
  })

  // The exchange response controls the landing page, not a caller-supplied URL parameter.
  await page.goto('/auth/sso?code=one-time-code&next=%2Faccount')

  await expect(page).toHaveURL(/\/unknown$/)
  expect(requestBody).toEqual({ code: 'one-time-code' })

  const storage = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  expect(storage).toMatchObject({
    workspace_api_url: 'https://workspace.example.test',
    workspace_id: '42',
    'bfg_jwt:workspace:https://workspace.example.test': 'workspace-access-token',
    'bfg_refresh:workspace:https://workspace.example.test': 'workspace-refresh-token'
  })
})
