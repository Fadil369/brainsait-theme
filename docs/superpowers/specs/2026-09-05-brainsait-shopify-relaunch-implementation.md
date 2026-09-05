# BrainSAIT Shopify Relaunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relaunch `store.brainsait.de` on an unpublished Shopify Horizon theme with a normalized English-only LEARN, BUILD, SOLUTIONS, SOLUTIONS READY, and OID & REGISTRY catalog, verified MyFatoorah recurring journeys, and a reversible go-live.

**Architecture:** Preserve the live Shopify store and all commerce history. Work from read-only snapshots, transform catalog data through deterministic manifests, build and push an unpublished theme, validate MyFatoorah and Hub events, then publish only after a final acceptance gate. The current published theme remains the rollback target.

**Tech Stack:** Shopify Basic, Horizon theme, Shopify CLI 3.93+, Liquid, JSON templates, CSS, vanilla JavaScript, Shopify Admin GraphQL, MyFatoorah recurring billing, BrainSAIT Hub, Node.js tests, Lighthouse, Theme Check.

**Spec:** `docs/superpowers/specs/2026-09-05-brainsait-shopify-relaunch-design.md`

## Global Constraints

- Live store: `store.brainsait.de`; country: Saudi Arabia; currency: SAR; timezone: UTC+03.
- Build in an unpublished Horizon theme; never alter the published theme during development.
- English-only customer-facing content.
- Preserve customers, orders, payment records, and useful URLs.
- Archive duplicates and superseded products; never delete them.
- Preserve or redirect changed handles before publication.
- LEARN supports individual purchases and a 182 SAR/month membership.
- BUILD is 499 SAR/month; SOLUTIONS is 1,999 SAR/month; SOLUTIONS READY is 24,000 SAR one-time.
- MyFatoorah provides recurring billing for monthly memberships.
- SCFHS and other official credential authorities remain independent; BrainSAIT verification must not be represented as professional licensure.
- Use WCAG-oriented contrast, keyboard accessibility, reduced motion, responsive images, and minimal third-party JavaScript.
- No live theme publication without explicit final go-live approval.

---

### Task 1: Establish a Recoverable Store Baseline

**Files:**
- Create: `store-rebuild/audit/shop.json`
- Create: `store-rebuild/audit/products.json`
- Create: `store-rebuild/audit/collections.json`
- Create: `store-rebuild/audit/themes.json`
- Create: `store-rebuild/audit/redirects.json`
- Create: `store-rebuild/audit/baseline.sha256`

**Interfaces:**
- Consumes: Connected Shopify store and approved design specification.
- Produces: Immutable baseline JSON snapshots and the published theme ID used by every rollback and comparison task.

- [ ] **Step 1: Verify the connected store identity**

Run the Shopify store-information query and assert domain `store.brainsait.de`, currency `SAR`, and country `Saudi Arabia`. Stop on any mismatch.

Initialize the local implementation repository:

```bash
git init store-rebuild
```

- [ ] **Step 2: Export all product pages without mutation**

Use paginated Admin GraphQL queries for products, variants, images, metafields, publication state, collections, tags, handles, prices, and SKUs. Save the complete response as `store-rebuild/audit/products.json`.

- [ ] **Step 3: Export collections, redirects, and themes**

Record collection rules and memberships, URL redirects, every theme ID and role, and the currently published theme ID.

- [ ] **Step 4: Create a baseline checksum**

Run:

```bash
cd store-rebuild/audit
sha256sum shop.json products.json collections.json themes.json redirects.json > baseline.sha256
sha256sum --check baseline.sha256
```

Expected: every file reports `OK`.

- [ ] **Step 5: Commit the baseline metadata**

```bash
git add store-rebuild/audit
git commit -m "chore: capture Shopify relaunch baseline"
```

Do not commit credentials, access tokens, customer records, or order PII. If an API response contains sensitive fields, remove them before the commit while retaining the protected local snapshot outside Git.

---

### Task 2: Build and Test the Canonical Catalog Manifest

