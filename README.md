### PG&E Automated Billing

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

Coming Soon!

## FAQ

# Why was an automated UI bot developed instead of utilizing the PG&E Share My Data API?

The PG&E Share My Data API mandates **Mutual TLS (mTLS)** authentication to establish trust between third-party applications and their infrastructure. At the project's inception, I intended to use **Let’s Encrypt** certificates to avoid the recurring costs associated with commercial Certificate Authorities (CAs).
However, Let’s Encrypt has announced significant policy changes to comply with new industry security standards. Starting **May 13, 2026**, Let's Encrypt will remove the **Client Authentication** Extended Key Usage (EKU) field from its certificates. Because PG&E’s mTLS handshake requires this specific EKU to authorize a client connection, Let’s Encrypt certificates will become technically incompatible with the API. A UI automation approach ensures long-term access without the dependency on a shifting public key infrastructure (PKI) or paid certificates.

# Why was TypeScript selected for this project?

**TypeScript** was chosen primarily because Playwright prioritizes this language for its latest feature releases and SDK updates. Utilizing TypeScript ensures the project remains compatible with the most modern web automation tools, providing better type safety and developer tooling when extracting billing and usage data from the PG&E portal.

# Is this project compatible with other utility types? (Currently Gas only)

While the current version is optimized specifically for **Gas Billing**, the architecture is designed for extensibility. The automation engine is capable of being adapted to extract **Water** and **Electricity** usage data. I may integrate these additional utility types in the future as my automated billing requirements evolve.

