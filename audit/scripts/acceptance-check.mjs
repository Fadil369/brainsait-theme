import { readFile, writeFile } from 'node:fs/promises';

const themeId = process.env.BRAINSAIT_STAGING_THEME_ID || '149785313363';
const storefront = process.env.BRAINSAIT_STOREFRONT_URL || 'https://store.brainsait.de';
const myfatoorahEndpoint = process.env.BRAINSAIT_MYFATOORAH_ENDPOINT || 'https://myfatoorah-checkout.brainsait-fadil.workers.dev';
const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'f3rbxp-n1.myshopify.com';
const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;

const pass = (name, evidence = {}) => ({ name, status: 'PASS', evidence });
const fail = (name, evidence = {}) => ({ name, status: 'FAIL', evidence });
const blocked = (name, evidence = {}) => ({ name, status: 'BLOCKED', evidence });

async function fetchText(url, options = {}) {
  const response = await fetch(url, { redirect: 'follow', ...options });
  return {
    url,
    status: response.status,
    finalUrl: response.url,
    text: await response.text(),
    headers: Object.fromEntries(response.headers),
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { redirect: 'follow', ...options });
  let body;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }
  return { url, status: response.status, finalUrl: response.url, body };
}

async function getThemeState() {
  if (!adminToken) return blocked('published theme unchanged', { reason: 'SHOPIFY_ADMIN_TOKEN not available to acceptance script' });
  const current = await fetchJson(`https://${shopDomain}/admin/api/2026-07/themes.json`, {
    headers: { 'X-Shopify-Access-Token': adminToken, Accept: 'application/json' },
  });
  const themes = current.body?.themes || [];
  const main = themes.find((theme) => theme.role === 'main');
  const staging = themes.find((theme) => String(theme.id) === String(themeId));
  if (!main || !staging) return fail('published theme unchanged', { main: main?.id, staging: staging?.id, status: current.status });
  return main.id !== staging.id && staging.role === 'unpublished'
    ? pass('published theme unchanged', { mainThemeId: main.id, stagingThemeId: staging.id, stagingRole: staging.role })
    : fail('published theme unchanged', { mainThemeId: main.id, stagingThemeId: staging.id, stagingRole: staging.role });
}

async function main() {
  const canonical = JSON.parse(await readFile(new URL('../../catalog/catalog-canonical.json', import.meta.url), 'utf8'));
  const byFamily = new Map();
  for (const product of canonical) {
    if (!byFamily.has(product.family)) byFamily.set(product.family, product);
  }

  const representative = [
    byFamily.get('LEARN'),
    byFamily.get('BUILD'),
    byFamily.get('SOLUTIONS'),
    byFamily.get('SOLUTIONS READY'),
    byFamily.get('OID & REGISTRY'),
  ].filter(Boolean);

  const results = [];
  const preview = await fetchText(`${storefront}/?preview_theme_id=${themeId}`);
  const previewNeedles = ['BrainSAIT', 'Learn', 'Build', 'Solutions', 'OID', 'Registry'];
  results.push(
    preview.status === 200 && previewNeedles.every((needle) => preview.text.includes(needle))
      ? pass('preview homepage renders canonical positioning', { status: preview.status, finalUrl: preview.finalUrl, needles: previewNeedles })
      : fail('preview homepage renders canonical positioning', { status: preview.status, finalUrl: preview.finalUrl, missing: previewNeedles.filter((needle) => !preview.text.includes(needle)) }),
  );

  for (const handle of ['learn', 'build', 'solutions', 'solutions-ready', 'oid-registry']) {
    const page = await fetchText(`${storefront}/collections/${handle}?preview_theme_id=${themeId}`);
    results.push(
      page.status === 200 && page.text.includes('BrainSAIT')
        ? pass(`collection route ${handle}`, { status: page.status, finalUrl: page.finalUrl })
        : fail(`collection route ${handle}`, { status: page.status, finalUrl: page.finalUrl }),
    );
  }

  for (const product of representative) {
    const page = await fetchText(`${storefront}/products/${product.handle}?preview_theme_id=${themeId}`);
    const expected = [product.title, 'BrainSAIT'];
    results.push(
      page.status === 200 && expected.every((needle) => page.text.includes(needle))
        ? pass(`product route ${product.handle}`, { family: product.family, status: page.status, title: product.title })
        : fail(`product route ${product.handle}`, { family: product.family, status: page.status, title: product.title, missing: expected.filter((needle) => !page.text.includes(needle)) }),
    );
  }

  const cartProduct = representative.find((product) => product.family === 'LEARN') || representative[0];
  if (cartProduct) {
    const productJson = await fetchJson(`${storefront}/products/${cartProduct.handle}.js`);
    const variantId = productJson.body?.variants?.find((variant) => variant.available)?.id || productJson.body?.variants?.[0]?.id;
    if (variantId) {
      const add = await fetchJson(`${storefront}/cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 }),
      });
      results.push(add.status >= 200 && add.status < 300
        ? pass('cart add entry accepts representative LEARN product', { productHandle: cartProduct.handle, variantId, status: add.status })
        : fail('cart add entry accepts representative LEARN product', { productHandle: cartProduct.handle, variantId, status: add.status, body: add.body }));
    } else {
      results.push(fail('cart add entry accepts representative LEARN product', { productHandle: cartProduct.handle, reason: 'No variant ID returned by product JSON' }));
    }
  }

  const paymentGate = await fetchJson(`${myfatoorahEndpoint}/create-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      tier: 'learn',
      customer: { name: 'BrainSAIT Acceptance Test', email: 'acceptance-test@example.invalid', mobile: '+966500000000' },
    }),
  });
  results.push(
    paymentGate.status === 503
      ? blocked('recurring payment live execution', { status: paymentGate.status, reason: paymentGate.body?.error || paymentGate.body })
      : fail('recurring payment live execution', { status: paymentGate.status, body: paymentGate.body }),
  );

  results.push(await getThemeState());

  const summary = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  const report = {
    checkedAt: new Date().toISOString(),
    storefront,
    themeId,
    summary,
    results,
  };
  await writeFile(new URL('../acceptance-results.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    '# BrainSAIT Shopify Relaunch Acceptance Results',
    '',
    `Checked at: ${report.checkedAt}`,
    `Preview theme: ${themeId}`,
    `Storefront: ${storefront}`,
    '',
    `Summary: PASS ${summary.PASS || 0}, FAIL ${summary.FAIL || 0}, BLOCKED ${summary.BLOCKED || 0}`,
    '',
    '| Check | Status | Evidence |',
    '| --- | --- | --- |',
    ...results.map((item) => `| ${item.name} | ${item.status} | ${JSON.stringify(item.evidence).replaceAll('|', '\\|')} |`),
    '',
    'Publication remains gated on explicit approval and resolution of blocked recurring-payment validation.',
    '',
  ];
  await writeFile(new URL('../acceptance-results.md', import.meta.url), lines.join('\n'));
  console.log(JSON.stringify(summary, null, 2));
  if (summary.FAIL) process.exitCode = 1;
}

await main();
