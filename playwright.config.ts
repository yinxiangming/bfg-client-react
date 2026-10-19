import { defineConfig, devices } from '@playwright/test'

const externalBaseUrl = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseUrl || 'http://127.0.0.1:3000',
    trace: 'on-first-retry'
  },
  webServer: externalBaseUrl
    ? undefined
    : [{
        command: 'node tests/e2e/support/storefront-api-server.mjs',
        url: 'http://127.0.0.1:8787/health',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
      }, {
        command: 'npm run build && npm run start -- --hostname 127.0.0.1',
        url: 'http://127.0.0.1:3000/auth/login',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_API_URL: 'http://127.0.0.1:8787'
        }
      }],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
