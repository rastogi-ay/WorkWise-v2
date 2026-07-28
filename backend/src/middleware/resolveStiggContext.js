import { User } from '../models/User.js';

/**
 * Resolves which Stigg server API key and which Stigg customer the request should act
 * against, based on the authenticated user's currently active environment. Must run
 * after requireAuth (needs req.clerkId).
 */
export async function resolveStiggContext(req, res, next) {
  const user = await User.findOne({ clerkId: req.clerkId });
  const env = user?.environments?.get(user.activeEnvironment);

  req.stiggServerApiKey = env?.serverApiKey ?? process.env.DEFAULT_STIGG_SERVER_API_KEY;
  req.customerId = env?.activeCustomerId ?? req.clerkId;
  next();
}
