import { expect, test } from '@playwright/test'

test('preserves an explicit locale when the site uses a single language', async ({page, context, baseURL}) => {
  await context.addCookies([{name: 'NEXT_LOCALE', value: 'zh-hans', url: baseURL!}])
  await page.route('**/api/v1/auth/providers/', route => route.fulfill({json: {providers: []}}))
  await page.route('**/api/v1/settings/storefront/**', route => route.fulfill({json: {
    site_name: 'Example', theme: 'store', default_language: 'en', languages: ['en'],
  }}))
  await page.goto('/auth/login')
  await expect(page.locator('.auth-form')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', /^zh-hans$/i)
  await page.reload()
  await expect(page.locator('.auth-form')).toBeVisible()
  expect((await context.cookies()).find(cookie => cookie.name === 'NEXT_LOCALE')?.value).toBe('zh-hans')
  await page.goto('/auth/forgot-password')
  await expect(page.locator('html')).toHaveAttribute('lang', /^zh-hans$/i)
  expect((await context.cookies()).find(cookie => cookie.name === 'NEXT_LOCALE')?.value).toBe('zh-hans')
})