**Files:**
- Create: `store-rebuild/catalog/catalog-source.json`
- Create: `store-rebuild/catalog/catalog-canonical.json`
- Create: `store-rebuild/catalog/archive-map.json`
- Create: `store-rebuild/catalog/redirect-map.json`
- Create: `store-rebuild/catalog/schema/catalog.schema.json`
- Create: `store-rebuild/catalog/scripts/normalize-catalog.mjs`
- Create: `store-rebuild/catalog/tests/normalize-catalog.test.mjs`

**Interfaces:**
- Consumes: `audit/products.json`, Hub catalog, `upload/oid-line-skus.json`, `upload/BPR_Monetization_Map.json`, and approved pricing.
- Produces: `catalog-canonical.json` with one canonical record per active offer and explicit archive/redirect maps.

- [ ] **Step 1: Write catalog invariants as failing tests**

Tests must assert unique SKU and handle values, English-only customer copy, allowed product types, valid SAR prices, one canonical active record per source identity, approved membership prices, approved OID tiers, 3:2 image metadata, and a disclaimer on provider-verification offers.

Run:

```bash
node --test store-rebuild/catalog/tests/normalize-catalog.test.mjs
```

Expected: FAIL because the normalized output does not exist.

- [ ] **Step 2: Define the controlled product types**

Allowed values:

```json
["LEARN Item","LEARN Membership","BUILD Membership","SOLUTIONS Membership","SOLUTIONS READY","OID & Registry"]
```

- [ ] **Step 3: Implement deterministic normalization**

`normalize-catalog.mjs` must read all sources, retain the canonical English title, preserve valuable handles, assign stable SKUs, normalize tags, map pricing and billing type, identify duplicate IDs for archive, and emit redirects for changed handles.

- [ ] **Step 4: Run the tests and inspect the diff**

```bash
node store-rebuild/catalog/scripts/normalize-catalog.mjs
node --test store-rebuild/catalog/tests/normalize-catalog.test.mjs
git diff --no-index store-rebuild/audit/products.json store-rebuild/catalog/catalog-canonical.json || true
```

Expected: all tests PASS; the diff contains only intended normalization.

- [ ] **Step 5: Commit the catalog manifest**

```bash
git add store-rebuild/catalog
git commit -m "feat: define canonical BrainSAIT catalog"
```

---

### Task 3: Create the Unpublished Horizon Theme Workspace

**Files:**
- Create: `store-rebuild/theme/`
- Create: `store-rebuild/theme/.shopifyignore`
- Create: `store-rebuild/audit/staging-theme.json`

**Interfaces:**
- Consumes: Shopify theme-store Horizon installation and the connected live store.
- Produces: Local Horizon theme source plus an unpublished remote theme ID.

- [ ] **Step 1: Verify Shopify CLI version and authentication**

```bash
shopify version
shopify theme list --store store.brainsait.de
```

Expected: CLI version 3.93.0 or newer and a successful theme list.

- [ ] **Step 2: Install or duplicate Horizon as unpublished**

Add Shopify Horizon from the Theme Store without publishing it. Record its theme ID and confirm its role is unpublished.

- [ ] **Step 3: Pull the unpublished theme**

```bash
staging_theme_id="$(jq -r '.id' store-rebuild/audit/staging-theme.json)"
test -n "$staging_theme_id" && test "$staging_theme_id" != "null"
shopify theme pull --store store.brainsait.de --theme "$staging_theme_id" --path store-rebuild/theme
```

The numeric theme ID must come from Step 2; do not reuse the published theme ID.

- [ ] **Step 4: Add safe local exclusions**

Exclude OS files, logs, test output, audit snapshots, and credentials in `.shopifyignore`.

- [ ] **Step 5: Run the initial theme validation**

```bash
shopify theme check --path store-rebuild/theme
```

Expected: no errors.

- [ ] **Step 6: Commit the untouched staging baseline**

```bash
git add store-rebuild/theme store-rebuild/audit/staging-theme.json
git commit -m "chore: stage unpublished Horizon theme"
```

---

### Task 4: Implement Global Brand Tokens and Store Shell

