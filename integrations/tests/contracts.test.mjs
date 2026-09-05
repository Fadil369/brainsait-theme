import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const plans = JSON.parse(readFileSync(new URL('../contracts/membership-plans.json', import.meta.url), 'utf8'));
const schema = JSON.parse(readFileSync(new URL('../contracts/hub-events.schema.json', import.meta.url), 'utf8'));

test('membership contract uses the approved relaunch recurring prices', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(plans.plans).map(([id, plan]) => [id, plan.amount])),
    {
      'LEARN-MONTHLY': 182,
      'BUILD-MONTHLY': 499,
      'SOLUTIONS-MONTHLY': 1999,
    },
  );
  for (const plan of Object.values(plans.plans)) {
    assert.equal(plan.currency, 'SAR');
    assert.equal(plan.interval, 'monthly');
    assert.equal(plan.periodDays, 30);
  }
});

test('hub event schema accepts only lifecycle event names used by memberships', () => {
  assert.deepEqual(schema.properties.eventType.enum, [
    'payment.succeeded',
    'payment.failed',
    'subscription.renewed',
    'subscription.cancelled',
    'subscription.expired',
  ]);
  assert.deepEqual(schema.properties.membership.properties.planId.enum, [
    'LEARN-MONTHLY',
    'BUILD-MONTHLY',
    'SOLUTIONS-MONTHLY',
  ]);
});

test('hub event schema rejects obvious secret and raw card fields', () => {
  const forbidden = schema.not.anyOf.flatMap((rule) => rule.required);
  assert.deepEqual(forbidden, ['cardNumber', 'cvv', 'token', 'secret', 'rawCardData']);
});
