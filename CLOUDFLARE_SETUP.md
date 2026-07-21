# Cloudflare setup — complete these once

This ZIP contains the complete CRM source, hidden hosting file, database migrations, Worker configuration, and private login gate. Do not add passwords to GitHub.

## 1. Upload to GitHub

Extract the ZIP, then upload **all extracted files and folders** to the root of the `Agency-Command-CRM` repository. The repository must show `.openai/hosting.json` and `wrangler.jsonc`.

## 2. Create the database

In Cloudflare, open **Storage & databases → D1 SQL database → Create database**. Name it:

`agency-command-crm`

Copy the database ID. In GitHub, edit `wrangler.jsonc` and replace:

`REPLACE_WITH_YOUR_D1_DATABASE_ID`

with that ID, then commit the change.

## 3. Add private login secrets

In the Cloudflare Worker, open **Settings → Variables and Secrets**. Add these as encrypted secrets:

- `CRM_USERNAME` — the username you want
- `CRM_PASSWORD` — a strong password you will remember

Never put these values in GitHub or chat.

## 4. Use these Cloudflare build settings

- Build command: `npm run build`
- Deploy command: `npm run deploy`

The deploy command builds the CRM, applies every included D1 migration, and deploys the Worker. If either private-login secret is missing, the deployed CRM safely returns a configuration error instead of exposing client data.

## Optional integrations

Google, Meta, and Microsoft Clarity connections remain disabled until their own encrypted credentials are added in Cloudflare. The core CRM, records, proposals, reports, onboarding, and content briefs do not require those integrations.
