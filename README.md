# PG&E Automated Billing for Submetered Gas

## Description
This system automates the extraction of gas usage and billing data to accurately calculate proportional costs for tenants across multiple addresses sharing a single utility line. The platform facilitates seamless financial reporting via automated email delivery and supports payment reconciliation through Zelle.

## Prerequisites
- [PG&E account](https://www.pge.com/en/account.html)
- [EKM Push Gateway](https://www.ekmmetering.com/products/ekm-push3-cloud-data-system?srsltid=AfmBOoqUde_74fXxQB8iusPylTixfA40ah9-BZ7GtvvKVz4MTdNRSnNP)
- [EKM Gas Submeter](https://www.ekmmetering.com/pages/hardware?srsltid=AfmBOopPrRl3qowqnWUs-hbVwC6YdtvUzfBK0Yp50WSxKeBw01P1YtAg)
- Gmail account
- 20 amp dedicated circuit to power the devices above
- An internet modem in which the EKM Push Gateway is registered
- Zelle account (Email or phone)

## Setup

1. Set up your EKM submeter from the Prequisites above
2. Fork this repository
3. Follow the `README.md` in the `authorization` folder to set up your gmail OAuth Client
4. Add these secrets to the **Forked** Repository
    - **PGE_USERNAME**
    - **PGE_PASSWORD**
    - **GMAIL_CLIENT_ID**
    - **GMAIL_CLIENT_SECRET**
    - **GMAIL_REFRESH_TOKEN**
    - **ENCOMPASS_IO_ACCESS_KEY**
    - **ENCOMPASS_IO_DEVICE_ID**
    - **ZELLE_EMAIL** (Where payment infomration will be displayed in the email this will send, can be a phone number too)
    - **ADDRESS_MAIN** (Address of the primary side)
    - **ADDRESS_ADU** (Address of the subemetered side)
    - **ADDRESS_MAIN_RECIEPIENTS** (Email of tenant(s) living on the main side, this can be singular or comma separated)
    - **ADDRESS_ADU_RECIEPIENTS** (Email of tenant(s) living on the submetered side, this can be singular or comma separated)
5. Tenants will receive an email daily the last 5 days of the month depending on when the bill is sent from PG&E.

## FAQ

### Why was an automated UI bot developed instead of utilizing the PG&E Share My Data API?

The PG&E Share My Data API mandates **Mutual TLS (mTLS)** authentication to establish trust between third-party applications and their infrastructure. At the project's inception, I intended to use **Let’s Encrypt** certificates to avoid the recurring costs associated with commercial Certificate Authorities (CAs).
However, Let’s Encrypt has announced significant policy changes to comply with new industry security standards. Starting **May 13, 2026**, Let's Encrypt will remove the **Client Authentication** Extended Key Usage (EKU) field from its certificates. Because PG&E’s mTLS handshake requires this specific EKU to authorize a client connection, Let’s Encrypt certificates will become technically incompatible with the API. A UI automation approach ensures long-term access without the dependency on a shifting public key infrastructure (PKI) or paid certificates.

### Why was TypeScript selected for this project?

**TypeScript** was chosen primarily because Playwright prioritizes this language for its latest feature releases and SDK updates. Utilizing TypeScript ensures the project remains compatible with the most modern web automation tools, providing better type safety and developer tooling when extracting billing and usage data from the PG&E portal.

### Is this project compatible with other utility types? (Currently Gas only)

While the current version is optimized specifically for **Gas Billing**, the architecture is designed for extensibility. The automation engine is capable of being adapted to extract **Water** and **Electricity** usage data. I may integrate these additional utility types in the future as my automated billing requirements evolve.

### Is there a mechanism that stops sending notification emails for payments to tenants once a bill has been paid?

There is currently no support that disables sending emails even if the tenant has paid their bill for this billing period.  Emails will stop being
emited on the 1st of the following month and will start again 5 days prior to the end of the month.