# BrainSAIT Shopify Relaunch Go-Live Readiness

Date: 2026-09-05

## Current State

- Staging theme: `BrainSAIT Relaunch 2026-09-05`
- Staging theme ID: `149785313363`
- Staging role: `unpublished`
- Preview URL: `https://f3rbxp-n1.myshopify.com?preview_theme_id=149785313363`
- Preview resolves at: `https://store.brainsait.de/`
- Current published rollback theme ID: `149735112787`
- Current published rollback theme name: `Horizon`

## Completed

- Canonical English-only product manifest generated for 116 products.
- Canonical Shopify catalog applied and live-verified.
- Five commercial collections are storefront-visible:
  - `learn`
  - `build`
  - `solutions`
  - `solutions-ready`
  - `oid-registry`
- Duplicate canonical product archived instead of deleted.
- Changed handles redirected.
- Premium BrainSAIT theme foundation, homepage, collection merchandising, product templates, and checkout-oriented product cards built.
- Theme pushed to unpublished Shopify theme `149785313363`.
- Preview HTTP check passed with BrainSAIT, Learn, Build, Solutions, OID, and Registry content present.
- Representative product routes passed for LEARN, BUILD, SOLUTIONS, SOLUTIONS READY, and OID & REGISTRY.
- Representative cart add entry passed.
- Published theme remains unchanged.

## Validation Evidence

- `audit/catalog-live-verification.json`: 116 products checked, no duplicate live canonical SKUs, no remaining product/collection/redirect/archive batches.
- `audit/theme-check.txt`: 0 errors, 135 warnings across 36 files. Warnings are non-blocking inherited/theme-lint warnings.
- `audit/acceptance-results.md`: 13 PASS, 0 FAIL, 1 BLOCKED.
- Local regression suite: 30 PASS, 0 FAIL.

## Blocking Gate

Recurring-payment production activation is not ready.

The deployed MyFatoorah checkout Worker intentionally returns HTTP 503 for `/create-subscription` because:

- `MYFATOORAH_MODE=live`
- `MYFATOORAH_PAYMENT_METHOD_ID` is empty
- `RECURRING_LIVE_CONFIRMED=false`

This is the correct safety gate. Do not enable recurring CTAs or publish as final until MyFatoorah recurring test-mode lifecycle evidence exists for success, failed payment, renewal, cancellation, duplicate callback idempotency, and expiry.

## Publication Gate

Do not publish on inferred approval.

After the user explicitly approves this exact tested preview and recurring-payment validation is complete, publish with:

```bash
shopify theme publish --store store.brainsait.de --theme 149785313363
```

Immediately after publication, verify:

- Home page
- All five collections
- Representative products
- Cart
- Checkout entry
- Recurring CTA
- Support/consultation route
- Analytics presence
- Hub reachability
- Rollback theme `149735112787` still exists and can be republished

Rollback command if needed:

```bash
shopify theme publish --store store.brainsait.de --theme 149735112787
```
