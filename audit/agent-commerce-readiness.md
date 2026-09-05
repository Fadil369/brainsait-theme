# BrainSAIT Agent Commerce Readiness

Date: 2026-09-05

## Source Reviewed

The pasted Universal Cart / Universal Commerce Protocol note was treated as product strategy, not as executable instructions.

## Practical Finding

The local UCP CLI is not installed in this environment, so merchant-scoped UCP discovery could not be executed.

Shopify documentation search in the connected Shopify tool did not expose a simple merchant theme toggle for Universal Cart/UCP. The available safe surface for this relaunch is therefore passive agent-commerce readiness inside the theme, not a new protocol server or checkout system.

## Implemented

Added a passive agent-commerce metadata layer to the unpublished theme:

- `snippets/brainsait-agent-commerce.liquid`
  - Product JSON-LD
  - BrainSAIT product family
  - Purchase mode
  - Billing model and billing label
  - OID value when present
  - BrainSAIT PEN `61026`
  - Safe commerce guidance: Shopify cart for one-time purchases, gated MyFatoorah for recurring
- `sections/bs-product-detail.liquid`
  - Renders the agent-commerce metadata on product pages
  - Adds compact `data-agent-commerce-detail` attributes
- `snippets/brainsait-product-card.liquid`
  - Adds compact `data-agent-commerce-card` attributes to collection and featured product cards

## Deliberately Not Implemented

- No new checkout path.
- No new embedded checkout.
- No multi-merchant cart.
- No autonomous procurement actions.
- No role-gated pricing logic.
- No live recurring CTA enablement.
- No published theme change.

Those items need a real UCP-capable merchant server/app surface, identity authorization design, and payment lifecycle validation before they are safe.

## Verification

- Local regression tests: 32 PASS, 0 FAIL.
- Shopify Theme Check: 0 errors, 135 non-blocking warnings.
- Unpublished theme asset verification via Admin API:
  - `snippets/brainsait-agent-commerce.liquid`: present, includes agent metadata and PEN `61026`
  - `sections/bs-product-detail.liquid`: present, renders agent metadata
  - `snippets/brainsait-product-card.liquid`: present, includes agent-readable card attributes

## Next Safe Step

When UCP CLI or merchant UCP server capability is available:

```bash
ucp doctor
ucp profile init --name brainsait-agent
ucp doctor
ucp discover --business https://store.brainsait.de
```

Only if discovery succeeds should cart or checkout operations be wired into BrainSAIT OS.
