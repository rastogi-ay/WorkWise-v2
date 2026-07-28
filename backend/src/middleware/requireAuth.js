import { getAuth } from '@clerk/express';

/**
 * Requires a Clerk session. Sets req.clerkId to the verified Clerk id.
 * Returns 401 JSON if there is no session (unlike @clerk/express requireAuth(), which redirects browsers).
 */
export function requireAuth(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.clerkId = userId;
  next();
}
