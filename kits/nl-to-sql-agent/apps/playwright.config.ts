import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { defineConfig, devices } from '@playwright/test';

// Load .env.local into the Playwright process so the TEST process (not just the
// spawned webServer) sees DEMO_USERNAME / DEMO_PASSWORD. Playwright loads this
// config in the main and worker processes, so mutating process.env here makes
// the credentials available to example.spec.ts during execution.
// Never overwrite variables already exported by the shell/CI environment.
const envFile = resolve(process.cwd(), '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

// Standardize the E2E server on the app's documented development port (3000)
// so baseURL and the Playwright-started server always agree. See README:
// "npm run dev" then open http://localhost:3000.
const PORT = '3000';
const BASE_URL = `http://localhost:${PORT}`;
const DEMO_USERNAME = process.env.DEMO_USERNAME || 'demo';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo';
// Mirror the resolved defaults into the test process so example.spec.ts and the
// spawned server always use the same credentials.
process.env.DEMO_USERNAME = DEMO_USERNAME;
process.env.DEMO_PASSWORD = DEMO_PASSWORD;
const TEST_SESSION_PASSWORD = 'test-session-password-at-least-32-chars';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  webServer: {
    // Playwright starts the app itself, so no manual `npm run dev` is needed.
    // Local runs use the dev server; CI builds a production bundle and serves
    // it. Locally an already-running server on the port is reused, while CI
    // always starts its own (never reuses a developer's local server).
    command: process.env.CI
      ? `npm run build && npm run start -- -p ${PORT}`
      : `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    env: {
      SESSION_PASSWORD: process.env.SESSION_PASSWORD || TEST_SESSION_PASSWORD,
      DEMO_AUTH_ENABLED: process.env.DEMO_AUTH_ENABLED || 'true',
      DEMO_USERNAME,
      DEMO_PASSWORD,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
