import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const outputPath = new URL('../catalog-canonical.json', import.meta.url);
const archivePath = new URL('../archive-map.json', import.meta.url);
const redirectPath = new URL('../redirect-map.json', import.meta.url);
const arabic = /[\u0600-\u06ff]/u;
const allowedTypes = new Set([
  'LEARN Item',
  'LEARN Membership',
  'BUILD Membership',
  'SOLUTIONS Membership',
  'SOLUTIONS READY',
  'OID & Registry',
]);
const approvedMembershipPrices = new Map([
  ['BRN-LEARN-SUB-M', 182],
  ['BRN-BUILD-SUB-M', 499],
  ['BRN-SOL-SUB-M', 1999],
  ['BRN-SOL-READY-ENT', 24000],
]);
const approvedOidPrices = new Map([
  ['OID-BADGE', 9900],
  ['OID-EXPLORER', 24000],
  ['OID-FHIR', 120000],
  ['OID-NPHIES', 180000],
  ['OID-NAMESPACE', 240000],
  ['OID-WHITELABEL', 480000],
]);

function loadOutputs() {
  assert.equal(existsSync(outputPath), true, 'normalizer must create catalog-canonical.json');
  assert.equal(existsSync(archivePath), true, 'normalizer must create archive-map.json');
  assert.equal(existsSync(redirectPath), true, 'normalizer must create redirect-map.json');
  return {
    catalog: JSON.parse(readFileSync(outputPath, 'utf8')),
    archiveMap: JSON.parse(readFileSync(archivePath, 'utf8')),
    redirectMap: JSON.parse(readFileSync(redirectPath, 'utf8')),
  };
}

test('emits one English canonical record with unique handles and SKUs', () => {
  const { catalog } = loadOutputs();
  assert.ok(catalog.length > 0);
  const handles = new Set();
  const skus = new Set();
  for (const product of catalog) {
    assert.equal(arabic.test(product.title), false, product.title);
    assert.equal(arabic.test(product.customerCopy), false, product.handle);
    assert.match(product.handle, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(handles.has(product.handle), false, `duplicate handle ${product.handle}`);
    handles.add(product.handle);
    assert.equal(allowedTypes.has(product.productType), true, product.productType);
    assert.equal(product.vendor, 'BrainSAIT');
    assert.equal(product.imageAspectRatio, '3:2');
    for (const variant of product.variants) {
      assert.match(variant.sku, /^[A-Z0-9-]+$/);
      assert.equal(skus.has(variant.sku), false, `duplicate SKU ${variant.sku}`);
      skus.add(variant.sku);
      assert.ok(Number.isFinite(variant.price) && variant.price > 0, variant.sku);
      assert.ok(variant.billingLabel.length > 0, variant.sku);
    }
  }
});

test('uses the approved membership and OID price architecture', () => {
  const { catalog } = loadOutputs();
  const variants = new Map(catalog.flatMap((product) => product.variants.map((variant) => [variant.sku, variant.price])));
  for (const [sku, price] of [...approvedMembershipPrices, ...approvedOidPrices]) {
    assert.equal(variants.get(sku), price, sku);
  }
});

test('includes all five commercial pathways and verification disclaimers', () => {
  const { catalog } = loadOutputs();
  const families = new Set(catalog.map((product) => product.family));
  assert.deepEqual(families, new Set(['LEARN', 'BUILD', 'SOLUTIONS', 'SOLUTIONS READY', 'OID & REGISTRY']));
  for (const product of catalog.filter((item) => item.family === 'OID & REGISTRY')) {
    assert.match(product.disclaimer, /does not replace.*credential|independent credential authorit/i, product.handle);
  }
});

test('records every duplicate archive and changed-handle redirect explicitly', () => {
  const { archiveMap, redirectMap } = loadOutputs();
  assert.ok(Array.isArray(archiveMap) && archiveMap.length > 0);
  assert.ok(Array.isArray(redirectMap));
  for (const item of archiveMap) {
    assert.ok(item.productId && item.reason && item.canonicalHandle);
  }
  for (const item of redirectMap) {
    assert.match(item.path, /^\/products\//);
    assert.match(item.target, /^\/products\//);
    assert.notEqual(item.path, item.target);
  }
});
