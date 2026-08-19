import { UpstreamError } from '../httpErrors.js';

export const STIGG_BASE_URL = 'https://api.stigg.io/api/v1';
export const STIGG_GRAPHQL_URL = 'https://api.stigg.io/graphql';
export const STIGG_BETA_BASE_URL = 'https://api.stigg.io/api/v1-beta';

export async function createCustomer(serverApiKey, customerId, { name, email } = {}) {
  const response = await fetch(`${STIGG_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: customerId,
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function createSubscription(serverApiKey, customerId, planId) {
  const response = await fetch(`${STIGG_BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      planId,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function listCustomers(serverApiKey) {
  const url = new URL(`${STIGG_BASE_URL}/customers`);
  url.searchParams.set('limit', 100);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function updateCustomer(serverApiKey, customerId, { name, email } = {}) {
  const response = await fetch(`${STIGG_BASE_URL}/customers/${customerId}`, {
    method: 'PATCH',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function archiveCustomer(serverApiKey, customerId) {
  const response = await fetch(`${STIGG_BASE_URL}/customers/${customerId}/archive`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function getSubscriptions(serverApiKey, customerId) {
  const url = new URL(`${STIGG_BASE_URL}/subscriptions`);
  url.searchParams.set('customerId', customerId);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function getBooleanEntitlement(serverApiKey, customerId, featureId) {
  const url = new URL(`${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`);
  url.searchParams.set('featureId', featureId);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': serverApiKey,
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function getNumericEntitlement(serverApiKey, customerId, featureId, requestedUsage) {
  const url = new URL(`${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`);
  url.searchParams.set('featureId', featureId);
  if (requestedUsage !== undefined) {
    url.searchParams.set('requestedUsage', requestedUsage);
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': serverApiKey,
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function getCreditEntitlement(serverApiKey, customerId, currencyId) {
  const url = new URL(`${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`);
  url.searchParams.set('currencyId', currencyId);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': serverApiKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function estimateCreditUsage(serverApiKey, customerId, featureId, value) {
  const response = await fetch(`${STIGG_BASE_URL}/usage/estimate`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      featureId,
      value,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data.estimates[0];
}

export async function reportUsage(serverApiKey, customerId, featureId, value) {
  const response = await fetch(`${STIGG_BASE_URL}/usage`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      usages: [{ customerId, featureId, value }],
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data } = await response.json();
  return data[0];
}

// Deducts from a credit pool without going through a metered feature, and without needing an active
// subscription. `dimensions` carries governance attribution the same way usage reporting does: the
// values are matched against entity types' attribution keys, charging the matching entity and every
// ancestor. Verified against the sandbox on 2026-08-18 — 42 tokens attributed to a user entity rolled
// up to its team and department.
//
// idempotencyKey is required, and is what makes a retried request safe to send twice.
export async function consumeCredits(
  serverApiKey,
  customerId,
  currencyId,
  amount,
  idempotencyKey,
  dimensions,
) {
  const hasDimensions = dimensions && Object.keys(dimensions).length > 0;
  const response = await fetch(`${STIGG_BASE_URL}/credits/consumption`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      currencyId,
      amount,
      idempotencyKey,
      ...(hasDimensions ? { dimensions } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw Object.assign(new Error(errorBody), { status: response.status });
  }
  const { data } = await response.json();
  return data;
}

export async function getIntegrationsCount(serverApiKey) {
  const response = await fetch(STIGG_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query Node($filter: IntegrationFilter) {
          integrations(filter: $filter) {
            totalCount
          }
        }
      `,
      variables: { filter: { vendorType: { eq: 'BILLING' } } },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new UpstreamError(response.status, errorBody);
  }
  const { data, errors } = await response.json();
  if (errors) {
    throw new Error(JSON.stringify(errors));
  }
  return data.integrations.totalCount;
}

// --- Governance (private beta) -------------------------------------------------

// Shared plumbing for the beta surface: same auth header and error shape as the v1 helpers above.
async function betaRequest(serverApiKey, path, { method = 'GET', body, searchParams } = {}) {
  const url = new URL(`${STIGG_BETA_BASE_URL}${path}`);
  for (const [key, value] of searchParams ?? []) {
    url.searchParams.append(key, value);
  }

  const response = await fetch(url, {
    method,
    headers: {
      'X-API-KEY': serverApiKey,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw Object.assign(new Error(errorBody), { status: response.status });
  }
  // archive/unarchive return 204 with no body
  if (response.status === 204) return null;
  return response.json();
}

// The beta list endpoints are cursor-paginated ({ data, pagination: { next } }). Callers want the
// whole set — a customer's tree is small — so walk every page rather than silently truncating.
async function betaListAll(serverApiKey, path, searchParams = []) {
  const items = [];
  let after;
  do {
    const params = [...searchParams];
    if (after) params.push(['after', after]);
    const page = await betaRequest(serverApiKey, path, { searchParams: params });
    items.push(...(page?.data ?? []));
    after = page?.pagination?.next ?? undefined;
  } while (after);
  return items;
}

export function listEntityTypes(serverApiKey) {
  return betaListAll(serverApiKey, '/entity-types');
}

// Idempotent bulk PUT — re-submitting the same types is a no-op.
export async function upsertEntityTypes(serverApiKey, types) {
  const result = await betaRequest(serverApiKey, '/entity-types', {
    method: 'PUT',
    body: { types },
  });
  return result?.data ?? [];
}

export function listEntities(serverApiKey, customerId) {
  return betaListAll(serverApiKey, `/customers/${encodeURIComponent(customerId)}/entities`);
}

// Bulk PUT, idempotent. Note parentId is NOT accepted here — placement lives on the assignment.
export async function upsertEntities(serverApiKey, customerId, entities) {
  const result = await betaRequest(
    serverApiKey,
    `/customers/${encodeURIComponent(customerId)}/entities`,
    {
      method: 'PUT',
      body: { entities },
    },
  );
  return result?.data ?? [];
}

// Soft-delete. Not leaf-gated: archiving a parent orphans its live children, so callers must order
// ids deepest-first themselves.
export function archiveEntities(serverApiKey, customerId, ids) {
  return betaRequest(
    serverApiKey,
    `/customers/${encodeURIComponent(customerId)}/entities/archive`,
    {
      method: 'POST',
      body: { ids },
    },
  );
}

export function listAssignments(serverApiKey, customerId) {
  return betaListAll(serverApiKey, `/customers/${encodeURIComponent(customerId)}/assignments`);
}

// One assignment per (entity, feature|currency). Patch semantics: omitting usageLimit or cadence on
// a re-upsert preserves the stored value, and parentId is tri-state (omit = unchanged, null = root,
// id = re-parent, leaf nodes only).
export async function upsertAssignments(serverApiKey, customerId, assignments) {
  const result = await betaRequest(
    serverApiKey,
    `/customers/${encodeURIComponent(customerId)}/assignments`,
    { method: 'PUT', body: { assignments } },
  );
  return result?.data ?? [];
}

// The governance tree: one row per (entity, budget) with hierarchy, config and usage already
// joined. Served from a read model, so it can lag the live counter — never gate on it.
export function queryGovernanceTree(serverApiKey, customerId, { currencyIds = [] } = {}) {
  const searchParams = currencyIds.map((currencyId) => ['currencyIds', currencyId]);
  return betaListAll(
    serverApiKey,
    `/customers/${encodeURIComponent(customerId)}/governance`,
    searchParams,
  );
}

// The real-time gate for one credit currency. Returns isGranted plus `chains` — the per-entity
// budget chain, ordered leaf -> root. An entity is blocked when ANY ancestor is exhausted, so the
// caller must inspect the whole chain to find which node actually said no. This same call also
// enforces the account-level pool, so isGranted can be false with every chain node granted.
// Fail-closed: 503 if the cache is unavailable.
export async function checkGovernedCurrency(
  serverApiKey,
  customerId,
  currencyId,
  requestedUsage,
  dimensions = {},
) {
  const searchParams = [
    ['currencyId', currencyId],
    ['requestedUsage', String(requestedUsage)],
  ];
  for (const [key, value] of Object.entries(dimensions)) {
    searchParams.push([`dimensions[${key}]`, String(value)]);
  }

  const result = await betaRequest(
    serverApiKey,
    `/customers/${encodeURIComponent(customerId)}/entitlements/check`,
    { searchParams },
  );
  return result.data;
}
