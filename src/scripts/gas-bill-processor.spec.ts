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

// test('Test bill processing', async () => {
//     const pages = [
//         "ENERGY STATEMENT  www.pge.com/MyEnergy  Account No: 1111111111-4  Statement Date:   11/25/2025  Due Date:   12/16/2025  Visit   www.pge.com/MyEnergy   for a detailed bill comparison.   link  Gas Usage This Period:22.0 Therms 32 billing days Average Daily Usage 0.6875 Therms For 10/17 2025 Therms used 1.059974 For 10/19 2025 Therms used 1.059974 For 10/20 2025 Therms used 1.059974 For 10/22 2025 Therms used 1.059974 For 10/24 2025 Therms used 1.059974 For 10/26 2025 Therms used 1.059974 For 10/27 2025 Therms used 1.059974 For 10/29 2025 Therms used 1.059974 For 10/31 2025 Therms used 1.059974 For 11/02 2025 Therms used 1.059974 For 11/03 2025 Therms used 1.059974 For 11/05 2025 Therms used 1.059974 For 11/06 2025 Therms used 1.059974 For 11/07 2025 Therms used 1.059974 For 11/08 2025 Therms used 1.059974 For 11/09 2025 Therms used 1.059974 For 11/11 2025 Therms used 1.059974 For 11/12 2025 Therms used 1.059974 For 11/14 2025 Therms used 1.059974 For 11/15 2025 Therms used 1.059974 For 11/16 2025 Therms used 1.059974  Page 8 of 9  Details of Gas Charges  10/17/2025 - 11/17/2025 (32 billing days)  Service For:   xxxxx POOP WAY  Service Agreement ID:   1111111111  Rate Schedule:   G1 X Residential Service  10/17/2025 – 10/31/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   7.35   Therms   (15 days   x   0.49 Therms/day)  Tier 1 Usage   7.350000 Therms   @   $2.52299   $18.54  Tier 2 Usage   2.962500 Therms   @   $3.03685   9.00  Gas PPP Surcharge ($0.14324 /Therm)   1.48  Poop Utility Users' Tax (5.500%)   1.51  11/01/2025 – 11/17/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   25.16   Therms   (17 days   x   1.48 Therms/day)  Tier 1 Usage   11.687500 Therms   @   $2.63904   $30.84  Gas PPP Surcharge ($0.14324 /Therm)   1.67  Poop Utility Users' Tax (5.500%)   1.70  Total Gas Charges   $64.74  Average Daily Usage (Therms / day)  Last Year   Last Period   Current Period N/A   0.60   0.69  Service Information  Meter #   11111111  Current Meter Reading   6,990  Prior Meter Reading   6,969  Difference   21  Multiplier   1.059974  Total Usage   22.000000 Therms  Baseline Territory   X  Serial   W  Gas Procurement Costs ($/Therm)  10/17/2025 - 10/31/2025   $0.41601  11/01/2025 - 11/17/2025   $0.53206  Gas Usage This Period: 22.000000 Therms, 32 billing days  Therms   =   Average Daily Usage 0.69  10/17   10/20   10/23   10/26   10/29   11/01   11/04   11/07   11/10   11/13   11/16  0  1  2  3  4 5"
//     ];

//     const total = await calculateGasBill(pages);
// });