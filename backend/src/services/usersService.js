import { clerkClient } from '@clerk/express';
import { User } from '../models/User.js';
import { createCustomer, createSubscription } from '../stigg/stiggClient.js';
import { WORKWISE_AI_FREE_PLAN_ID } from '../stigg/stiggFeatures.js';

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
        $setOnInsert: { clerkId },
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

// Provisions a user in Stigg if they haven't been already, retrying on every sync until it succeeds.
async function ensureOnboarded(user) {
  if (user.stiggOnboarded) return user;

  let customer;
  try {
    customer = await createCustomer(user);
  } catch (error) {
    // 409 means the customer already exists (e.g. a prior attempt got this far before failing
    // on the subscription step) — treat that as success rather than erroring.
    if (error.status !== 409) throw error;
    customer = { id: user.clerkId };
  }

  // TODO: add flexibility around what plan the user wants to subscribe the customer to?
  await createSubscription(customer.id, WORKWISE_AI_FREE_PLAN_ID);

  const updated = await User.findOneAndUpdate(
    { clerkId: user.clerkId },
    { $set: { stiggOnboarded: true } },
    { returnDocument: 'after' },
  );
  return updated ?? user;
}

export { syncUser };
