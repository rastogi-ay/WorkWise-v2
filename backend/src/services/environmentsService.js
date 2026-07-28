import { User } from '../models/User.js';
import { onboardCustomer } from './usersService.js';

function toSafeEnvironmentList(user) {
  const environments = user.environments ?? new Map();
  return Array.from(environments.entries()).map(([name, env]) => ({
    name,
    clientApiKey: env.clientApiKey,
    isActive: name === user.activeEnvironment,
    activeCustomerId: env.activeCustomerId,
    customers: (env.customers ?? []).map((customer) => ({
      customerId: customer.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      isActive: customer.customerId === env.activeCustomerId,
      stiggOnboarded: customer.stiggOnboarded,
    })),
  }));
}

async function listEnvironments(clerkId) {
  const user = await User.findOne({ clerkId });
  return user ? toSafeEnvironmentList(user) : [];
}

// Creating an environment and provisioning its first customer happen as one atomic operation:
// a new environment never exists in Mongo without a confirmed Stigg customer.
async function addEnvironment(
  clerkId,
  name,
  { clientApiKey, serverApiKey, customerId, firstName, lastName, email },
) {
  if (!name || !clientApiKey || !serverApiKey || !customerId) {
    throw new Error('name, clientApiKey, serverApiKey, and customerId are required');
  }
  if (!clientApiKey.startsWith('client')) {
    throw new Error('clientApiKey must start with "client"');
  }
  if (!serverApiKey.startsWith('server')) {
    throw new Error('serverApiKey must start with "server"');
  }

  const existing = await User.findOne({ clerkId });
  if (!existing) throw new Error('User not found');
  if ((existing.environments ?? new Map()).has(name)) {
    throw new Error(`Environment "${name}" already exists`);
  }

  const customerName = [firstName, lastName].filter(Boolean).join(' ') || undefined;
  await onboardCustomer(serverApiKey, customerId, { name: customerName, email });

  const user = await User.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        [`environments.${name}`]: {
          clientApiKey,
          serverApiKey,
          activeCustomerId: customerId,
          customers: [
            {
              customerId,
              firstName: firstName || null,
              lastName: lastName || null,
              email: email || null,
              stiggOnboarded: true,
              createdAt: new Date(),
            },
          ],
        },
      },
    },
    { returnDocument: 'after' },
  );
  if (!user) throw new Error('User not found');
  return toSafeEnvironmentList(user);
}

async function removeEnvironment(clerkId, name) {
  if (name === 'Default') {
    throw new Error('The Default environment cannot be removed');
  }

  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('User not found');

  if (user.activeEnvironment === name) {
    throw new Error('The active environment cannot be removed');
  }

  const updated = await User.findOneAndUpdate(
    { clerkId },
    { $unset: { [`environments.${name}`]: '' } },
    { returnDocument: 'after' },
  );
  return toSafeEnvironmentList(updated);
}

async function setActiveEnvironment(clerkId, name) {
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('User not found');

  if (name !== null && !(user.environments ?? new Map()).has(name)) {
    throw new Error(`Environment "${name}" does not exist`);
  }

  const updated = await User.findOneAndUpdate(
    { clerkId },
    { $set: { activeEnvironment: name } },
    { returnDocument: 'after' },
  );
  return toSafeEnvironmentList(updated);
}

export {
  toSafeEnvironmentList,
  listEnvironments,
  addEnvironment,
  removeEnvironment,
  setActiveEnvironment,
};