**Files:**
- Modify: `store-rebuild/theme/config/settings_schema.json`
- Modify: `store-rebuild/theme/config/settings_data.json`
- Modify: `store-rebuild/theme/layout/theme.liquid`
- Create: `store-rebuild/theme/assets/brainsait-tokens.css`
- Create: `store-rebuild/theme/assets/brainsait-motion.js`
- Modify: Horizon header and footer section files discovered in Task 3
- Modify: `store-rebuild/theme/locales/en.default.json`

**Interfaces:**
- Consumes: Approved visual system.
- Produces: CSS custom properties, reduced-motion behavior, accessible global navigation, announcement area, and footer.

- [ ] **Step 1: Add failing static assertions**

Create checks that assert the presence of obsidian, graphite, ivory, champagne-gold, and teal tokens; focus-visible styles; reduced-motion media queries; English translation keys; and primary navigation labels.

- [ ] **Step 2: Implement tokens and typography**

Define colors, type scale, spacing, radii, borders, shadows, container widths, transitions, focus rings, and responsive breakpoints in `brainsait-tokens.css`.

- [ ] **Step 3: Implement restrained motion**

Use IntersectionObserver for progressive reveals and disable them when `prefers-reduced-motion: reduce` is active. The site must remain fully functional without JavaScript.

- [ ] **Step 4: Configure header and footer**

Expose Home, Learn, Build, Solutions, OID & Registry, About, Support, Search, Account, and Cart. Add policy and credential-disclaimer links in the footer.

- [ ] **Step 5: Validate Liquid and accessibility**

```bash
shopify theme check --path store-rebuild/theme
node --test store-rebuild/theme/tests/global-shell.test.mjs
```

Expected: PASS and no Theme Check errors.

- [ ] **Step 6: Commit**

```bash
git add store-rebuild/theme
git commit -m "feat: add BrainSAIT premium theme foundation"
```

---

### Task 5: Build Homepage and Collection Merchandising

**Files:**
- Create: `store-rebuild/theme/sections/brainsait-hero.liquid`
- Create: `store-rebuild/theme/sections/pathway-grid.liquid`
- Create: `store-rebuild/theme/sections/featured-offers.liquid`
- Create: `store-rebuild/theme/sections/trust-governance.liquid`
- Create: `store-rebuild/theme/snippets/brainsait-product-card.liquid`
- Modify: `store-rebuild/theme/templates/index.json`
- Modify: Horizon main collection section discovered in Task 3
- Create: `store-rebuild/theme/tests/home-collections.test.mjs`

**Interfaces:**
- Consumes: Shopify collections with handles `learn`, `build`, `solutions`, `solutions-ready`, and `oid-registry`.
- Produces: Homepage pathway funnel, standardized product cards, and collection discovery UI.

- [ ] **Step 1: Write failing structural tests**

Assert semantic headings, four pathway cards, predictable CTA labels, product-card billing labels, responsive image usage, and accessible filter controls.

- [ ] **Step 2: Implement homepage sections**

Build the approved sequence: hero, pathways, featured offers, Solutions Ready, OID trust, delivery model, governance, and final CTA.

- [ ] **Step 3: Implement the standardized card**

Each card renders a 3:2 responsive image, family badge, short outcome, billing label, price, `View details`, and a purchase CTA only when direct purchase is valid.

- [ ] **Step 4: Configure collection discovery**

Support Shopify-native filtering by category, industry, delivery model, price, and billing type. Do not add a third-party filter library.

- [ ] **Step 5: Validate**

```bash
shopify theme check --path store-rebuild/theme
node --test store-rebuild/theme/tests/home-collections.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add store-rebuild/theme
git commit -m "feat: build storefront pathways and merchandising"
```

---

### Task 6: Build Four Product Experience Templates

