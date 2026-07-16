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

async function createCustomer(user) {
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

  // TODO: add provision subscription
  return;
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
  const response = await fetch(
    `${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`,
    {
      method: 'GET',
      headers: {
        'X-API-KEY': serverApiKey,
      },
      body: JSON.stringify({
        featureId,
        requestedUsage,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `Failed to fetch entitlements for customer ${customerId} (status ${response.status}):`,
      errorBody,
    );
    throw new Error(`Failed to fetch entitlements (status ${response.status})`);
  }

  const { data } = await response.json();
  return (
    data.entitlements.find(
      (entitlement) => entitlement.feature?.id === featureId,
    ) ?? null
  );
}

export async function getCreditEntitlement(
  customerId,
  currencyId,
  requestedUsage,
) {
  const serverApiKey = await getActiveServerApiKey(customerId);
  const response = await fetch(
    `${STIGG_BASE_URL}/customers/${customerId}/entitlements/check`,
    {
      method: 'GET',
      headers: {
        'X-API-KEY': serverApiKey,
      },
      body: JSON.stringify({
        currencyId,
        requestedUsage,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `Failed to fetch entitlements for customer ${customerId} (status ${response.status}):`,
      errorBody,
    );
    throw new Error(`Failed to fetch entitlements (status ${response.status})`);
  }

  const { data } = await response.json();
  return (
    data.entitlements.find(
      (entitlement) => entitlement.feature?.id === featureId,
    ) ?? null
  );
}

// Reports a metered feature usage value for a customer. Returns the resulting usage measurement.
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
    console.error(
      `Failed to report usage for customer ${customerId}, feature ${featureId} (status ${response.status}):`,
      errorBody,
    );
    throw new Error(`Failed to report usage (status ${response.status})`);
  }

  const { data } = await response.json();
  return data[0];
}

// Reports a custom usage event for event-based metering.
export async function reportEvent(customerId, eventName, dimensions) {
  const serverApiKey = await getActiveServerApiKey(customerId);
  const response = await fetch(`${STIGG_BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'X-API-KEY': serverApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      events: [
        {
          customerId,
          eventName,
          idempotencyKey: `${customerId}-${eventName}-${Date.now()}`,
          dimensions,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `Failed to report event "${eventName}" for customer ${customerId} (status ${response.status}):`,
      errorBody,
    );
    throw new Error(`Failed to report event (status ${response.status})`);
  }
}

export { createCustomer };
