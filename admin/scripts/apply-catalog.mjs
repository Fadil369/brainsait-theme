import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

export const PRIMARY_COLLECTIONS = [
  { handle: 'learn', title: 'Learn', family: 'LEARN', descriptionHtml: '<p>Digital learning products, memberships, books, courses, and practical guides from BrainSAIT.</p>' },
  { handle: 'build', title: 'Build', family: 'BUILD', descriptionHtml: '<p>Incubation, labs, workshops, and founder execution systems for building with BrainSAIT.</p>' },
  { handle: 'solutions', title: 'Solutions', family: 'SOLUTIONS', descriptionHtml: '<p>BrainSAIT systems, platforms, advisory offers, and operational healthcare technology products.</p>' },
  { handle: 'solutions-ready', title: 'Solutions Ready', family: 'SOLUTIONS READY', descriptionHtml: '<p>Deploy-ready BrainSAIT systems packaged for enterprise implementation.</p>' },
  { handle: 'oid-registry', title: 'OID & Registry', family: 'OID & REGISTRY', descriptionHtml: '<p>Governed OID namespace, registry, verification, and identity-fabric products.</p>' },
];

export const METAFIELD_DEFINITIONS = [
  { key: 'family', name: 'BrainSAIT family', type: 'single_line_text_field' },
  { key: 'outcome', name: 'Outcome', type: 'multi_line_text_field' },
  { key: 'deliverables', name: 'Deliverables', type: 'list.single_line_text_field' },
  { key: 'billing_model', name: 'Billing model', type: 'single_line_text_field' },
  { key: 'billing_label', name: 'Billing label', type: 'single_line_text_field' },
  { key: 'governance_note', name: 'Governance note', type: 'multi_line_text_field' },
  { key: 'faq', name: 'FAQ', type: 'json' },
  { key: 'oid', name: 'OID', type: 'single_line_text_field' },
  { key: 'gates', name: 'Access gates', type: 'list.single_line_text_field' },
  { key: 'overage', name: 'Overage policy', type: 'multi_line_text_field' },
  { key: 'image_aspect_ratio', name: 'Image aspect ratio', type: 'single_line_text_field' },
];

const OPERATIONS = {
  FetchCatalogState: `query FetchCatalogState($cursor: String) {
    products(first: 250, after: $cursor) {
      nodes {
        id
        title
        handle
        productType
        vendor
        status
        templateSuffix
        collections(first: 10) { nodes { id handle title } }
        variants(first: 20) { nodes { id sku price } }
        options { id name }
        metafields(first: 50, namespace: "brainsait") { nodes { key value type } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`,
  FetchCollections: `query FetchCollections($cursor: String) {
    collections(first: 100, after: $cursor) {
      nodes {
        id
        title
        handle
        descriptionHtml
        products(first: 250) { nodes { id } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`,
  FetchRedirects: `query FetchRedirects($cursor: String) {
    urlRedirects(first: 250, after: $cursor) {
      nodes { id path target }
      pageInfo { hasNextPage endCursor }
    }
  }`,
  MetafieldDefinitionCreate: `mutation MetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id key namespace }
      userErrors { field message }
    }
  }`,
  CollectionCreate: `mutation CollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id handle title }
      userErrors { field message }
    }
  }`,
  CollectionUpdate: `mutation CollectionUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { id handle title }
      userErrors { field message }
    }
  }`,
  CollectionAddProducts: `mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection { id handle title }
      userErrors { field message }
    }
  }`,
  CollectionRemoveProducts: `mutation CollectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
    collectionRemoveProducts(id: $id, productIds: $productIds) {
      job { id done }
      userErrors { field message }
    }
  }`,
  ProductUpdate: `mutation ProductUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id title handle status templateSuffix }
      userErrors { field message }
    }
  }`,
  ProductVariantsBulkUpdate: `mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product { id }
      productVariants { id price sku }
      userErrors { field message }
    }
  }`,
  ProductVariantsBulkCreate: `mutation ProductVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      product { id }
      productVariants { id price sku }
      userErrors { field message code }
    }
  }`,
  MetafieldsSet: `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id key namespace type value }
      userErrors { field message }
    }
  }`,
  UrlRedirectCreate: `mutation UrlRedirectCreate($urlRedirect: UrlRedirectInput!) {
    urlRedirectCreate(urlRedirect: $urlRedirect) {
      urlRedirect { id path target }
      userErrors { field message }
    }
  }`,
  PublishablePublish: `mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable { resourcePublicationsCount { count } }
      userErrors { field message }
    }
  }`,
  FetchOnlineStorePublication: `query FetchOnlineStorePublication {
    publications(first: 20) { nodes { id name } }
  }`,
};

