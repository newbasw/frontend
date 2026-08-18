import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * The suite drives a real browser against a running app + API + Supabase.
 * Start both first (`npm run dev` from the repo root), or let Playwright start
 * the frontend itself via `webServer` below.
 *
 * Breakpoints mirror the ones named in the brief so responsive behaviour is
 * exercised, not assumed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'desktop-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-375', use: { ...devices['iPhone 13 mini'], viewport: { width: 375, height: 812 } } },
    { name: 'mobile-414', use: { ...devices['Desktop Chrome'], viewport: { width: 414, height: 896 }, isMobile: false } },
  ],

  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'npm run start',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