**Files:**
- Create: `store-rebuild/theme/templates/product.learn.json`
- Create: `store-rebuild/theme/templates/product.membership.json`
- Create: `store-rebuild/theme/templates/product.solution-ready.json`
- Create: `store-rebuild/theme/templates/product.oid-registry.json`
- Create: `store-rebuild/theme/sections/product-outcome.liquid`
- Create: `store-rebuild/theme/sections/product-deliverables.liquid`
- Create: `store-rebuild/theme/sections/product-billing.liquid`
- Create: `store-rebuild/theme/sections/product-governance.liquid`
- Create: `store-rebuild/theme/sections/product-faq.liquid`
- Create: `store-rebuild/theme/tests/product-templates.test.mjs`

**Interfaces:**
- Consumes: Product metafields in namespace `brainsait` for outcome, audience, inclusions, delivery, prerequisites, billing label, support, FAQ, OID, limits, overage, and disclaimer.
- Produces: Four reusable product templates assigned by canonical product family.

- [ ] **Step 1: Write failing metafield and template tests**

Assert required sections, safe empty states, subscription disclosure, enterprise enquiry behavior, and the official-authority disclaimer on OID templates.

- [ ] **Step 2: Implement LEARN template**

Show learning outcome, audience, level, format, delivery, curriculum, individual price, LEARN Pass comparison, access terms, and related learning products.

- [ ] **Step 3: Implement membership template**

Show included services, 30-day billing, onboarding, renewal/cancellation terms, access rules, and the recurring-payment action.

- [ ] **Step 4: Implement SOLUTIONS READY template**

Show problem, capabilities, deployment scope, prerequisites, exclusions, delivery stages, support boundary, and 24,000 SAR purchase action.

- [ ] **Step 5: Implement OID & Registry template**

Show OID/SKU, verification or integration scope, limits, overages, governance, implementation requirements, billing architecture, consultation action, and independent-authority disclaimer.

- [ ] **Step 6: Validate and commit**

```bash
shopify theme check --path store-rebuild/theme
node --test store-rebuild/theme/tests/product-templates.test.mjs
git add store-rebuild/theme
git commit -m "feat: add product-family templates"
```

---

### Task 7: Create Collections, Metafields, and Canonical Product Updates

**Files:**
- Create: `store-rebuild/admin/metafield-definitions.graphql`
- Create: `store-rebuild/admin/catalog-upsert.graphql`
- Create: `store-rebuild/admin/collections-upsert.graphql`
- Create: `store-rebuild/admin/archive-products.graphql`
- Create: `store-rebuild/admin/redirects-upsert.graphql`
- Create: `store-rebuild/admin/scripts/apply-catalog.mjs`
- Create: `store-rebuild/admin/tests/apply-catalog.test.mjs`
- Create: `store-rebuild/audit/catalog-apply-log.json`

**Interfaces:**
- Consumes: `catalog-canonical.json`, `archive-map.json`, and `redirect-map.json`.
- Produces: Normalized Shopify products, collection assignments, product-template assignments, redirects, and a per-operation audit log.

- [ ] **Step 1: Search current Shopify documentation and validate operations**

Search for the exact Admin GraphQL operations and validate every query and mutation before execution. Select no more than five return fields per mutation unless error diagnosis requires more.

- [ ] **Step 2: Write dry-run tests**

Mock the Shopify client and assert idempotency, batch size, retry behavior, user-error handling, archive-only behavior, and audit-log output.

- [ ] **Step 3: Create five primary collections**

Create or update `Learn`, `Build`, `Solutions`, `Solutions Ready`, and `OID & Registry`; publish them to the Online Store without changing the current navigation yet.

- [ ] **Step 4: Define product metafields**

Create merchant-editable definitions in namespace `brainsait` for every interface consumed by Task 6.

- [ ] **Step 5: Apply canonical products in bounded batches**

Process at most 10 products per batch. Stop the batch on validation errors, record Shopify user errors, and never mutate products not present in the approved canonical manifest.

- [ ] **Step 6: Assign templates and collections**

Assign each canonical product to exactly one primary family collection and the matching template suffix.

- [ ] **Step 7: Create redirects before archiving duplicates**

Apply `redirect-map.json`, verify every redirect destination returns a canonical product, then archive IDs from `archive-map.json`.

