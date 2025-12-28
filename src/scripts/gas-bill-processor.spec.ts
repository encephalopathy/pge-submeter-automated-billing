import { test, expect, Locator, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { calculateGasBill, assemblePaymentRequestTargets } from '../common/bill-calculator';
import { getGmailAuth, getOTP, sendBill } from '../common/gmail-client';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const USERNAME = process.env.PGE_USERNAME!;
const PASSWORD = process.env.PGE_PASSWORD!;

async function extractTextFromBlob(newPage: any): Promise<Array<string>> {
    // 1. Fetch the PDF data from the blob URL within the browser context
    const blobUrl = newPage.url();
    const uint8Array = await newPage.evaluate(async (url: string) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return Array.from(new Uint8Array(arrayBuffer)); // Return as Array for serialization
    }, blobUrl);

    // 2. Load the document into PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(uint8Array) });
    const pdfDoc = await loadingTask.promise;

    let fullText = "";

    const pageContent = Array<string>();
    // 3. Iterate through all pages and extract text
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        // items is an array of objects containing 'str' property
        const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
        
        pageContent.push(pageText);
    }

    return pageContent;
}

async function enterOtpCode(page: Page): Promise<OAuth2Client | undefined> {

    let errorText: Locator | undefined = undefined;
    let iterationCount = 0;
    let authClient: OAuth2Client | undefined = undefined;
    do {
        // 7. Wait 10 seconds for the OTP email to come through
        await page.waitForTimeout(10000);

        authClient = await getGmailAuth();
        const otp = await getOTP(authClient);

        // 8. Fill otp in PG&E security form, retry 3 times to accomplish this
        const otpTextBox = await page.locator('input.securityInput').first();
        await expect(otpTextBox).toBeVisible();
        await expect(otpTextBox).toBeEnabled();
        await expect(otpTextBox).toBeEditable();


        await otpTextBox.click();
        const selectAll = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
        await page.waitForTimeout(100);
        await otpTextBox.press(selectAll);
        await page.waitForTimeout(100);
        await otpTextBox.press('Backspace');

        await page.waitForTimeout(100);
        for (const digit of otp) {
            await page.keyboard.press(digit);
            // Optional: small delay if the UI needs time to move focus to the next box
            await page.waitForTimeout(50);
        }

        // 9. Click confirm button to confirm OTP is correct
        await page.locator('button.PrimaryButton').first().click();

        errorText = await page.locator("#error-21").first();
        iterationCount++;
    }
    while (await errorText!.isVisible() && iterationCount < 3);

    return authClient;
}

test('PG&E UI Bot - Process Gas Billing', async ({ context, page }) => {
  if (!USERNAME || !PASSWORD) {
    throw new Error('Missing PGE_USERNAME or PGE_PASSWORD env vars');
  }

  // Check Email to see if the PG&E bill has come, if it has not skip this run.

  // 1. Go to PG&E login page
  await page.goto('https://myaccount.pge.com/myaccount/s/login/?language=en_US', {
    waitUntil: 'domcontentloaded'
  });

  // 2. Fill username
  await page.locator('input[type="email"], input[name="username"]').first().fill(USERNAME);

  // 3. Fill password
  await page.locator('input[type="password"]').first().fill(PASSWORD);

  // 4. Submit form
  await page.locator('button.PrimarySignInButton').first().click();

  // 5. wait for 25 seconds for otp prompt title to show
  await page.waitForSelector('text="We\'ll send a 6-digit security code to:"',{timeout:25000});

  // 6. Click on email to send to OTP
  await page.locator('button.PrimaryButton, button[type="button"]').first().click();

  const authClient = await enterOtpCode(page);

  // 10. Await for the page to be loaded.
  await expect(page).toHaveURL(/myaccount|dashboard|home/i);

  await page.waitForTimeout(20000); 

  const newPagePromise = context.waitForEvent('page', { timeout: 30000});

  // 11. Click on the view bill link
  await page.getByRole('link', { name: 'View Current Bill', exact: true }).first().click();

  const newPage = await newPagePromise;

  // 12. Wait for the new page to load (e.g., wait for load state or a specific URL)
  await newPage.waitForURL(/blob:/, { waitUntil: 'networkidle', timeout: 30000 });
  await newPage.waitForTimeout(10000);

  // 13. Extract pdf documents as strings
  const pageContent = await extractTextFromBlob(newPage);
  
  // 14. Parse document and compare against the submeteter usage to determine bill
  const totals = await calculateGasBill(pageContent);

  // 15. Email tenants the bill
  const emailRequestBundles = assemblePaymentRequestTargets(totals);
  const zelleEmail = process.env.ZELLE_EMAIL;

  sendBill(authClient, emailRequestBundles.main, zelleEmail!);
  sendBill(authClient, emailRequestBundles.adu, zelleEmail!);
});