export function buildCatalogPlan({
  catalog,
  archiveMap,
  redirectMap,
  currentProducts = new Map(),
  currentCollections = new Map(),
  existingRedirects = new Set(),
  batchSize = 10,
}) {
  const collectionWrites = PRIMARY_COLLECTIONS.filter((collection) => {
    const current = currentCollections.get(collection.handle);
    return !current || current.title !== collection.title || current.descriptionHtml !== collection.descriptionHtml;
  });
  const productsToWrite = catalog.filter((product) => !productMatchesCurrent(product, currentProducts.get(product.sourceProductId)));
  const productBatches = chunk(productsToWrite, batchSize);
  const collectionProductWrites = PRIMARY_COLLECTIONS.map((collection) => {
    const current = currentCollections.get(collection.handle);
    const currentProductIds = new Set(current?.productIds || []);
    return {
      ...collection,
      collectionId: current?.id || null,
      productIds: catalog
        .filter((product) => product.family === collection.family)
        .map((product) => product.sourceProductId)
        .filter((productId) => !currentProductIds.has(productId)),
    };
  }).filter((collection) => collection.productIds.length > 0);
  const canonicalFamilyByProductId = new Map(catalog.map((product) => [product.sourceProductId, product.family]));
  const collectionProductRemoves = PRIMARY_COLLECTIONS.map((collection) => {
    const current = currentCollections.get(collection.handle);
    return {
      ...collection,
      collectionId: current?.id || null,
      productIds: (current?.productIds || []).filter((productId) => {
        const canonicalFamily = canonicalFamilyByProductId.get(productId);
        return canonicalFamily && canonicalFamily !== collection.family;
      }),
    };
  }).filter((collection) => collection.collectionId && collection.productIds.length > 0);
  const redirectWrites = redirectMap.filter((redirect) => !hasRedirectPath(existingRedirects, redirect.path));
  const archiveWrites = archiveMap.filter((item) => item.reason !== 'already_archived' && currentProducts.get(item.productId)?.status !== 'ARCHIVED');
  return { collectionWrites, productBatches, collectionProductWrites, collectionProductRemoves, redirectWrites, archiveWrites };
}

