# Agency Command CRM — Vercel setup

This package contains the complete CRM source as of 21 July 2026.

## Important

The application currently runs on a Cloudflare-compatible runtime and stores data in Cloudflare D1. A direct upload to Vercel may display the interface, but saved clients, audits, reports, integrations, and other server workflows will not work correctly until the database/runtime migration is completed.

## Recommended production migration

1. Create a Postgres database for the Vercel project (for example, Neon).
2. Replace the D1 database adapter in `db/index.ts` with a Postgres-compatible Drizzle adapter.
3. Convert and apply the SQL migrations in the `drizzle` folder to Postgres.
4. Replace the Cloudflare Worker/Vinext build configuration with the standard Next.js Vercel runtime.
5. Add the required environment variables in Vercel without placing secrets in source control.
6. Update Google and Meta OAuth callback URLs to the final Vercel domain.
7. Test client creation, audit generation, proposals, reports, onboarding, content briefs, and every connected integration before using the Vercel deployment for real client data.

## Integration environment variables

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_ADS_DEVELOPER_TOKEN` (when Google Ads is enabled)
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (optional)
- `META_APP_ID`
- `META_APP_SECRET`

Do not add passwords, API tokens, or OAuth secrets directly to files in this package. Add them through Vercel Project Settings > Environment Variables.

## Local verification

The recovered source passed its existing build and test checks before this package was created.

