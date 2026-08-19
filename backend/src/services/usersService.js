import { clerkClient } from '@clerk/express';
import { User } from '../models/User.js';
import { onboardCustomer } from './customersService.js';

async function syncUser(clerkId) {
  const existing = await User.findOneAndUpdate(
    { clerkId },
    { $set: { lastSeenAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    null;

  // Onboard the Default environment's seed customer before writing anything to Mongo
  await onboardCustomer(process.env.DEFAULT_STIGG_SERVER_API_KEY, clerkId, {
    name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || undefined,
    email: primaryEmail ?? undefined,
  });

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
          },
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    return user;
  } catch (err) {
    if (err.code === 11000) {
      // Lost the race to insert — the other concurrent call won; just bump lastSeenAt.
      // This is because of React's StrictMode
      return User.findOneAndUpdate(
        { clerkId },
        { $set: { lastSeenAt: new Date() } },
        { returnDocument: 'after' },
      );
    }
    throw err;
  }
}

export { syncUser };
