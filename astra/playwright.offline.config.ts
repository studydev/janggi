import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const url = `http://127.0.0.1:5182${process.env.ASTRA_BASE || '/'}`

export default defineConfig({
  ...base,
  testDir: './tests/offline',
  outputDir: './test-results/offline',
  use: { ...base.use, baseURL: url, serviceWorkers: 'allow' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 5182 --strictPort',
    url,
    reuseExistingServer: false,
  },
})