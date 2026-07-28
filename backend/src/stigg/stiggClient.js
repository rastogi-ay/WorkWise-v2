import { User } from '../models/User.js';

export const STIGG_BASE_URL = 'https://api.stigg.io/api/v1';
export const STIGG_GRAPHQL_URL = 'https://api.stigg.io/graphql';

// Used on every request to get the Stigg API key from the environment the user is currently on
async function getActiveServerApiKey(clerkId) {
  const user = await User.findOne({ clerkId });
  const activeEnv = user?.activeEnvironment ? user.environments?.get(user.activeEnvironment) : null;
  return activeEnv?.serverApiKey ?? process.env.DEFAULT_STIGG_SERVER_API_KEY;
}

export async function createCustomer(user) {
  const serverApiKey = await getActiveServerApiKey(user.clerkId);
  const response = await fetch(`${STIGG_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: user.clerkId,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw Object.assign(new Error(errorBody), { status: response.status });
  }
  const { data } = await response.json();
  return data;
}

export async function createSubscription(customerId, planId) {
  const serverApiKey = await getActiveServerApiKey(customerId);
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
    throw new Error(errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function getSubscriptions(customerId) {
  const serverApiKey = await getActiveServerApiKey(customerId);
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

export async function getBooleanEntitlement(customerId, featureId) {
  const serverApiKey = await getActiveServerApiKey(customerId);
  console.log(serverApiKey);
  const url = new URL(`${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`);
  url.searchParams.set('featureId', featureId);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': serverApiKey,
    },
  });
  console.log('response:', response);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody);
  }
  const { data } = await response.json();
  return data;
}

export async function getNumericEntitlement(customerId, featureId, requestedUsage) {
  const serverApiKey = await getActiveServerApiKey(customerId);
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

export async function getCreditEntitlement(customerId, currencyId) {
  const serverApiKey = await getActiveServerApiKey(customerId);
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

export async function estimateCreditUsage(customerId, featureId, value) {
  const serverApiKey = await getActiveServerApiKey(customerId);
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

export async function reportUsage(customerId, featureId, value) {
  const serverApiKey = await getActiveServerApiKey(customerId);
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

export async function getIntegrationsCount(customerId) {
  const serverApiKey = await getActiveServerApiKey(customerId);
  const response = await fetch(STIGG_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    // TODO: make more general function?
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
