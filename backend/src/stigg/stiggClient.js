export const STIGG_BASE_URL = 'https://api.stigg.io/api/v1';
export const STIGG_GRAPHQL_URL = 'https://api.stigg.io/graphql';

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
    throw Object.assign(new Error(errorBody), { status: response.status });
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
    throw Object.assign(new Error(errorBody), { status: response.status });
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
    throw new Error(errorBody);
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
    throw new Error(errorBody);
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
    throw new Error(errorBody);
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
    throw new Error(errorBody);
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
    throw new Error(errorBody);
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
    throw new Error(errorBody);
  }
  const { data } = await response.json();
  return data[0];
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
    throw new Error(errorBody);
  }
  const { data, errors } = await response.json();
  if (errors) {
    throw new Error(JSON.stringify(errors));
  }
  return data.integrations.totalCount;
}