export async function runCatalogApply({
  catalog,
  archiveMap,
  redirectMap,
  client,
  auditPath,
  dryRun = true,
  currentProducts = new Map(),
  currentCollections = new Map(),
  existingRedirects = new Set(),
  publicationId = null,
}) {
  const startedAt = new Date().toISOString();
  const plan = buildCatalogPlan({ catalog, archiveMap, redirectMap, currentProducts, currentCollections, existingRedirects });
  const audit = {
    mode: dryRun ? 'dry-run' : 'apply',
    startedAt,
    counts: {
      products: catalog.length,
      productBatches: plan.productBatches.length,
      collections: PRIMARY_COLLECTIONS.length,
      redirects: plan.redirectWrites.length,
      archive: plan.archiveWrites.length,
      collectionRemoves: plan.collectionProductRemoves.length,
    },
    operations: [],
    userErrors: [],
  };

  try {
  if (!dryRun) {
    for (const definition of METAFIELD_DEFINITIONS) {
      await recordOperation(audit, client, 'MetafieldDefinitionCreate', {
        definition: { ...definition, namespace: 'brainsait', ownerType: 'PRODUCT', access: { storefront: 'PUBLIC_READ' } },
      });
    }

    const collectionsByHandle = new Map(currentCollections);
    for (const collection of plan.collectionWrites) {
      const existing = collectionsByHandle.get(collection.handle);
      const result = await recordOperation(audit, client, existing ? 'CollectionUpdate' : 'CollectionCreate', {
        input: {
          id: existing?.id,
          title: collection.title,
          handle: collection.handle,
          descriptionHtml: collection.descriptionHtml,
        },
      });
      const written = result.collection || result.createdCollection;
      if (written?.id) collectionsByHandle.set(collection.handle, { ...collection, id: written.id });
    }
    if (publicationId) {
      for (const collection of PRIMARY_COLLECTIONS) {
        const collectionId = collectionsByHandle.get(collection.handle)?.id;
        if (collectionId) await recordOperation(audit, client, 'PublishablePublish', { id: collectionId, input: [{ publicationId }] });
      }
    }

    for (const batch of plan.productBatches) {
      for (const product of batch) {
        await recordOperation(audit, client, 'ProductUpdate', { product: productUpdateInput(product) });
        const currentProduct = currentProducts.get(product.sourceProductId);
        const currentVariantIds = new Set((currentProduct?.variants || []).map((variant) => variant.id));
        const currentVariantsBySku = new Map((currentProduct?.variants || []).map((variant) => [variant.sku, variant]));
        const variantsWithLiveIds = product.variants.map((variant) => {
          if (variant.sourceVariantId && currentVariantIds.has(variant.sourceVariantId)) return variant;
          const currentBySku = currentVariantsBySku.get(variant.sku);
          return currentBySku ? { ...variant, sourceVariantId: currentBySku.id } : { ...variant, sourceVariantId: null };
        });
        const variantUpdates = variantsWithLiveIds.filter((variant) => variant.sourceVariantId).map((variant) => ({
          id: variant.sourceVariantId,
          price: String(variant.price),
          inventoryItem: { sku: variant.sku },
        }));
        if (variantUpdates.length) {
          await recordOperation(audit, client, 'ProductVariantsBulkUpdate', { productId: product.sourceProductId, variants: variantUpdates });
        }
        const optionName = currentProduct?.options?.[0]?.name || 'Title';
        const variantCreates = variantsWithLiveIds.filter((variant) => !variant.sourceVariantId).map((variant) => ({
          price: String(variant.price),
          inventoryItem: { sku: variant.sku },
          optionValues: [{ optionName, name: variant.billingLabel }],
        }));
        if (variantCreates.length) {
          await recordOperation(audit, client, 'ProductVariantsBulkCreate', { productId: product.sourceProductId, variants: variantCreates });
        }
        await recordOperation(audit, client, 'MetafieldsSet', { metafields: metafieldsForProduct(product) });
      }
    }

    for (const collection of plan.collectionProductWrites) {
      const collectionId = collection.collectionId || collectionsByHandle.get(collection.handle)?.id;
      if (collectionId) {
        await recordOperation(audit, client, 'CollectionAddProducts', { id: collectionId, productIds: collection.productIds });
      }
    }
    for (const collection of plan.collectionProductRemoves) {
      await recordOperation(audit, client, 'CollectionRemoveProducts', { id: collection.collectionId, productIds: collection.productIds });
    }

    for (const redirect of plan.redirectWrites) {
      await recordOperation(audit, client, 'UrlRedirectCreate', { urlRedirect: redirect });
    }

    for (const item of plan.archiveWrites) {
      await recordOperation(audit, client, 'ProductUpdate', { product: { id: item.productId, status: 'ARCHIVED' } });
    }
  }
  } catch (error) {
    audit.failedAt = new Date().toISOString();
    audit.failure = error.message;
    writeAudit(auditPath, audit);
    throw error;
  }
  audit.completedAt = new Date().toISOString();
  writeAudit(auditPath, audit);
  return { mode: audit.mode, counts: audit.counts, userErrors: audit.userErrors, plan };
}

