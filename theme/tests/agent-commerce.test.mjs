import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('product detail exposes passive agent commerce metadata without changing checkout', async () => {
  const detail = await read('sections/bs-product-detail.liquid');
  const manifest = await read('snippets/brainsait-agent-commerce.liquid');

  assert.match(detail, /render 'brainsait-agent-commerce', product: product/);
  assert.match(detail, /data-agent-commerce-detail/);
  assert.match(manifest, /application\/ld\+json/);
  assert.match(manifest, /data-brainsait-agent-commerce/);
  assert.match(manifest, /data-brainsait-agent-manifest/);
  assert.match(manifest, /metafields\.brainsait\.family/);
  assert.match(manifest, /metafields\.brainsait\.purchase_mode/);
  assert.match(manifest, /metafields\.brainsait\.billing_model/);
  assert.match(manifest, /metafields\.brainsait\.oid/);
  assert.match(manifest, /"pen": "61026"/);
  assert.match(manifest, /gated_myfatoorah_recurring/);
});

test('storefront head advertises BrainSAIT agent commerce discovery surfaces', async () => {
  const layout = await read('layout/theme.liquid');

  assert.match(layout, /rel="ai-catalog"/);
  assert.match(layout, /https:\/\/bot\.brainsait\.org\/\.well-known\/ai-catalog\.json/);
  assert.match(layout, /rel="ucp"/);
  assert.match(layout, /https:\/\/bot\.brainsait\.org\/\.well-known\/ucp/);
  assert.match(layout, /rel="agent-card"/);
  assert.match(layout, /https:\/\/ucp-agent\.brainsait-fadil\.workers\.dev\/\.well-known\/agent-card\.json/);
  assert.match(layout, /rel="ucp-agent"/);
});

test('collection product cards expose compact agent-readable purchase attributes', async () => {
  const card = await read('snippets/brainsait-product-card.liquid');

  assert.match(card, /data-agent-commerce-card/);
  assert.match(card, /data-product-handle/);
  assert.match(card, /data-product-family/);
  assert.match(card, /data-purchase-mode/);
  assert.match(card, /data-variant-id/);
  assert.match(card, /form 'product'/);
});