- [ ] **Step 8: Verify post-write invariants**

Re-query products and run catalog tests against the live response. Expected: unique active SKUs/handles, approved prices, correct collections/templates, and zero deleted products.

- [ ] **Step 9: Commit**

```bash
git add store-rebuild/admin store-rebuild/audit/catalog-apply-log.json
git commit -m "feat: apply normalized Shopify catalog"
```

---

### Task 8: Integrate MyFatoorah Recurring Billing and Hub Events

**Files:**
- Create: `store-rebuild/integrations/contracts/membership-plans.json`
- Create: `store-rebuild/integrations/contracts/hub-events.schema.json`
- Create: `store-rebuild/integrations/tests/membership-journeys.md`
- Create: `store-rebuild/audit/payment-test-results.md`

**Interfaces:**
- Consumes: Active MyFatoorah recurring configuration and Hub endpoint.
- Produces: Verified recurring CTAs and normalized idempotent lifecycle events for provisioning.

- [ ] **Step 1: Record the exact recurring plan contract**

Define:

```json
{
  "LEARN-MONTHLY": {"amount": 182, "currency": "SAR", "interval": "monthly"},
  "BUILD-MONTHLY": {"amount": 499, "currency": "SAR", "interval": "monthly"},
  "SOLUTIONS-MONTHLY": {"amount": 1999, "currency": "SAR", "interval": "monthly"}
}
```

- [ ] **Step 2: Define Hub event validation**

Require event ID, event type, occurred-at timestamp, Shopify customer/order reference where applicable, membership SKU, amount, currency, subscription reference, and status. Reject secrets and raw card data.

- [ ] **Step 3: Exercise MyFatoorah test mode**

For each plan, initiate consent, complete a test payment, validate the callback signature, and confirm a single Hub `payment.succeeded` event and a single entitlement activation.

- [ ] **Step 4: Test lifecycle exceptions**

Exercise failed payment, renewal, cancellation, duplicated callback, and expiry. Confirm idempotency and the expected entitlement state after each event.

- [ ] **Step 5: Connect theme CTAs only after tests pass**

Expose the recurring buttons on membership templates after all three positive-path tests and all exception tests pass.

- [ ] **Step 6: Record evidence and commit**

```bash
git add store-rebuild/integrations store-rebuild/audit/payment-test-results.md
git commit -m "test: verify recurring membership journeys"
```

Never commit MyFatoorah keys, webhook secrets, session tokens, or personally identifiable test data.

---

### Task 9: Push and Preview the Unpublished Theme

**Files:**
- Modify: `store-rebuild/audit/staging-theme.json`
- Create: `store-rebuild/audit/theme-check.txt`

**Interfaces:**
- Consumes: Validated local Horizon theme.
- Produces: Updated unpublished theme and preview URL; does not publish.

- [ ] **Step 1: Run complete local validation**

```bash
shopify theme check --path store-rebuild/theme | tee store-rebuild/audit/theme-check.txt
node --test store-rebuild/theme/tests/*.test.mjs
```

Expected: all tests pass and Theme Check has no errors.

- [ ] **Step 2: Push to the recorded unpublished theme ID**

```bash
staging_theme_id="$(jq -r '.id' store-rebuild/audit/staging-theme.json)"
test -n "$staging_theme_id" && test "$staging_theme_id" != "null"
shopify theme push --store store.brainsait.de --theme "$staging_theme_id" --path store-rebuild/theme
```

- [ ] **Step 3: Open the preview without publication**

```bash
staging_theme_id="$(jq -r '.id' store-rebuild/audit/staging-theme.json)"
shopify theme open --store store.brainsait.de --theme "$staging_theme_id"
```

- [ ] **Step 4: Verify the live theme is unchanged**

Run `shopify theme list --store store.brainsait.de` and assert the published theme ID still equals the Task 1 baseline.

- [ ] **Step 5: Commit evidence**

```bash
git add store-rebuild/audit
git commit -m "chore: push Horizon staging preview"
```

---

