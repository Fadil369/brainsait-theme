# BrainSAIT Shopify Store Relaunch — Design Specification

Date: 2026-09-05
Status: Approved design; pending implementation-plan approval
Store: `store.brainsait.de`
Platform: Existing Shopify Basic store
Theme direction: Shopify Horizon, dark premium
Language: English only
Currency: SAR

## 1. Objective

Rebuild the BrainSAIT storefront inside the existing Shopify store as a focused, premium, production-ready commerce experience. Preserve customers, orders, domain continuity, checkout configuration, and valuable URLs while replacing the storefront theme and rationalizing the catalog.

The relaunch must unify four commercial pathways:

1. LEARN
2. BUILD
3. SOLUTIONS and SOLUTIONS READY
4. OID & REGISTRY

The current published theme remains live until the replacement passes acceptance testing. All catalog restructuring is recoverable: obsolete or duplicate products are archived rather than deleted.

## 2. Success Criteria

- A new unpublished Horizon theme is configured and validated before publication.
- Navigation exposes the four primary product pathways without ambiguity.
- Customer-facing text is consistent, concise, and English-only.
- All retained products have normalized titles, handles, SKUs, product types, tags, prices, billing labels, descriptions, imagery, SEO metadata, and collection membership.
- Duplicate and superseded items are archived without deleting commerce history.
- One-time and recurring purchase journeys function end to end.
- MyFatoorah recurring billing supports LEARN Pass, BUILD, and SOLUTIONS.
- Hub automation receives successful, failed, renewed, and cancelled billing events for provisioning and audit workflows.
- Mobile, accessibility, performance, navigation, cart, checkout, account, and SEO tests pass before theme publication.

## 3. Scope

### Included

- Existing live Shopify store and `store.brainsait.de`
- New unpublished Horizon theme
- Storefront information architecture and navigation
- Homepage, collection templates, product templates, cart, search, account entry points, About, Support, and policy links
- Catalog audit, normalization, deduplication, archiving, collection assignment, merchandising, and SEO preservation
- Four product-family experiences
- MyFatoorah recurring purchase journeys
- Hub-triggered provisioning and operational events
- Launch checklist, rollback path, and post-launch checks

### Excluded from the initial relaunch

- Moving to the development store
- Headless commerce
- A custom Shopify app unless a verified gap blocks required recurring billing or provisioning
- Arabic localization
- Replacing official Saudi credential authorities
- Deleting historical products, orders, customers, or payment records

## 4. Information Architecture

Primary navigation:

- Home
- Learn
- Build
- Solutions
- OID & Registry
- About
- Support

Utility navigation:

- Search
- Account
- Cart

Footer:

- Contact
- FAQ
- Delivery and access policy
- Subscription and cancellation policy
- Refund policy
- Privacy policy
- Terms of service
- Credential and verification disclaimer

### Homepage sequence

1. Hero: “From Knowledge to Production”
2. Four pathway cards: Learn, Build, Solutions, OID & Registry
3. Featured offers and memberships
4. Solutions Ready highlights
5. OID and registry trust section
6. BrainSAIT delivery model
7. Trust, governance, and compliance signals
8. Final pathway selector and support CTA

## 5. Catalog Model

### Canonical product families

| Family | Commercial model | Primary CTA |
| --- | --- | --- |
| LEARN item | One-time purchase | Buy now |
| LEARN Pass | 182 SAR/month | Start membership |
| BUILD | 499 SAR/month | Join BUILD |
| SOLUTIONS | 1,999 SAR/month | Become a member |
| SOLUTIONS READY | 24,000 SAR one-time | Deploy this solution |
| OID & REGISTRY | Annual, setup, support, or qualified sale | Select plan / Request consultation |

### OID & Registry offers

| SKU | Offer | Price architecture |
| --- | --- | --- |
| OID-BADGE | OID Verification Badge | 9,900 SAR/year; 990 SAR/month shown only where operationally valid |
| OID-EXPLORER | OID Registry Explorer Seat | 24,000 SAR/year |
| OID-FHIR | OID FHIR Integration Platform | 120,000 SAR one-time |
| OID-NPHIES | NPHIES–OID Healthcare Identity Bundle | 180,000 SAR setup plus 48,000 SAR/year support |
| OID-NAMESPACE | OID Enterprise Namespace License | 48,000 SAR setup plus 240,000 SAR/year |
| OID-WHITELABEL | OID White-Label Enterprise | From 480,000 SAR/year, qualified sale |

### Normalization rules

- Customer-facing titles are English only.
- Vendor is `BrainSAIT`.
- Product type is selected from a controlled vocabulary.
- Tags encode family, billing model, delivery method, industry, lifecycle, and source.
- SKUs are unique, stable, uppercase, and aligned with the approved product maps.
- Handles remain stable where they have SEO or external-link value; redirects are created when handles change.
- Every active offer includes outcome, audience, inclusions, delivery, prerequisites, billing, support, FAQ, and CTA.
- All product cards use consistent 3:2 imagery.
- Duplicate or superseded offers are archived, not deleted.

## 6. Product Templates

### LEARN template

- Learning outcome
- Audience and level
- Format and delivery
- Table of contents or curriculum
- Individual price
- LEARN Pass comparison
- Access terms
- Related learning products

### Membership template

- Membership outcome
- Included services
- 30-day billing cycle
- Onboarding and provisioning steps
- Renewal, cancellation, and access rules
- MyFatoorah recurring action

### SOLUTIONS READY template

- Business problem
- Solution capabilities
- Included deployment scope
- Prerequisites and exclusions
- Delivery stages
- Support boundary
- One-time price or qualified-sales escalation

### OID & Registry template

