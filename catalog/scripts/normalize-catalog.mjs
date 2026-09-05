import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogDir = resolve(here, '..');
const readJson = (name) => JSON.parse(readFileSync(resolve(catalogDir, name), 'utf8'));

const shopify = readJson('source/shopify-products.json').data.products.nodes;
const oidOffers = readJson('source/oid-line-skus.json').skus;

const oidSourceMatchers = new Map([
  ['OID-BADGE', /enterprise-oid-badge-management-system/],
  ['OID-EXPLORER', /brainsait-oid-registry-explorer/],
  ['OID-FHIR', /oid-fhir-integration-platform/],
  ['OID-NPHIES', /nphies-oid-healthcare-identity-bundle/],
  ['OID-NAMESPACE', /oid-enterprise-namespace-architect/],
  ['OID-WHITELABEL', /brainsait-oid-white-label-enterprise-license/],
]);

const fixedProducts = new Map([
  ['brainsait-learn-digital-access-library-membership', {
    title: 'BrainSAIT LEARN Pass', family: 'LEARN', productType: 'LEARN Membership',
    sku: 'BRN-LEARN-SUB-M', price: 182, billingModel: 'monthly', billingLabel: '182 SAR / month',
  }],
  ['build-forge-incubator-founders-program-1', {
    title: 'BUILD — Forge Incubator Founders Program', family: 'BUILD', productType: 'BUILD Membership',
    sku: 'BRN-BUILD-SUB-M', price: 499, billingModel: 'monthly', billingLabel: '499 SAR / month',
  }],
  ['solutions-brainsait-super-partner-program-1', {
    title: 'SOLUTIONS — BrainSAIT Super Partner Program', family: 'SOLUTIONS', productType: 'SOLUTIONS Membership',
    sku: 'BRN-SOL-SUB-M', price: 1999, billingModel: 'monthly', billingLabel: '1,999 SAR / month',
  }],
  ['solutions-ready-enterprise-deployment-1', {
    title: 'SOLUTIONS READY — Enterprise Deployment', family: 'SOLUTIONS READY', productType: 'SOLUTIONS READY',
    sku: 'BRN-SOL-READY-ENT', price: 24000, billingModel: 'one_time', billingLabel: '24,000 SAR one time',
  }],
]);

const arabic = /[\u0600-\u06ff]/gu;
const html = /<[^>]*>/g;

