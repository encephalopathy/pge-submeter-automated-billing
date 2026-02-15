import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/scripts',
  timeout: 120_000,
  reportSlowTests: { max: 1, threshold: 60_000 },
  use: {
    headless: false,               // IMPORTANT for CAPTCHA/MFA
    viewport: { width: 1280, height: 800 },
    screenshot: 'off', 
    video: 'off',
    actionTimeout: 15_000,
     // 1. Toggles bypassing Content-Security-Policy globally
    bypassCSP: true, 
    
     // 2. Browser launch arguments to bypass origin/CORS restrictions
    launchOptions: {
       args: ['--disable-web-security']
     },
  }
});