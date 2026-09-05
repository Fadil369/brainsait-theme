# Payment Test Results

Date: 2026-09-05

Status: Not yet enabled for production recurring CTAs.

## Current Findings

- Existing MyFatoorah checkout worker found at `/home/fadil369/workers/myfatoorah-checkout`.
- Existing entitlement webhook worker found at `/home/fadil369/workers/entitlements-wh`.
- Existing Shopify app order-paid route forwards to `https://hub.brainsait.de/purchase`.
- Existing recurring worker tiers were older than the relaunch contract; `/home/fadil369/workers/myfatoorah-checkout/src/index.ts` was aligned to 182 / 499 / 1,999 SAR and deployed to Cloudflare Worker version `a0556306-8308-464a-af15-89c1b0ba36dd`.
- The available Shopify Admin token does not include publication scopes, so collection publication verification remains unavailable from this token.
- Cloudflare Worker secret names are present for `MYFATOORAH_API_KEY`, `MYFATOORAH_WEBHOOK_SECRET`, and `SHOPIFY_ADMIN_TOKEN`; secret values were not retrieved or logged.
- Current Worker vars keep recurring gated: `MYFATOORAH_MODE=live`, `MYFATOORAH_PAYMENT_METHOD_ID` empty, and `RECURRING_LIVE_CONFIRMED=false`.

## Test Runs

- `npx tsc --noEmit` in `/home/fadil369/workers/myfatoorah-checkout`: pass.
- `POST https://myfatoorah-checkout.brainsait-fadil.workers.dev/create-subscription` with a non-sensitive test customer returned HTTP 503 and the expected recurring-live-confirmation guard.
- No new MyFatoorah sandbox recurring payment was executed in this pass because the deployed Worker is in live mode, the recurring payment method ID is unset, and recurring live confirmation is false.

## Gate

Keep recurring CTAs disabled until all three positive paths and all exception paths in `integrations/tests/membership-journeys.md` have passing evidence.
