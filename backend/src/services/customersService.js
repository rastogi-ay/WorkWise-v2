import { User } from '../models/User.js';
import * as stiggClient from '../stigg/stiggClient.js';
import { WORKWISE_AI_FREE_PLAN_ID } from '../stigg/constants.js';
import { BadRequestError, ConflictError, NotFoundError } from '../httpErrors.js';

async function getUserAndEnv(clerkId, environmentName) {
  const user = await User.findOne({ clerkId });
  if (!user) throw new NotFoundError('User not found');

  const env = (user.environments ?? new Map()).get(environmentName);
  if (!env) throw new NotFoundError(`Environment "${environmentName}" does not exist`);

  return { user, env };
}

async function getLiveCustomers(env) {
  const stiggCustomers = await stiggClient.listCustomers(env.serverApiKey);
  return stiggCustomers
    .filter((customer) => !customer.archivedAt)
    .map((customer) => ({
      customerId: customer.id,
      name: customer.name ?? null,
      email: customer.email ?? null,
      isActive: customer.id === env.activeCustomerId,
    }));
}

// For 409, there are two different ways to handle it:
// 1) 'swallow' (default) - treats that as fine and moves on (usually for React Strict Mode)
// 2) 'throw' - raises a real error, means the user really is trying to add a duplicate
async function onboardCustomer(
  serverApiKey,
  customerId,
  { name, email } = {},
  { onConflict = 'swallow' } = {},
) {
  let customer;
  try {
    customer = await stiggClient.createCustomer(serverApiKey, customerId, { name, email });
  } catch (error) {
    if (error.status !== 409) throw error;
    if (onConflict === 'throw') {
      throw new ConflictError(`Customer "${customerId}" already exists`);
    }
    customer = { id: customerId, name, email };
  }

  await stiggClient.createSubscription(serverApiKey, customer.id, WORKWISE_AI_FREE_PLAN_ID);
  return customer;
}

async function listCustomers(clerkId, environmentName) {
  const { env } = await getUserAndEnv(clerkId, environmentName);
  return getLiveCustomers(env);
}

async function addCustomer(clerkId, environmentName, { customerId, name, email }) {
  const { env } = await getUserAndEnv(clerkId, environmentName);
  await onboardCustomer(env.serverApiKey, customerId, { name, email }, { onConflict: 'throw' });
  return getLiveCustomers(env);
}

async function updateCustomer(clerkId, environmentName, customerId, { name, email } = {}) {
  const { env } = await getUserAndEnv(clerkId, environmentName);
  await stiggClient.updateCustomer(env.serverApiKey, customerId, { name, email });
  return getLiveCustomers(env);
}

async function archiveCustomer(clerkId, environmentName, customerId) {
  const { env } = await getUserAndEnv(clerkId, environmentName);
  if (env.activeCustomerId === customerId) {
    throw new BadRequestError('The active customer cannot be archived');
  }

  await stiggClient.archiveCustomer(env.serverApiKey, customerId);
  return getLiveCustomers(env);
}

async function setActiveCustomer(clerkId, environmentName, customerId) {
  const { env } = await getUserAndEnv(clerkId, environmentName);
  const liveCustomers = await getLiveCustomers(env);
  if (!liveCustomers.some((customer) => customer.customerId === customerId)) {
    throw new NotFoundError(
      `Customer "${customerId}" does not exist in environment "${environmentName}"`,
    );
  }

  const updated = await User.findOneAndUpdate(
    { clerkId },
    { $set: { [`environments.${environmentName}.activeCustomerId`]: customerId } },
    { returnDocument: 'after' },
  );
  return getLiveCustomers(updated.environments.get(environmentName));
}

export {
  getLiveCustomers,
  onboardCustomer,
  listCustomers,
  addCustomer,
  updateCustomer,
  archiveCustomer,
  setActiveCustomer,
};
