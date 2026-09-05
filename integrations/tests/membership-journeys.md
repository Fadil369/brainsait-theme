# BrainSAIT Membership Journeys

Scope: MyFatoorah recurring subscriptions for the three approved membership plans and the Hub entitlement lifecycle.

## Positive Paths

| Plan | SKU | Amount | Expected first event | Expected entitlement |
| --- | --- | ---: | --- | --- |
| LEARN-MONTHLY | BRN-LEARN-SUB-M | 182 SAR | payment.succeeded | LEARN active for 30 days |
| BUILD-MONTHLY | BRN-BUILD-SUB-M | 499 SAR | payment.succeeded | BUILD active for 30 days |
| SOLUTIONS-MONTHLY | BRN-SOL-SUB-M | 1,999 SAR | payment.succeeded | SOLUTIONS_MONTHLY active for 30 days |

## Exception Paths

| Scenario | Expected Hub event | Expected entitlement state |
| --- | --- | --- |
| Failed first payment | payment.failed | No active entitlement |
| Renewal succeeds | subscription.renewed | Existing entitlement expiry extends by 30 days |
| Duplicate callback | Same eventId replay | No duplicate entitlement or second activation |
| Customer cancellation | subscription.cancelled | Entitlement cancelled at current lifecycle rule |
| Expired or unrecovered payment | subscription.expired | Entitlement expired or suspended |

## Evidence Required Before Theme CTA Enablement

Record each result in `audit/payment-test-results.md` before enabling recurring CTAs:

- MyFatoorah mode and worker deployment URL, with secret values omitted.
- Test invoice or recurring reference, truncated to the non-sensitive public identifier.
- Webhook HTTP status and signature-verification result.
- Hub event payload validation result against `integrations/contracts/hub-events.schema.json`.
- Entitlement lookup result: ticket type, status, start date, expiry date, and duplicate count.
- Storefront access result for the issued access key, without logging the key.
