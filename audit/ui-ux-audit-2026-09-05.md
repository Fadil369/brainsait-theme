# UI/UX audit — Cloudflare Browser Run

Date: 2026-09-05
Provider: Cloudflare Browser Run `/screenshot`
Theme: `149785313363` — BrainSAIT Relaunch 2026-09-05
Status: unpublished staging

## Screens captured

- `audit/cf-browser-run-2026-09-05-v3/01-home.png`
- `audit/cf-browser-run-2026-09-05-v3/02-oid-collection.png`
- `audit/cf-browser-run-2026-09-05-v3/03-product-oid.png`
- `audit/cf-browser-run-2026-09-05-v3/04-mobile-home.png`

## Findings and fixes

1. Homepage CTA labels initially rendered as empty squares.
   - Cause: inherited base theme button reset forced `font-size: 0` and `line-height: 0` on BrainSAIT CTA links.
   - Fix: BrainSAIT button token now explicitly sets `font-size: var(--bs-text-sm)` and `line-height: 1.2`.
   - Final Cloudflare render confirms the labels are visible.

2. Collection pages initially used inherited `gh-shelf`.
   - Visible issue: products rendered as very tall/noisy cards.
   - First fix reduced card height, but Cloudflare render exposed an inherited filter wrapper reserving a blank left column.
   - Final fix: collection template now uses `brainsait-collection-grid`, a purpose-built BrainSAIT grid section.
   - Final Cloudflare render confirms centered collection header, compact 4-column cards, and no blank left column.

3. Product detail page uses the new premium product section.
   - Final render confirms clean two-column hero, clear price/billing/delivery terms, and visible add-to-cart/consultation actions.

4. Mobile homepage renders with clear hierarchy.
   - Final render confirms visible CTAs, readable navigation icons, and single-column pathway flow.

## Verification

- Shopify Liquid validator: `sections/brainsait-collection-grid.liquid` valid.
- Node regression suite: 35 passed, 0 failed.
- Shopify theme push strict check: 0 errors, 138 inherited warnings.
- Acceptance check: 13 pass, 1 blocked.
- Blocked item: MyFatoorah live recurring remains gated until full test-mode subscription validation is completed.

## Publication

Changes were pushed only to unpublished staging theme `149785313363`.
The live theme remains `149735112787` (`Horizon`).