export function makeShopifyClient({ shop, token, apiVersion = '2026-07' }) {
  if (!shop || !token) throw new Error('Shopify shop domain and Admin token are required');
  return async function shopifyClient(operationName, variables) {
    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query: OPERATIONS[operationName], variables }),
    });
    const json = await response.json();
    if (!response.ok || json.errors) {
      const error = new Error(json.errors?.map((item) => item.message).join('; ') || `Shopify HTTP ${response.status}`);
      error.retryable = response.status === 429 || response.status >= 500;
      throw error;
    }
    return json;
  };
}

export async function loadShopifyState(client) {
  const currentProducts = new Map();
  for await (const product of fetchPaged(client, 'FetchCatalogState', 'products')) {
    currentProducts.set(product.id, {
      ...product,
      collections: product.collections.nodes.map((collection) => collection.handle),
      variants: product.variants.nodes,
      metafields: Object.fromEntries(product.metafields.nodes.map((metafield) => [metafield.key, metafield.value])),
    });
  }

  const currentCollections = new Map();
  for await (const collection of fetchPaged(client, 'FetchCollections', 'collections')) {
    currentCollections.set(collection.handle, {
      ...collection,
      productIds: collection.products.nodes.map((product) => product.id),
    });
  }

  const existingRedirects = new Set();
  for await (const redirect of fetchPaged(client, 'FetchRedirects', 'urlRedirects')) {
    existingRedirects.add(redirect.path);
    try {
      existingRedirects.add(decodeURI(redirect.path));
    } catch {}
  }

  let publicationId = null;
  try {
    const publicationResponse = await client('FetchOnlineStorePublication', {});
    publicationId = publicationResponse.data?.publications?.nodes?.find((publication) => /online store/i.test(publication.name))?.id || null;
  } catch (error) {
    if (!/read_publications|Access denied for publications/i.test(error.message)) throw error;
  }

  return { currentProducts, currentCollections, existingRedirects, publicationId };
}

async function* fetchPaged(client, operation, connectionName) {
  let cursor = null;
  do {
    const result = await client(operation, { cursor });
    const connection = result.data?.[connectionName];
    if (!connection) throw new Error(`Missing ${connectionName} in ${operation} response`);
    for (const node of connection.nodes) yield node;
    cursor = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (cursor);
}

function productMatchesCurrent(product, current) {
  if (!current) return false;
  const variantsMatch = product.variants.every((variant) => {
      const currentVariant = current.variants.find((item) => item.id === variant.sourceVariantId)
        || current.variants.find((item) => item.sku === variant.sku);
      return currentVariant
        && currentVariant.sku === variant.sku
        && Number(currentVariant.price) === Number(variant.price);
    });
  const metafieldsMatch = metafieldsForProduct(product).every((metafield) => current.metafields?.[metafield.key] === metafield.value);
  return current.title === product.title
    && current.handle === product.handle
    && current.productType === product.productType
    && current.vendor === product.vendor
    && current.templateSuffix === product.templateSuffix
    && current.status === 'ACTIVE'
    && variantsMatch
    && metafieldsMatch;
}

function productUpdateInput(product) {
  return {
    id: product.sourceProductId,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    tags: product.tags,
    templateSuffix: product.templateSuffix,
    status: 'ACTIVE',
    seo: product.seo,
    descriptionHtml: `<p>${escapeHtml(product.customerCopy)}</p>`,
  };
}

function metafieldsForProduct(product) {
  const primary = product.variants[0] || {};
  const entries = [
    ['family', product.family, 'single_line_text_field'],
    ['outcome', product.customerCopy, 'multi_line_text_field'],
    ['deliverables', JSON.stringify(defaultDeliverables(product)), 'list.single_line_text_field'],
    ['billing_model', primary.billingModel || 'one_time', 'single_line_text_field'],
    ['billing_label', primary.billingLabel || '', 'single_line_text_field'],
    ['governance_note', product.disclaimer || defaultGovernance(product), 'multi_line_text_field'],
    ['faq', JSON.stringify(defaultFaq(product)), 'json'],
    ['image_aspect_ratio', product.imageAspectRatio || '3:2', 'single_line_text_field'],
  ];
  if (product.oid) entries.push(['oid', product.oid, 'single_line_text_field']);
  if (product.gates) entries.push(['gates', JSON.stringify(product.gates), 'list.single_line_text_field']);
  if (product.overage) entries.push(['overage', product.overage, 'multi_line_text_field']);
  return entries
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value, type]) => ({ ownerId: product.sourceProductId, namespace: 'brainsait', key, type, value: String(value) }));
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

