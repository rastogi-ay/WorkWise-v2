import { User } from '../models/User';

export const STIGG_BASE_URL = 'https://api.stigg.io/api/v1';

// Used on every request to get the Stigg API key from the environment the user is currently on
export async function getActiveServerApiKey(clerkId) {
  const user = await User.findOne({ clerkId }).select(
    '+environments.serverApiKey',
  );
  const activeEnv = user?.activeEnvironment;
  return activeEnv?.serverApiKey ?? process.env.DEFAULT_STIGG_SERVER_API_KEY;
}

async function createCustomer(user) {
  try {
    const response = await fetch(`${STIGG_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'X-API-KEY': getActiveServerApiKey(user.clerkId),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: user.clerkId,
        name: `${user.firstName} + ${user.lastName}`,
        email: user.email,
      }),
    });
    console.log('Stigg customer created:', response);
    return {
      name: response.data.name,
    };
  } catch (err) {
    throw err;
  }
}

export { createCustomer };
