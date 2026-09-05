import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildCatalogPlan,
  runCatalogApply,
  METAFIELD_DEFINITIONS,
  PRIMARY_COLLECTIONS,
} from '../scripts/apply-catalog.mjs';

const sampleCatalog = [
  {
    sourceProductId: 'gid://shopify/Product/1',
    title: 'BrainSAIT LEARN Pass',
    handle: 'brainsait-learn-pass',
    productType: 'LEARN Membership',
    family: 'LEARN',
    vendor: 'BrainSAIT',
    variants: [{ sourceVariantId: 'gid://shopify/ProductVariant/11', sku: 'BRN-LEARN-SUB-M', price: 182, billingModel: 'monthly', billingLabel: '182 SAR / month' }],
    tags: ['learn', 'monthly', 'brainsait', 'relaunch-2026'],
    templateSuffix: 'learn',
    customerCopy: 'Complete Learn library access.',
    seo: { title: 'BrainSAIT LEARN Pass', description: 'Complete Learn library access.' },
    disclaimer: null,
  },
  {
    sourceProductId: 'gid://shopify/Product/2',
    title: 'OID Namespace Lease',
    handle: 'oid-namespace-lease',
    productType: 'OID & Registry',
    family: 'OID & REGISTRY',
    vendor: 'BrainSAIT',
    variants: [{ sourceVariantId: 'gid://shopify/ProductVariant/22', sku: 'OID-NAMESPACE', price: 240000, billingModel: 'annual', billingLabel: '240,000 SAR / year' }],
    tags: ['oid-and-registry', 'annual', 'brainsait', 'relaunch-2026'],
    templateSuffix: 'oid-registry',
    customerCopy: 'Governed identity infrastructure.',
    seo: { title: 'OID Namespace Lease', description: 'Governed identity infrastructure.' },
    disclaimer: 'BrainSAIT verification does not replace an independent credential authority or professional licence.',
    oid: '1.3.6.1.4.1.61026.1',
    gates: ['authority_review'],
    overage: 'Custom enterprise overage.',
  },
];

const sampleArchive = [
  { productId: 'gid://shopify/Product/99', reason: 'duplicate_sku:ABC', canonicalHandle: 'brainsait-learn-pass' },
  { productId: 'gid://shopify/Product/100', reason: 'already_archived', canonicalHandle: 'old' },
];

const sampleRedirects = [
  { path: '/products/old-learn-pass', target: '/products/brainsait-learn-pass' },
];

test('buildCatalogPlan creates bounded batches and skips already matching products', () => {
  const current = new Map(sampleCatalog.map((product) => [product.sourceProductId, matchingCurrentProduct(product)]));

  const plan = buildCatalogPlan({
    catalog: sampleCatalog,
    archiveMap: sampleArchive,
    redirectMap: sampleRedirects,
    currentProducts: current,
    currentCollections: new Map(PRIMARY_COLLECTIONS.map((collection) => [collection.handle, { ...collection, id: `gid://shopify/Collection/${collection.handle}` }])),
    existingRedirects: new Set(['/products/old-learn-pass']),
    batchSize: 1,
  });

  assert.equal(plan.productBatches.length, 0);
  assert.equal(plan.collectionWrites.length, 0);
  assert.equal(plan.redirectWrites.length, 0);
  assert.deepEqual(plan.archiveWrites.map((item) => item.productId), ['gid://shopify/Product/99']);
});

test('buildCatalogPlan creates product batches of at most ten products', () => {
  const catalog = Array.from({ length: 21 }, (_, index) => ({
    ...sampleCatalog[0],
    sourceProductId: `gid://shopify/Product/${index + 1}`,
    handle: `product-${index + 1}`,
    title: `Product ${index + 1}`,
    variants: [{ ...sampleCatalog[0].variants[0], sourceVariantId: `gid://shopify/ProductVariant/${index + 1}`, sku: `SKU-${index + 1}` }],
  }));

  const plan = buildCatalogPlan({
    catalog,
    archiveMap: [],
    redirectMap: [],
    currentProducts: new Map(),
    currentCollections: new Map(PRIMARY_COLLECTIONS.map((collection) => [collection.handle, { ...collection, id: `gid://shopify/Collection/${collection.handle}` }])),
    existingRedirects: new Set(),
  });

  assert.deepEqual(plan.productBatches.map((batch) => batch.length), [10, 10, 1]);
});

