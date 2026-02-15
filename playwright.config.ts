import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/scripts',
  timeout: 120_000,
  reportSlowTests: { max: 1, threshold: 60_000 },
  use: {
    headless: false,               // IMPORTANT for CAPTCHA/MFA
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles', 
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
     // 1. Toggles bypassing Content-Security-Policy globally
    bypassCSP: true, 
    
     // 2. Browser launch arguments to bypass origin/CORS restrictions
    launchOptions: {
       args: ['--disable-web-security']
     },
  }
});