- Offer outcome and intended customer
- Canonical OID/SKU where appropriate
- Verification or integration scope
- Included limits and overages
- Governance and auditability
- Implementation and support requirements
- Independent credential-authority disclaimer
- Purchase or consultation action

## 7. Payment and Provisioning

### One-time flow

Shopify product → cart or accelerated purchase → Shopify checkout using current payment configuration → paid order event → Hub automation → entitlement/delivery → confirmation and audit record.

### Recurring flow

Membership product → clearly labeled recurring CTA → MyFatoorah recurring agreement and customer consent → verified payment event → Hub automation → access provisioning → renewal monitoring → access/status updates on renewal, failure, cancellation, or expiration.

Recurring products:

- LEARN Pass: 182 SAR/month
- BUILD: 499 SAR/month
- SOLUTIONS: 1,999 SAR/month

### Enterprise flow

High-value OID, FHIR, NPHIES, namespace, and white-label offers use a structured qualification form where implementation scope, contractual terms, or variable overages prevent immediate self-service checkout. Fixed and safe offers may use direct checkout.

No recurring CTA may be published until its MyFatoorah flow and webhook outcome are tested. No product may imply that BrainSAIT verification replaces SCFHS or another official authority.

## 8. Hub Integration

The storefront and billing layer emit normalized events for:

- Checkout or recurring agreement initiated
- Payment succeeded
- Payment failed
- Subscription renewed
- Subscription cancelled
- Entitlement activated
- Entitlement suspended or expired
- Enterprise lead submitted

Hub workflows coordinate email, onboarding, Lark records, fulfillment, monitoring, and audit history. Events must be idempotent and must not expose secrets in storefront code.

## 9. Visual System

- Theme: Horizon
- Default mode: dark
- Palette: obsidian, graphite, warm ivory, restrained champagne gold, focused electric teal
- Typography: modern sans-serif with a disciplined hierarchy
- Surfaces: subtle glass treatment and low-contrast gradients
- Spacing: generous and consistent
- Motion: restrained reveals and hover feedback; reduced-motion support
- Cards: 3:2 image, family badge, outcome, billing label, price, details CTA, and purchase CTA where appropriate
- Product imagery must be consistent within each family but distinct across families.

The site avoids decorative clutter, neon overload, heavy animation frameworks, autoplay media, and excessive glass effects.

## 10. UX, Accessibility, and Performance

- Mobile-first layouts and controls
- Semantic headings and landmarks
- Keyboard-operable navigation, filters, dialogs, and forms
- Visible focus states
- WCAG-oriented contrast
- Meaningful alt text
- Reduced-motion behavior
- Predictable button labels
- Lazy-loaded and responsive images
- Minimal third-party scripts
- No checkout decoration that reduces clarity
- Empty, loading, error, and unavailable states for dynamic journeys

## 11. SEO and Redirects

- Preserve useful product and collection handles.
- Create redirects before publishing any changed handle.
- Normalize meta titles and descriptions.
- Keep one canonical active listing per offer.
- Remove mixed-language fragments from English metadata.
- Preserve product structured data supplied by Shopify.
- Validate canonical URLs, sitemap visibility, robots behavior, and social previews.

## 12. Implementation Safety

1. Export a catalog snapshot and record the published theme ID.
2. Build only in an unpublished Horizon theme.
3. Apply catalog changes in bounded batches with before/after logs.
4. Archive duplicates only after canonical products and redirects are verified.
5. Test payment journeys in test mode where supported.
6. Run acceptance tests against preview URLs.
7. Publish the theme only after explicit final go-live approval.
8. Keep the previous theme available for immediate rollback.

## 13. Acceptance Tests

### Storefront

- Header, menus, search, filters, cards, product templates, footer, account, and cart work on mobile and desktop.
- All four pathways are discoverable within one navigation decision.
- No active product contains unintended Arabic fragments or conflicting billing text.

### Catalog

- Active SKUs are unique.
- Prices and billing labels match the approved model.
- Every active product belongs to the correct collection.
- Duplicates are archived and canonical replacements are linked.
- Redirects resolve without loops.

### Commerce

- One-time LEARN checkout completes.
- Each monthly membership creates the correct recurring agreement.
- Renewal, failure, cancellation, and expiry events produce correct entitlement changes.
- Enterprise lead submissions reach the correct workflow.
- Order confirmations and access instructions are accurate.

### Quality

- Accessibility keyboard checks pass on critical journeys.
- No critical contrast failures.
- Core pages meet agreed performance thresholds on representative mobile connections.
- Broken links, missing images, console errors, and duplicate metadata are resolved.

## 14. Launch and Rollback

Launch is a controlled theme publication after final approval. Immediately after publication, verify home, collections, representative products, cart, checkout, recurring CTA, support form, analytics, and Hub events.

Rollback consists of republishing the previous theme. Catalog mutations are logged and recoverable; products are archived rather than deleted. Domain and checkout configuration are not changed during theme publication.

## 15. Implementation Sequence

1. Backup and live-state inventory
2. Catalog canonicalization map
3. Unpublished Horizon theme installation
4. Design tokens, global shell, navigation, and footer
5. Homepage and collection templates
6. Four product-template families
7. Product normalization and collection assignment
8. MyFatoorah recurring and Hub event validation
9. SEO redirects and metadata
10. Full acceptance testing
11. Final launch approval
12. Theme publication and post-launch monitoring

## 16. Decisions Already Approved

- Rebuild inside the existing `store.brainsait.de` Shopify store.
- Preserve customers, orders, domain, checkout, and history.
- Use an unpublished Horizon theme with a dark premium visual direction.
- English-only storefront.
- Use both individual LEARN purchases and a 182 SAR/month LEARN Pass.
- Use MyFatoorah recurring billing for monthly memberships.
- Use the approved information architecture, catalog policy, payment journey, and visual system described in this document.