async function recordOperation(audit, client, operation, variables) {
  const result = await withRetry(() => client(operation, variables));
  const payload = result.data?.[operation[0].toLowerCase() + operation.slice(1)] || {};
  const userErrors = payload.userErrors || [];
  audit.operations.push({ operation, variables: redactVariables(variables), userErrorCount: userErrors.length });
  const blockingErrors = userErrors.filter((error) => !isToleratedUserError(operation, error));
  if (blockingErrors.length) {
    audit.userErrors.push({ operation, errors: userErrors });
    throw new Error(blockingErrors.map((error) => error.message).join('; '));
  }
  return payload;
}

function isToleratedUserError(operation, error) {
  const message = error.message || '';
  if (operation === 'MetafieldDefinitionCreate') return /already exists|in use|taken|must be unique/i.test(message);
  if (operation === 'CollectionAddProducts') return /already.*product|already.*collection/i.test(message);
  if (operation === 'UrlRedirectCreate') return /already exists|taken|must be unique/i.test(message);
  if (operation === 'PublishablePublish') return /already published/i.test(message);
  return false;
}

function hasRedirectPath(paths, path) {
  if (paths.has(path)) return true;
  try {
    return paths.has(encodeURI(path));
  } catch {
    return false;
  }
}

async function withRetry(fn, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!error.retryable || attempt === attempts) break;
      await new Promise((resolveWait) => setTimeout(resolveWait, 250 * attempt));
    }
  }
  throw lastError;
}

function writeAudit(auditPath, audit) {
  mkdirSync(dirname(auditPath), { recursive: true });
  writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
}

function redactVariables(value) {
  if (Array.isArray(value)) return value.map(redactVariables);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      /token|secret|password|key/i.test(key) ? '[REDACTED]' : redactVariables(item),
    ]));
  }
  return value;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function chunk(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size));
  return batches;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseArgs(argv) {
  return {
    dryRun: !argv.includes('--apply'),
    shop: process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_SHOP || process.env.SHOP,
    token: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = readJson(resolve(repoRoot, 'catalog/catalog-canonical.json'));
  const archiveMap = readJson(resolve(repoRoot, 'catalog/archive-map.json'));
  const redirectMap = readJson(resolve(repoRoot, 'catalog/redirect-map.json'));
  const auditPath = resolve(repoRoot, 'audit/catalog-apply-log.json');
  const client = args.dryRun
    ? async () => ({ data: {} })
    : makeShopifyClient({ shop: args.shop, token: args.token });
  const state = args.dryRun
    ? {}
    : await loadShopifyState(client);
  const result = await runCatalogApply({ catalog, archiveMap, redirectMap, client, auditPath, dryRun: args.dryRun, ...state });
  console.log(JSON.stringify(result.counts, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
