import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const parseShopifyJson = (source) => JSON.parse(source.replace(/^\/\*[\s\S]*?\*\//, '').trim());

test('defines the approved BrainSAIT visual tokens and accessibility states', async () => {
  const css = await read('assets/brainsait-tokens.css');

  for (const token of ['--bs-obsidian', '--bs-graphite', '--bs-ivory', '--bs-champagne-gold', '--bs-teal']) {
    assert.match(css, new RegExp(`${token}:\\s*#`, 'i'), `${token} must be a concrete color token`);
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /--bs-container:/);
  assert.match(css, /--bs-radius-/);
});

test('loads the BrainSAIT foundation and deferred motion enhancement', async () => {
  const layout = await read('layout/theme.liquid');
  const motion = await read('assets/brainsait-motion.js');
  const schema = await read('config/settings_schema.json');
  const data = await read('config/settings_data.json');

  assert.match(layout, /brainsait-tokens\.css.*stylesheet_tag/);
  assert.match(layout, /brainsait-motion\.js.*defer/);
  assert.match(motion, /IntersectionObserver/);
  assert.match(motion, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(layout, /document\.querySelectorAll\('\[data-reveal\]'/);
  assert.match(schema, /brainsait_reveal_enabled/);
  assert.match(data, /"brainsait_reveal_enabled": true/);
});

test('renders the complete English primary navigation with accessible commerce actions', async () => {
  const header = await read('snippets/brainsait-header.liquid');

  for (const handle of ['learn', 'build', 'solutions', 'solutions-ready', 'oid-registry']) {
    assert.match(header, new RegExp(`routes\\.collections_url \\}\\}/${handle}`));
  }
  for (const key of ['home', 'learn', 'build', 'solutions', 'solutions_ready', 'oid_registry', 'about', 'support']) {
    assert.match(header, new RegExp(`brainsait\\.navigation\\.${key}`));
  }
  for (const action of ['search', 'account', 'cart']) {
    assert.match(header, new RegExp(`brainsait\\.actions\\.${action}`));
  }
  assert.match(header, /aria-expanded="false"/);
  assert.doesNotMatch(header, /[🧠☀️🌙☰✕]/u);
  assert.doesNotMatch(header, /request\.locale\.iso_code\s*==\s*'ar'/);
});

test('renders announcement, policy links, and credential disclaimer through English translations', async () => {
  const header = await read('snippets/brainsait-header.liquid');
  const footer = await read('snippets/brainsait-footer.liquid');
  const locale = parseShopifyJson(await read('locales/en.default.json'));

  assert.match(header, /brainsait\.announcement\.text/);
  assert.match(footer, /shop\.privacy_policy/);
  assert.match(footer, /shop\.terms_of_service/);
  assert.match(footer, /brainsait\.footer\.credential_disclaimer/);

  assert.equal(locale.brainsait.announcement.text.length > 0, true);
  assert.equal(locale.brainsait.footer.credential_disclaimer.length > 0, true);
  assert.equal(locale.brainsait.navigation.oid_registry, 'OID & Registry');
});
