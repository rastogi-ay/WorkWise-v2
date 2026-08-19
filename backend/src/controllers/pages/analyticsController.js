import express from 'express';
import * as analyticsService from '../../services/pages/analyticsService.js';
import { sendHttpError } from '../../httpErrors.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { resolveStiggContext } from '../../middleware/resolveStiggContext.js';

const router = express.Router();

async function fetchAnalytics(req, res) {
  try {
    await analyticsService.getAnalytics(req.stiggServerApiKey, req.customerId);
    return res.status(200).json({});
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get analytics.');
  }
}

router.get('/', requireAuth, resolveStiggContext, fetchAnalytics);
export default router;
