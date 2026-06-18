import { defineConfig, devices } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'

const dmUrl = 'http://127.0.0.1:6173'
const playerUrl = 'http://127.0.0.1:6174'
const sharedApiBases = `${dmUrl}/api,${playerUrl}/api`
const sharedRoot = path.join(os.tmpdir(), 'stars-app-e2e-shared')

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node scripts/vite-server.mjs --host 127.0.0.1 --port 6173 --strictPort',
      url: dmUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        STARS_SHARED_ROOT: sharedRoot,
        VITE_APP_MODE: 'dm',
        VITE_SHARED_API_BASES: sharedApiBases,
      },
    },
    {
      command: 'node scripts/vite-server.mjs --host 127.0.0.1 --port 6174 --strictPort',
      url: playerUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        STARS_SHARED_ROOT: sharedRoot,
        VITE_APP_MODE: 'player',
        VITE_SHARED_API_BASES: sharedApiBases,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
