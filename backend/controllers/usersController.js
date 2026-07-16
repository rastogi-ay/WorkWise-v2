import express from 'express';
import { syncUser } from '../services/usersService.js';
import { toSafeEnvironmentList } from '../services/environmentsService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { createCustomer } from '../stigg/stiggService.js';

const router = express.Router();

async function sync(req, res) {
  const clerkId = req.stiggCustomerId;

  try {
    const { user, isNewUser } = await syncUser(clerkId);
    if (isNewUser) {
      await createCustomer(user);
    }

    return res.status(200).json({
      ...user.toJSON(),
      environments: toSafeEnvironmentList(user),
      activeEnvironment: user.activeEnvironment,
    });
  } catch (error) {
    console.error('Failed to sync user:', error);
    return res.status(500).json({ error: 'Failed to sync user' });
  }
}

router.post('/sync', requireAuth, sync);
export default router;
