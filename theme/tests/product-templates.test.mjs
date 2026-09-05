import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const parse = (source) => JSON.parse(source.replace(/^\/\*[\s\S]*?\*\//, '').trim());

const templates = {
  learn: ['main', 'outcome', 'deliverables', 'billing', 'faq', 'related-products'],
  membership: ['main', 'outcome', 'deliverables', 'billing', 'governance', 'faq'],
  'solution-ready': ['main', 'outcome', 'deliverables', 'billing', 'governance', 'faq'],
  'oid-registry': ['main', 'outcome', 'deliverables', 'billing', 'governance', 'faq'],
};

for (const [name, required] of Object.entries(templates)) {
  test(`${name} template includes its required product journey`, async () => {
    const template = parse(await read(`templates/product.${name}.json`));
    for (const id of required) assert.ok(template.order.includes(id), `${name} is missing ${id}`);
  });
}

test('product sections use canonical metafields with safe empty states', async () => {
  const files = await Promise.all(['product-outcome', 'product-deliverables', 'product-billing', 'product-governance', 'product-faq'].map((name) => read(`sections/${name}.liquid`)));
  const content = files.join('\n');
  for (const key of ['outcome', 'audience', 'inclusions', 'delivery', 'prerequisites', 'billing_label', 'support', 'faq', 'oid', 'limits', 'overage', 'disclaimer']) {
    assert.match(content, new RegExp(`metafields\\.brainsait\\.${key}`), `missing brainsait.${key}`);
  }
  assert.match(content, /!= blank/);
});

test('relaunch product templates use the clean premium product section, not the inherited legacy section', async () => {
  for (const name of ['product', 'product.learn', 'product.membership', 'product.solution-ready', 'product.oid-registry']) {
    const template = parse(await read(`templates/${name}.json`));
    assert.equal(template.sections.main.type, 'brainsait-product-premium', `${name} must use the clean premium product section`);
    assert.notEqual(template.sections.main.type, 'bs-product-detail', `${name} must not use inherited legacy product detail`);
  }
});

test('premium product and card surfaces stay compact and restrained', async () => {
  const premium = await read('sections/brainsait-product-premium.liquid');
  const card = await read('snippets/brainsait-product-card.liquid');
  const css = await read('assets/brainsait-tokens.css');

  assert.match(premium, /brainsait-product-premium__grid/);
  assert.match(premium, /Ask before buying/);
  assert.match(premium, /Membership checkout is being validated/);
  assert.doesNotMatch(premium, /bs-visible-ar|bs-lang-toggle|ب/u);
  assert.match(card, /truncate:\s*112/);
  assert.match(css, /-webkit-line-clamp:\s*3/);
  assert.match(css, /brainsait-product-premium__terms/);
  assert.doesNotMatch(css, /box-shadow:\s*var\(--bs-shadow-gold\)/);
});

test('billing makes recurring and enterprise behavior explicit', async () => {
  const billing = await read('sections/product-billing.liquid');
  assert.match(billing, /30-day billing cycle/i);
  assert.match(billing, /renewal/i);
  assert.match(billing, /cancell/i);
  assert.match(billing, /data-mf-pay/);
  assert.match(billing, /Request consultation/);
  assert.match(billing, /purchase_mode/);
});

test('OID governance includes independent-authority disclaimer', async () => {
  const governance = await read('sections/product-governance.liquid');
  assert.match(governance, /does not replace professional licensure, regulatory approval, or independent compliance review/i);
  assert.match(governance, /metafields\.brainsait\.disclaimer/);
});
