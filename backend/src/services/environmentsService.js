import { User } from '../models/User.js';
import { onboardUser } from './usersService.js';
import { BadRequestError, ConflictError, NotFoundError } from '../httpErrors.js';

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
  const existing = await User.findOne({ clerkId });
  if (!existing) throw new NotFoundError('User not found');
  if ((existing.environments ?? new Map()).has(name)) {
    throw new ConflictError(`Environment "${name}" already exists`);
  }

  const customerName = [firstName, lastName].filter(Boolean).join(' ') || undefined;
  await onboardUser(serverApiKey, customerId, { name: customerName, email });

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