test('buildCatalogPlan updates products when variant commercial fields are stale', () => {
  const current = new Map([[sampleCatalog[0].sourceProductId, {
    ...sampleCatalog[0],
    status: 'ACTIVE',
    variants: [{ id: 'gid://shopify/ProductVariant/11', sku: 'OLD-SKU', price: 1 }],
    metafields: {
      family: 'LEARN',
      outcome: 'Complete Learn library access.',
      deliverables: JSON.stringify(['Digital delivery after purchase', 'BrainSAIT support channel', 'English product experience']),
      billing_model: 'monthly',
      billing_label: '182 SAR / month',
      governance_note: 'Digital products and services are delivered under BrainSAIT commercial terms and require appropriate implementation review before production use.',
      faq: JSON.stringify([
        { question: 'How is this delivered?', answer: 'Access details are provided after checkout.' },
        { question: 'Is support included?', answer: 'BrainSAIT support is included according to the product scope and billing model.' },
      ]),
      image_aspect_ratio: '3:2',
    },
  }]]);

  const plan = buildCatalogPlan({
    catalog: sampleCatalog.slice(0, 1),
    archiveMap: [],
    redirectMap: [],
    currentProducts: current,
    currentCollections: new Map(),
    existingRedirects: new Set(),
  });

  assert.equal(plan.productBatches.length, 1);
  assert.equal(plan.productBatches[0][0].sourceProductId, sampleCatalog[0].sourceProductId);
});

test('dry run writes a redacted audit log without calling Shopify mutations', async () => {
  const calls = [];
  const auditPath = join(mkdtempSync(join(tmpdir(), 'brainsait-catalog-')), 'audit.json');
  const client = async (operation, variables) => {
    calls.push({ operation, variables });
    return { data: { shop: { name: 'BrainSAIT' } } };
  };

  const result = await runCatalogApply({
    catalog: sampleCatalog,
    archiveMap: sampleArchive,
    redirectMap: sampleRedirects,
    client,
    auditPath,
    dryRun: true,
    currentProducts: new Map(),
    currentCollections: new Map(),
    existingRedirects: new Set(),
  });

  assert.equal(calls.length, 0);
  assert.equal(result.mode, 'dry-run');
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  assert.equal(audit.mode, 'dry-run');
  assert.equal(audit.counts.products, 2);
  assert.equal(JSON.stringify(audit).includes('shpat_'), false);
});

test('apply retries retryable transport failures and records audit operations', async () => {
  const auditPath = join(mkdtempSync(join(tmpdir(), 'brainsait-catalog-')), 'audit.json');
  let attempts = 0;
  const client = async (operation) => {
    if (operation === 'ProductUpdate' && attempts++ === 0) {
      const error = new Error('rate limited');
      error.retryable = true;
      throw error;
    }
    return successPayload(operation);
  };

  const result = await runCatalogApply({
    catalog: sampleCatalog.slice(0, 1),
    archiveMap: [],
    redirectMap: [],
    client,
    auditPath,
    dryRun: false,
    currentProducts: new Map(),
    currentCollections: new Map(PRIMARY_COLLECTIONS.map((collection) => [collection.handle, { ...collection, id: `gid://shopify/Collection/${collection.handle}` }])),
    existingRedirects: new Set(),
  });

  assert.equal(attempts, 2);
  assert.equal(result.userErrors.length, 0);
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  assert.equal(audit.operations.some((entry) => entry.operation === 'ProductUpdate'), true);
});

test('apply resolves stale canonical variant ids through live SKU matches', async () => {
  const auditPath = join(mkdtempSync(join(tmpdir(), 'brainsait-catalog-')), 'audit.json');
  const variantOperations = [];
  const client = async (operation, variables) => {
    if (operation === 'ProductVariantsBulkUpdate') variantOperations.push(variables);
    return successPayload(operation);
  };

  await runCatalogApply({
    catalog: sampleCatalog.slice(0, 1),
    archiveMap: [],
    redirectMap: [],
    client,
    auditPath,
    dryRun: false,
    currentProducts: new Map([[sampleCatalog[0].sourceProductId, {
      ...sampleCatalog[0],
      status: 'ACTIVE',
      variants: [{ id: 'gid://shopify/ProductVariant/live', sku: 'BRN-LEARN-SUB-M', price: 1 }],
      options: [{ name: 'Title' }],
      metafields: {},
    }]]),
    currentCollections: new Map(PRIMARY_COLLECTIONS.map((collection) => [collection.handle, { ...collection, id: `gid://shopify/Collection/${collection.handle}` }])),
    existingRedirects: new Set(),
  });

  assert.equal(variantOperations[0].variants[0].id, 'gid://shopify/ProductVariant/live');
});

