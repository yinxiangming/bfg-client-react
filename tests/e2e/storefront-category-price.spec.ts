import { expect, test } from '@playwright/test'

const category = '/category/price-fixtures'

test('changes category ranges before counting, sorting and pagination', async ({ page }) => {
  await page.goto(`${category}?sort=price-asc&page=2`)

  const sort = page.locator('.sf-sort-select')
  const prices = page.locator('.sf-product-card .sf-price-current')
  const highPrice = page.getByRole('checkbox', { name: '$100+' })
  const midPrice = page.getByRole('checkbox', { name: '$50 - $100' })
  const lowPrice = page.getByRole('checkbox', { name: '$0 - $50' })
  const dollars = (values: number[]) => values.map(value => new Intl.NumberFormat('en', {
    style: 'currency', currency: 'NZD'
  }).format(value))

  await expect(sort).toHaveValue('price-asc')
  await expect(page.locator('.sf-filter-checkbox:checked')).toHaveCount(0)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByText('There are 20 products.')).toBeVisible()

  await highPrice.check()
  await expect(page).toHaveURL(new RegExp(`${category}\\?price=100-plus&sort=price-asc$`))
  await expect(highPrice).toBeChecked()
  await expect(sort).toHaveValue('price-asc')
  await expect(page.getByText('There are 13 products.')).toBeVisible()
  await expect(page.getByText('Page 1 of 2')).toBeVisible()
  await expect(prices).toHaveText(dollars([100, 101, 109, 115, 123, 136, 140, 158, 166, 179, 188, 199]))

  await page.getByRole('link', { name: 'Next' }).click()
  await expect(page).toHaveURL(/price=100-plus&sort=price-asc&page=2$/)
  await expect(highPrice).toBeChecked()
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(prices).toHaveText(dollars([349]))

  await page.reload()
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex, follow/)
  await expect(highPrice).toBeChecked()
  await expect(prices).toHaveText(dollars([349]))

  await midPrice.check()
  await expect(page).toHaveURL(/price=50-100&sort=price-asc$/)
  await expect(highPrice).not.toBeChecked()
  await expect(page.getByText('There are 5 products.')).toBeVisible()
  await expect(prices).toHaveText(dollars([50, 50.01, 69, 99.99, 100]))
  await expect(page.getByRole('link', { name: 'Next' })).toHaveCount(0)

  await lowPrice.check()
  await expect(page).toHaveURL(/price=0-50&sort=price-asc$/)
  await expect(midPrice).not.toBeChecked()
  await expect(page.getByText('There are 4 products.')).toBeVisible()
  await expect(prices).toHaveText(dollars([0, 7.90, 49.99, 50]))

  await lowPrice.uncheck()
  await expect(page).toHaveURL(new RegExp(`${category}\\?sort=price-asc$`))
  await expect(page.getByText('There are 20 products.')).toBeVisible()
  await expect(sort).toHaveValue('price-asc')
  await expect(page.locator('.sf-filter-checkbox:checked')).toHaveCount(0)

  await page.goBack()
  await expect(lowPrice).toBeChecked()
  await expect(prices).toHaveText(dollars([0, 7.90, 49.99, 50]))
})

test('price filters work in the mobile drawer and survive a sort change', async ({ page }) => {
  const viewport = { width: 390, height: 844 }
  await page.setViewportSize(viewport)
  await page.goto(category)
  await page.getByRole('button', { name: 'Toggle filters' }).click()
  await page.getByRole('checkbox', { name: '$100+' }).check()
  await expect(page.getByRole('checkbox', { name: '$100+' })).toBeChecked()
  await expect(page).toHaveURL(/price=100-plus$/)
  // The toolbar intentionally hides the count at mobile widths.
  await expect(page.locator('.sf-products-count')).toHaveText('There are 13 products.')

  const backdrop = page.locator('.sf-filter-overlay')
  // Tap the uncovered right edge of the backdrop, beyond the drawer.
  await backdrop.click({ position: { x: viewport.width - 16, y: viewport.height / 2 } })
  await expect(backdrop).toHaveCount(0)
  const prices = page.locator('.sf-product-card .sf-price-current')
  await expect(prices.first()).toBeVisible()
  await expect(prices).toHaveCount(12)
  await expect(prices.first()).toHaveText(/349\.00$/)

  await page.locator('.sf-sort-select').selectOption('price-asc')
  await expect(page).toHaveURL(/price=100-plus&sort=price-asc$/)
  await expect(prices.first()).toHaveText(/100\.00$/)
})

test('shows zero matches and clears the range without leaving the category', async ({ page }) => {
  await page.goto('/category/premium-fixtures')
  const lowPrice = page.getByRole('checkbox', { name: '$0 - $50' })
  await lowPrice.check()
  await expect(page.getByText('There are 0 products.')).toBeVisible()
  await expect(page.getByText('No products found in this category.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Next' })).toHaveCount(0)
  await lowPrice.uncheck()
  await expect(page).toHaveURL(/premium-fixtures$/)
  await expect(page.getByText('There are 13 products.')).toBeVisible()
})
