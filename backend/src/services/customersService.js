import { User } from '../models/User.js';
import { onboardCustomer } from './usersService.js';

function toSafeCustomerList(env) {
  return (env.customers ?? []).map((customer) => ({
    customerId: customer.customerId,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    isActive: customer.customerId === env.activeCustomerId,
    stiggOnboarded: customer.stiggOnboarded,
  }));
}

async function listCustomers(clerkId, environmentName) {
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('User not found');

  const env = (user.environments ?? new Map()).get(environmentName);
  if (!env) throw new Error(`Environment "${environmentName}" does not exist`);

  return toSafeCustomerList(env);
}

// Adding a customer is synchronous/blocking, same as the first customer created alongside its
// environment — if Stigg's calls hard-fail, nothing is persisted and the user just retries.
async function addCustomer(
  clerkId,
  environmentName,
  customerId,
  { firstName, lastName, email } = {},
) {
  if (environmentName === 'Default') {
    throw new Error('Customers cannot be added to the Default environment');
  }
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const existing = await User.findOne({ clerkId });
  if (!existing) throw new Error('User not found');

  const env = (existing.environments ?? new Map()).get(environmentName);
  if (!env) throw new Error(`Environment "${environmentName}" does not exist`);
  if ((env.customers ?? []).some((customer) => customer.customerId === customerId)) {
    throw new Error(`Customer "${customerId}" already exists in environment "${environmentName}"`);
  }

  const customerName = [firstName, lastName].filter(Boolean).join(' ') || undefined;
  await onboardCustomer(env.serverApiKey, customerId, { name: customerName, email });

  const updated = await User.findOneAndUpdate(
    { clerkId },
    {
      $push: {
        [`environments.${environmentName}.customers`]: {
          customerId,
          firstName: firstName || null,
          lastName: lastName || null,
          email: email || null,
          stiggOnboarded: true,
          createdAt: new Date(),
        },
      },
    },
    { returnDocument: 'after' },
  );
  return toSafeCustomerList(updated.environments.get(environmentName));
}

async function setActiveCustomer(clerkId, environmentName, customerId) {
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('User not found');

  const env = (user.environments ?? new Map()).get(environmentName);
  if (!env) throw new Error(`Environment "${environmentName}" does not exist`);
  if (!(env.customers ?? []).some((customer) => customer.customerId === customerId)) {
    throw new Error(`Customer "${customerId}" does not exist in environment "${environmentName}"`);
  }

  const updated = await User.findOneAndUpdate(
    { clerkId },
    { $set: { [`environments.${environmentName}.activeCustomerId`]: customerId } },
    { returnDocument: 'after' },
  );
  return toSafeCustomerList(updated.environments.get(environmentName));
}

export { listCustomers, addCustomer, setActiveCustomer };