test('apply stops a product batch on Shopify user errors', async () => {
  const auditPath = join(mkdtempSync(join(tmpdir(), 'brainsait-catalog-')), 'audit.json');
  const client = async (operation) => {
    if (operation === 'ProductUpdate') {
      return { data: { productUpdate: { product: null, userErrors: [{ field: ['product', 'handle'], message: 'Handle has already been taken' }] } } };
    }
    return successPayload(operation);
  };

  await assert.rejects(
    () => runCatalogApply({
      catalog: sampleCatalog,
      archiveMap: [],
      redirectMap: [],
      client,
      auditPath,
      dryRun: false,
      currentProducts: new Map(),
      currentCollections: new Map(PRIMARY_COLLECTIONS.map((collection) => [collection.handle, { ...collection, id: `gid://shopify/Collection/${collection.handle}` }])),
      existingRedirects: new Set(),
    }),
    /Handle has already been taken/,
  );
});

function successPayload(operation) {
  switch (operation) {
    case 'MetafieldDefinitionCreate':
      return { data: { metafieldDefinitionCreate: { createdDefinition: { id: 'gid://shopify/MetafieldDefinition/1', key: 'x', namespace: 'brainsait' }, userErrors: [] } } };
    case 'CollectionCreate':
    case 'CollectionUpdate':
    case 'CollectionAddProducts':
      return { data: { [operation[0].toLowerCase() + operation.slice(1)]: { collection: { id: 'gid://shopify/Collection/1', handle: 'learn', title: 'Learn' }, userErrors: [] } } };
    case 'ProductUpdate':
      return { data: { productUpdate: { product: { id: 'gid://shopify/Product/1', handle: 'x', status: 'ACTIVE' }, userErrors: [] } } };
    case 'ProductVariantsBulkUpdate':
      return { data: { productVariantsBulkUpdate: { product: { id: 'gid://shopify/Product/1' }, productVariants: [], userErrors: [] } } };
    case 'ProductVariantsBulkCreate':
      return { data: { productVariantsBulkCreate: { product: { id: 'gid://shopify/Product/1' }, productVariants: [], userErrors: [] } } };
    case 'MetafieldsSet':
      return { data: { metafieldsSet: { metafields: [], userErrors: [] } } };
    case 'UrlRedirectCreate':
      return { data: { urlRedirectCreate: { urlRedirect: { id: 'gid://shopify/UrlRedirect/1', path: '/products/a', target: '/products/b' }, userErrors: [] } } };
    default:
      throw new Error(`Unexpected operation ${operation}`);
  }
}

function matchingCurrentProduct(product) {
  const metafields = {
    family: product.family,
    outcome: product.customerCopy,
    deliverables: JSON.stringify(defaultDeliverables(product)),
    billing_model: product.variants[0].billingModel,
    billing_label: product.variants[0].billingLabel,
    governance_note: product.disclaimer || defaultGovernance(product),
    faq: JSON.stringify(defaultFaq(product)),
    image_aspect_ratio: product.imageAspectRatio || '3:2',
  };
  if (product.oid) metafields.oid = product.oid;
  if (product.gates) metafields.gates = JSON.stringify(product.gates);
  if (product.overage) metafields.overage = product.overage;
  return {
    ...product,
    status: 'ACTIVE',
    variants: product.variants.map((variant) => ({ id: variant.sourceVariantId, sku: variant.sku, price: variant.price })),
    collections: [product.family],
    metafields,
  };
}

function defaultDeliverables(product) {
  if (product.family === 'LEARN') return ['Digital delivery after purchase', 'BrainSAIT support channel', 'English product experience'];
  if (product.family === 'SOLUTIONS READY') return ['Kickoff booking', 'Infrastructure intake', 'Deployment package'];
  if (product.family === 'OID & REGISTRY') return ['Registry record', 'Governance review', 'Verification workflow'];
  return ['Guided onboarding', 'Workspace access', 'Implementation support'];
}

function defaultGovernance(product) {
  if (product.family === 'OID & REGISTRY') return 'BrainSAIT verification does not replace an independent credential authority or professional licence.';
  return 'Digital products and services are delivered under BrainSAIT commercial terms and require appropriate implementation review before production use.';
}

function defaultFaq(product) {
  return [
    { question: 'How is this delivered?', answer: product.family === 'SOLUTIONS READY' ? 'The BrainSAIT team starts with kickoff and infrastructure intake.' : 'Access details are provided after checkout.' },
    { question: 'Is support included?', answer: 'BrainSAIT support is included according to the product scope and billing model.' },
  ];
}
