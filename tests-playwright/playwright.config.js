const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'playwright-report'); 

module.exports = defineConfig({
  testDir: './',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: REPORT_DIR, open: 'never' }], 
  ],

  use: {
    baseURL: process.env.UI_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    headless: true,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  metadata: {
    apiBaseUrl: process.env.API_URL || 'http://localhost:3000',
    dbPath: process.env.DB_PATH || 'db/seed.db',
  },
});