function englishTitle(value) {
  return value.split('|')[0].replace(arabic, '').replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return englishTitle(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'brainsait-offer';
}

function englishCopy(product, title) {
  const copy = (product.descriptionHtml || '')
    .replace(html, ' ')
    .replace(arabic, '')
    .replace(/[|•]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return copy || `${title} from BrainSAIT.`;
}

function familyFor(product, title) {
  const collections = product.collections.nodes.map((item) => item.handle);
  const source = `${product.productType} ${title} ${product.handle} ${collections.join(' ')}`.toLowerCase();
  if (/solutions-ready/.test(source)) return ['SOLUTIONS READY', 'SOLUTIONS READY'];
  if (/learn|book|knowledge-base|course|blueprint|guide|notebook/.test(source)) return ['LEARN', 'LEARN Item'];
  if (/build|guided|workshop|hands-on|lab/.test(source)) return ['BUILD', 'BUILD Membership'];
  if (/oid|registry/.test(source)) return ['OID & REGISTRY', 'OID & Registry'];
  return ['SOLUTIONS', 'SOLUTIONS Membership'];
}

function canonicalScore(product) {
  let score = 0;
  if (!/-\d+$/.test(product.handle)) score += 4;
  if (!/\(\d+\)/.test(product.title)) score += 2;
  if (/english/i.test(product.title)) score += 3;
  if (/arabic/i.test(product.title)) score -= 3;
  return score;
}

const active = shopify.filter((product) => product.status === 'ACTIVE');
const reservedOidProductIds = new Set();
for (const [sku, matcher] of oidSourceMatchers) {
  const source = active.find((product) => matcher.test(product.handle));
  if (source) reservedOidProductIds.add(source.id);
}

const duplicateLosers = new Map();
const bySku = new Map();
for (const product of active.filter((item) => !reservedOidProductIds.has(item.id))) {
  const sku = product.variants.nodes.find((variant) => variant.sku)?.sku;
  if (!sku) continue;
  const peers = bySku.get(sku) || [];
  peers.push(product);
  bySku.set(sku, peers);
}
for (const [sku, peers] of bySku) {
  if (peers.length < 2) continue;
  peers.sort((a, b) => canonicalScore(b) - canonicalScore(a) || a.handle.localeCompare(b.handle));
  for (const loser of peers.slice(1)) duplicateLosers.set(loser.id, { sku, winner: peers[0] });
}

const catalog = [];
const archiveMap = shopify
  .filter((product) => product.status === 'ARCHIVED')
  .map((product) => ({ productId: product.id, reason: 'already_archived', canonicalHandle: slugify(product.handle) }));
const redirectMap = [];
const usedHandles = new Set();
const usedSkus = new Set();

function uniqueHandle(preferred) {
  let handle = preferred;
  let counter = 2;
  while (usedHandles.has(handle)) handle = `${preferred}-${counter++}`;
  usedHandles.add(handle);
  return handle;
}

function uniqueSku(preferred) {
  let sku = preferred;
  let counter = 2;
  while (usedSkus.has(sku)) sku = `${preferred}-${counter++}`;
  usedSkus.add(sku);
  return sku;
}

function billingFor(sku) {
  if (/MONTHLY|SUB-M$/.test(sku)) return ['monthly', 'Monthly'];
  if (/ANNUAL/.test(sku)) return ['annual', 'Annual'];
  return ['one_time', 'One-time purchase'];
}

for (const product of active) {
  if (reservedOidProductIds.has(product.id)) continue;
  const duplicate = duplicateLosers.get(product.id);
  if (duplicate) {
    archiveMap.push({
      productId: product.id,
      reason: `duplicate_sku:${duplicate.sku}`,
      canonicalHandle: duplicate.winner.handle,
    });
    continue;
  }

  const fixed = fixedProducts.get(product.handle);
  const title = fixed?.title || englishTitle(product.title);
  const normalizedHandle = /[\u0600-\u06ff]/u.test(product.handle) ? slugify(title) : slugify(product.handle);
  const handle = uniqueHandle(normalizedHandle);
  if (handle !== product.handle) {
    redirectMap.push({ path: `/products/${product.handle}`, target: `/products/${handle}` });
  }
  const [family, productType] = fixed ? [fixed.family, fixed.productType] : familyFor(product, title);
  const variants = fixed
    ? [{
        sourceVariantId: product.variants.nodes[0]?.id || null,
        sku: uniqueSku(fixed.sku),
        price: fixed.price,
        billingModel: fixed.billingModel,
        billingLabel: fixed.billingLabel,
      }]
    : product.variants.nodes.map((variant, index) => {
        const generated = `BRN-${family.replace(/[^A-Z]+/g, '-').replace(/^-|-$/g, '')}-${slugify(title).toUpperCase().slice(0, 36)}`;
        const sku = uniqueSku((variant.sku || `${generated}-${index + 1}`).toUpperCase().replace(/[^A-Z0-9-]/g, '-'));
        const [billingModel, billingLabel] = billingFor(sku);
        return { sourceVariantId: variant.id, sku, price: Number(variant.price), billingModel, billingLabel };
      });

  catalog.push({
    sourceProductId: product.id,
    title,
    handle,
    productType,
    family,
    vendor: 'BrainSAIT',
    variants,
    tags: [...new Set([family.toLowerCase().replaceAll(' ', '-'), variants[0].billingModel, 'brainsait', 'relaunch-2026'])],
    imageAspectRatio: '3:2',
    templateSuffix: family === 'LEARN'
      ? 'learn'
      : family === 'SOLUTIONS READY'
        ? 'solution-ready'
        : family === 'OID & REGISTRY'
          ? 'oid-registry'
          : 'membership',
    customerCopy: englishCopy(product, title),
    seo: { title: product.seo.title || title, description: product.seo.description || englishCopy(product, title).slice(0, 155) },
    disclaimer: family === 'OID & REGISTRY'
      ? 'BrainSAIT verification does not replace an independent credential authority or professional licence.'
      : null,
    sourceUpdatedAt: product.updatedAt,
  });
}

for (const offer of oidOffers) {
  const matcher = oidSourceMatchers.get(offer.sku);
  const source = active.find((product) => matcher?.test(product.handle));
  const primaryPrice = offer.prices.annual ?? offer.prices.one_time;
  const primaryModel = offer.prices.annual ? 'annual' : 'one_time';
  const variants = [{
    sourceVariantId: source?.variants.nodes[0]?.id || null,
    sku: uniqueSku(offer.sku),
    price: primaryPrice,
    billingModel: primaryModel,
    billingLabel: `${primaryPrice.toLocaleString('en-US')} SAR ${primaryModel === 'annual' ? '/ year' : 'one time'}`,
  }];
  if (offer.prices.setup) variants.push({
    sourceVariantId: null,
    sku: uniqueSku(`${offer.sku}-SETUP`),
    price: offer.prices.setup,
    billingModel: 'setup',
    billingLabel: `${offer.prices.setup.toLocaleString('en-US')} SAR setup`,
  });
  if (offer.prices.support_annual) variants.push({
    sourceVariantId: null,
    sku: uniqueSku(`${offer.sku}-SUPPORT`),
    price: offer.prices.support_annual,
    billingModel: 'support_annual',
    billingLabel: `${offer.prices.support_annual.toLocaleString('en-US')} SAR / year support`,
  });
  const handle = uniqueHandle(offer.handle);
  if (source && source.handle !== handle) {
    redirectMap.push({ path: `/products/${source.handle}`, target: `/products/${handle}` });
  }
  catalog.push({
    sourceProductId: source?.id || null,
    title: offer.title_en,
    handle,
    productType: 'OID & Registry',
    family: 'OID & REGISTRY',
    vendor: 'BrainSAIT',
    variants,
    tags: ['oid-and-registry', primaryModel, 'identity', 'governance', 'relaunch-2026'],
    imageAspectRatio: '3:2',
    templateSuffix: 'oid-registry',
    customerCopy: `${offer.title_en} provides governed identity infrastructure for ${offer.metric}.`,
    seo: { title: offer.title_en, description: `${offer.title_en} from BrainSAIT for governed, auditable digital identity.` },
    disclaimer: 'BrainSAIT verification does not replace an independent credential authority or professional licence.',
    oid: offer.oid,
    gates: offer.gates,
    overage: offer.overage,
  });
}

catalog.sort((a, b) => a.family.localeCompare(b.family) || a.title.localeCompare(b.title));
archiveMap.sort((a, b) => a.productId.localeCompare(b.productId));
redirectMap.sort((a, b) => a.path.localeCompare(b.path));

writeFileSync(resolve(catalogDir, 'catalog-canonical.json'), `${JSON.stringify(catalog, null, 2)}\n`);
writeFileSync(resolve(catalogDir, 'archive-map.json'), `${JSON.stringify(archiveMap, null, 2)}\n`);
writeFileSync(resolve(catalogDir, 'redirect-map.json'), `${JSON.stringify(redirectMap, null, 2)}\n`);

console.log(JSON.stringify({ canonical: catalog.length, archive: archiveMap.length, redirects: redirectMap.length }));
