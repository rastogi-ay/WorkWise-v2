import { clerkClient } from '@clerk/express';
import { User } from '../models/User.js';
import { createCustomer, createSubscription } from '../stigg/stiggClient.js';
import { WORKWISE_AI_FREE_PLAN_ID } from '../stigg/constants.js';

async function syncUser(clerkId) {
  const existing = await User.findOneAndUpdate(
    { clerkId },
    { $set: { lastSeenAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (existing) return ensureOnboarded(existing);

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    null;

  // if the user is signing up for the first time, do a lazy upsert to MongoDB
  try {
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          email: primaryEmail,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          clerkId,
          activeEnvironment: 'Default',
          'environments.Default': {
            clientApiKey: process.env.DEFAULT_STIGG_CLIENT_API_KEY,
            serverApiKey: process.env.DEFAULT_STIGG_SERVER_API_KEY,
            activeCustomerId: clerkId,
            customers: [{ customerId: clerkId, stiggOnboarded: false, createdAt: new Date() }],
          },
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    return ensureOnboarded(user);
  } catch (err) {
    if (err.code === 11000) {
      // Lost the race to insert — the other concurrent call won; just bump lastSeenAt.
      // This is because of React's StrictMode
      const user = await User.findOneAndUpdate(
        { clerkId },
        { $set: { lastSeenAt: new Date() } },
        { returnDocument: 'after' },
      );
      return ensureOnboarded(user);
    }
    throw err;
  }
}

async function onboardUser(serverApiKey, customerId, { name, email } = {}) {
  let customer;
  try {
    customer = await createCustomer(serverApiKey, customerId, { name, email });
  } catch (error) {
    if (error.status !== 409) throw error;
    customer = { id: customerId };
  }

  await createSubscription(serverApiKey, customer.id, WORKWISE_AI_FREE_PLAN_ID);
  return customer;
}

async function ensureOnboarded(user) {
  for (const [envName, env] of user.environments ?? new Map()) {
    for (const customer of env.customers ?? []) {
      if (customer.stiggOnboarded) continue;

      try {
        // Only the user's own clerkId-customer (Default's signup-time customer) gets a real
        // name/email — everything else is a user-chosen, arbitrary customer with no profile
        // to draw from, and stays ID-only per how it's created.
        const profile =
          customer.customerId === user.clerkId
            ? { name: `${user.firstName} ${user.lastName}`, email: user.email }
            : {};
        await onboardUser(env.serverApiKey, customer.customerId, profile);

        await User.findOneAndUpdate(
          {
            clerkId: user.clerkId,
            [`environments.${envName}.customers.customerId`]: customer.customerId,
          },
          { $set: { [`environments.${envName}.customers.$.stiggOnboarded`]: true } },
        );
      } catch (error) {
        console.error(`Onboarding retry failed for ${customer.customerId} in ${envName}:`, error);
        // swallowed — retried again on next sync
      }
    }
  }

  return User.findOne({ clerkId: user.clerkId });
}

export { syncUser, onboardUser };
