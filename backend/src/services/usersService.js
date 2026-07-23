import { clerkClient } from '@clerk/express';
import { User } from '../models/User.js';

async function syncUser(clerkId) {
  const existing = await User.findOneAndUpdate(
    { clerkId },
    { $set: { lastSeenAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (existing) return { user: existing, isNewUser: false };

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? null;

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
    return { user, isNewUser: true };
  } catch (err) {
    if (err.code === 11000) {
      // Lost the race to insert — the other concurrent call won; just bump lastSeenAt. This is because of React's StrictMode
      const user = await User.findOneAndUpdate(
        { clerkId },
        { $set: { lastSeenAt: new Date() } },
        { returnDocument: 'after' },
      );
      return { user, isNewUser: false };
    }
    throw err;
  }
}

export { syncUser };