### Task 10: Execute Acceptance and Regression Testing

**Files:**
- Create: `store-rebuild/qa/critical-journeys.md`
- Create: `store-rebuild/qa/link-report.json`
- Create: `store-rebuild/qa/accessibility-report.json`
- Create: `store-rebuild/qa/lighthouse-mobile.json`
- Create: `store-rebuild/qa/lighthouse-desktop.json`
- Create: `store-rebuild/qa/go-live-checklist.md`

**Interfaces:**
- Consumes: Unpublished theme preview and normalized live catalog.
- Produces: Evidence-based go/no-go checklist.

- [ ] **Step 1: Test storefront journeys**

Test header, menus, search, filters, cards, representative templates, footer, account entry, cart, empty states, and support flow at mobile and desktop widths.

- [ ] **Step 2: Test commerce journeys**

Test one-time LEARN checkout, all three recurring plans, one SOLUTIONS READY checkout, one annual OID offer, and one enterprise consultation submission.

- [ ] **Step 3: Test accessibility**

Verify keyboard completion of all critical journeys, focus visibility, landmark/heading order, form labels, dialog behavior, alt text, color contrast, and reduced-motion behavior.

- [ ] **Step 4: Test links and SEO**

Crawl the preview and canonical store routes. Require zero broken internal links, redirect loops, missing canonical tags, duplicate active handles, missing images, or unintended Arabic fragments.

- [ ] **Step 5: Test performance**

Run Lighthouse on Home, Learn collection, one LEARN product, one membership, one SOLUTIONS READY product, and one OID offer. Investigate every critical performance or accessibility failure before approval.

- [ ] **Step 6: Complete go-live checklist**

Record PASS/FAIL and evidence for every acceptance criterion from the design specification. Any critical FAIL blocks publication.

- [ ] **Step 7: Commit**

```bash
git add store-rebuild/qa
git commit -m "test: complete Shopify relaunch acceptance"
```

---

### Task 11: Final Approval, Publication, and Rollback Verification

**Files:**
- Create: `store-rebuild/audit/launch-record.json`
- Create: `store-rebuild/audit/post-launch-checks.md`

**Interfaces:**
- Consumes: Fully passing go-live checklist and explicit user approval.
- Produces: Published Horizon theme with verified rollback readiness.

- [ ] **Step 1: Present the preview and go-live evidence**

Provide the unpublished preview URL, catalog summary, payment-test summary, accessibility/performance results, known non-blocking limitations, and exact rollback theme ID.

- [ ] **Step 2: Obtain explicit final publication approval**

Do not publish on inferred approval. The user must approve the specific tested preview.

- [ ] **Step 3: Publish the recorded Horizon theme**

```bash
staging_theme_id="$(jq -r '.id' store-rebuild/audit/staging-theme.json)"
test -n "$staging_theme_id" && test "$staging_theme_id" != "null"
shopify theme publish --store store.brainsait.de --theme "$staging_theme_id"
```

- [ ] **Step 4: Run immediate production smoke tests**

Verify home, all five collections, representative products, cart, checkout entry, recurring CTA, support form, analytics, and Hub reachability.

- [ ] **Step 5: Verify rollback**

Confirm the previous published theme still exists and can be republished. Do not delete it.

- [ ] **Step 6: Record launch state and commit**

```bash
git add store-rebuild/audit/launch-record.json store-rebuild/audit/post-launch-checks.md
git commit -m "release: publish BrainSAIT Horizon storefront"
```

## Plan Self-Review

- Spec coverage: every approved specification section maps to Tasks 1–11.
- Safety: published theme preservation, archive-only catalog handling, bounded writes, test-mode billing, explicit go-live approval, and rollback are covered.
- Data flow: canonical manifest → Shopify updates → template assignment → checkout/recurring event → Hub provisioning is explicit.
- Verification: static tests, Theme Check, live re-query, recurring lifecycle tests, accessibility, SEO, links, performance, and production smoke tests are included.
- Placeholder scan: no unresolved implementation placeholders remain; live resource IDs are read from validated audit files at execution time.
