import { User } from '../../models/User.js';
import { getLiveCustomers, onboardCustomer } from './customersService.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../httpErrors.js';

// One environment's Stigg call failing (bad/revoked key, Stigg being down) shouldn't take out
// the whole list — each environment gets its own try/catch so the rest still come back normally.
async function toSafeEnvironmentList(user) {
  const environments = user.environments ?? new Map();
  return Promise.all(
    Array.from(environments.entries()).map(async ([name, env]) => {
      const base = {
        name,
        clientApiKey: env.clientApiKey,
        isActive: name === user.activeEnvironment,
        activeCustomerId: env.activeCustomerId,
      };
      try {
        return { ...base, customers: await getLiveCustomers(env) };
      } catch (error) {
        console.error(`Failed to load live customers for environment "${name}":`, error);
        return { ...base, customers: [], customersError: true };
      }
    }),
  );
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
  { clientApiKey, serverApiKey, customer: { customerId, name: customerName, email } },
) {
  const existing = await User.findOne({ clerkId });
  if (!existing) throw new NotFoundError('User not found');
  if ((existing.environments ?? new Map()).has(name)) {
    throw new ConflictError(`Environment "${name}" already exists`);
  }

  await onboardCustomer(serverApiKey, customerId, { name: customerName, email });

  const user = await User.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        [`environments.${name}`]: {
          clientApiKey,
          serverApiKey,
          activeCustomerId: customerId,
        },
      },
    },
    { returnDocument: 'after' },
  );
  if (!user) throw new NotFoundError('User not found');
  return toSafeEnvironmentList(user);
}

async function removeEnvironment(clerkId, name) {
  const user = await User.findOne({ clerkId });
  if (!user) throw new NotFoundError('User not found');

  if (!(user.environments ?? new Map()).has(name)) {
    throw new NotFoundError(`Environment "${name}" does not exist`);
  }
  if (user.activeEnvironment === name) {
    throw new BadRequestError('The active environment cannot be removed');
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
  if (!user) throw new NotFoundError('User not found');

  if (name !== null && !(user.environments ?? new Map()).has(name)) {
    throw new NotFoundError(`Environment "${name}" does not exist`);
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
