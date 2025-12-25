# PG&E API Automation: Gmail OTP Setup Guide

This folder contains the automation scripts for the PG&E Shared Data API certificate renewal. To handle Multi-Factor Authentication (MFA) in a headless CI/CD environment (like GitHub Actions), we use the Gmail API to programmatically retrieve One-Time Passwords (OTP).

## 1. Google Cloud Setup (One-Time)

To interact with your Gmail account, you must register an application with Google:

1.  **Create Project:** Go to the [Google Cloud Console](console.cloud.google.com) and create a new project named `PGE-OTP-Automation`.
2.  **Enable Gmail API:** Navigate to **APIs & Services > Library**, search for **Gmail API**, and click **Enable**.
3.  **Configure OAuth Consent Screen:**
    *   **User Type:** Select **External**.
    *   **App Information:** Fill in your email for the support and developer contact fields.
    *   **Scopes:** Add `ttps://www.googleapis.com/auth/gmail.readonly`.
    *   **Test Users:** Add the specific Gmail address that receives the PG&E OTP emails.
    *   **Publishing Status:** Click **"PUBLISH APP"** to move it to "In Production." This ensures your refresh token does not expire after 7 days.
4.  **Download Credentials:**
    *   Go to **APIs & Services > Credentials**.
    *   Click **Create Credentials > OAuth client ID**.
    *   Select **Desktop App** as the type.
    *   Download the JSON file and rename it to `credentials.json` in this project directory.

## 2. Generate Refresh Token

Run the following command locally to generate your persistent session token:

```bash
# 1. Install dependencies
npm install

# 2. Run the generator
node index.js
```

## 3. Generate Refresh Token

Go to your repository and add these 3 secrets to your repository secrets, these can be found from the `token.json` generated.

1. **GMAIL_CLIENT_ID**
2. **GMAIL_CLIENT_SECRET**
3. **GMAIL_REFRESH_TOKEN**

