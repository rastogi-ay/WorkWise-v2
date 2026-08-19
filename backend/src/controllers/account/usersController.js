import express from 'express';
import { syncUser } from '../../services/account/usersService.js';
import { toSafeEnvironmentList } from '../../services/account/environmentsService.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { sendHttpError } from '../../httpErrors.js';

const router = express.Router();

async function sync(req, res) {
  const clerkId = req.clerkId;

  try {
    const user = await syncUser(clerkId);

    return res.status(200).json({
      ...user.toJSON(),
      environments: await toSafeEnvironmentList(user),
      activeEnvironment: user.activeEnvironment,
    });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to sync user.');
  }
}

router.post('/sync', requireAuth, sync);
export default router;
