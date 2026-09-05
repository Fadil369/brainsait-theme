# BrainSAIT Bot Ecosystem Check

Date: 2026-09-05

## Scope

Checked `bot.brainsait.org` after Shopify staging setup to ensure it complements the store without adding checkout complexity.

## Existing Cloudflare Surfaces

- `bot.brainsait.org/*` routes to Worker `brainsait-bot`.
- `cart.brainsait.org/*` routes to Worker `ucp-cart`.
- `ucp-agent.brainsait-fadil.workers.dev` runs Worker `ucp-agent`.

## Applied

- Updated `brainsait-bot` metadata so `bot.brainsait.org` is the public operator/discovery surface and hands shopping flows to the dedicated Store UCP Agent.
- Updated `bot.brainsait.org/.well-known/ucp` from a generic `1.0` document to the current `2026-01-23` UCP discovery document.
- Added Store UCP Agent entries to `/.well-known/agent-card.json` and `/.well-known/ai-catalog.json`.
- Corrected OpenAPI cart path declarations to point to `https://cart.brainsait.org/v1/cart` and `https://cart.brainsait.org/v1/cart/eligibility`.
- Added passive Shopify theme discovery links:
  - `rel="ai-catalog"` → `https://bot.brainsait.org/.well-known/ai-catalog.json`
  - `rel="ucp"` → `https://bot.brainsait.org/.well-known/ucp`
  - `rel="agent-card"` → `https://ucp-agent.brainsait-fadil.workers.dev/.well-known/agent-card.json`
  - `rel="ucp-agent"` → `https://ucp-agent.brainsait-fadil.workers.dev/.well-known/agent-card.json`

## Cloudflare Deployment

- Worker: `brainsait-bot`
- Version ID: `838b2163-8cc6-4ac2-887a-fd440f9c062c`
- Route: `bot.brainsait.org/*`

## Live Verification

- `https://bot.brainsait.org/health`: 200
- `https://bot.brainsait.org/.well-known/ucp`: 200, includes Store UCP Agent and cart endpoint
- `https://bot.brainsait.org/.well-known/agent-card.json`: 200, includes Store UCP Agent supported interface
- `https://bot.brainsait.org/.well-known/ai-catalog.json`: 200, includes Store UCP Agent and UCP discovery entries
- `https://bot.brainsait.org/openapi.json`: 200
- `https://cart.brainsait.org/health`: 200
- `https://ucp-agent.brainsait-fadil.workers.dev/.well-known/agent-card.json`: 200
- `https://ucp-agent.brainsait-fadil.workers.dev/.well-known/ucp`: 200

## Shopify Verification

- Local regression suite: 33 PASS, 0 FAIL.
- Theme Check: 0 errors, 138 non-blocking warnings.
- Unpublished theme `149785313363` was pushed after the discovery-link update.
- Remote asset verification confirmed `layout/theme.liquid` contains the BrainSAIT bot, UCP, and Store UCP Agent discovery links.

## Deliberately Not Changed

- No production theme publication.
- No new checkout path.
- No autonomous cart completion.
- No recurring payment activation.
- No Cloudflare Access, DNS, or secret changes.

## Remaining Gate

The commerce stack is discovery-ready for agents. Full autonomous checkout remains gated by:

- MyFatoorah recurring lifecycle validation.
- Explicit publication approval for the tested Shopify theme.
- A real UCP CLI/client discovery pass once a UCP CLI is available in the operating environment.
