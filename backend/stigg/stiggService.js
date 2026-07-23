import { User } from '../models/User.js';

export const STIGG_BASE_URL = 'https://api.stigg.io/api/v1';

// Used on every request to get the Stigg API key from the environment the user is currently on
async function getActiveServerApiKey(clerkId) {
  const user = await User.findOne({ clerkId });
  const activeEnv = user?.activeEnvironment
    ? user.environments?.get(user.activeEnvironment)
    : null;
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
  console.log('Stigg customer created:', response);

  // TODO: add provision subscription, probably in different function though
  return;
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
  const url = new URL(
    `${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`,
  );
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

export async function getNumericEntitlement(
  customerId,
  featureId,
  requestedUsage,
) {
  const serverApiKey = await getActiveServerApiKey(customerId);
  const url = new URL(
    `${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`,
  );
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
  const url = new URL(
    `${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`,
  );
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