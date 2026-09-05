import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const parseShopifyJson = (source) => JSON.parse(source.replace(/^\/\*[\s\S]*?\*\//, '').trim());

test('homepage follows the approved merchandising sequence', async () => {
  const template = parseShopifyJson(await read('templates/index.json'));
  const types = template.order.map((id) => template.sections[id].type);
  assert.deepEqual(types, [
    'brainsait-hero', 'pathway-grid', 'featured-offers', 'featured-offers',
    'trust-governance', 'trust-governance', 'trust-governance', 'pathway-grid',
  ]);
});

test('hero and pathway grid use semantic headings and four canonical pathways', async () => {
  const hero = await read('sections/brainsait-hero.liquid');
  const css = await read('assets/brainsait-tokens.css');
  const pathways = await read('sections/pathway-grid.liquid');
  assert.match(hero, /<h1[\s>]/);
  assert.match(hero, /From Knowledge to Production/);
  assert.match(css, /brainsait-button[^}]*font-size:\s*var\(--bs-text-sm\)/s);
  assert.match(css, /brainsait-button[^}]*line-height:\s*1\.2/s);
  assert.match(pathways, /<h2[\s>]/);
  for (const handle of ['learn', 'build', 'solutions', 'oid-registry']) {
    assert.match(pathways, new RegExp(`collections\\.url \\}\\}/${handle}|collections_url \\}\\}/${handle}`));
  }
  assert.equal((pathways.match(/class="brainsait-pathway-card"/g) || []).length, 4);
});

test('standardized product card exposes image, outcome, billing, price, and predictable actions', async () => {
  const card = await read('snippets/brainsait-product-card.liquid');
  const css = await read('assets/brainsait-tokens.css');
  assert.match(card, /image_url:\s*width:/);
  assert.match(card, /widths:/);
  assert.match(css, /brainsait-product-card__media[^}]*aspect-ratio:\s*4\s*\/\s*3/s);
  assert.match(card, /product\.metafields\.brainsait\.outcome/);
  assert.match(card, /product\.metafields\.brainsait\.billing_label/);
  assert.match(card, /money_with_currency/);
  assert.match(card, /View details/);
  assert.match(card, /form\s+'product'/);
  assert.match(card, /Request consultation/);
});

test('featured offers and collections preserve native Shopify discovery controls', async () => {
  const collectionTemplate = parseShopifyJson(await read('templates/collection.json'));
  const featured = await read('sections/featured-offers.liquid');
  const collection = await read('sections/brainsait-collection-grid.liquid');
  assert.equal(collectionTemplate.sections.main.type, 'brainsait-collection-grid');
  assert.doesNotMatch(JSON.stringify(collectionTemplate), /gh-shelf/);
  assert.match(featured, /render 'brainsait-product-card'/);
  assert.match(featured, /section\.settings\.collection/);
  assert.match(collection, /brainsait-collection-head/);
  assert.match(collection, /brainsait-collection-grid/);
  assert.match(collection, /render 'brainsait-product-card'/);
  assert.match(collection, /aria-label="{{ collection\.title/);
});
