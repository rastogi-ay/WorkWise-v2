import express from 'express';
import * as sequencesService from '../services/sequencesService.js';
import { sendHttpError } from '../httpErrors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';

const router = express.Router();

async function addSequence(req, res) {
  try {
    const usage = await sequencesService.createSequence(req.stiggServerApiKey, req.customerId);
    console.log('Sequences Usage:', usage);
    return res.status(201).json({
      usageLimit: usage.credit.usageLimit,
      currentUsage: usage.credit.currentUsage,
    });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to create sequence.');
  }
}

async function fetchSequencesCreditRate(req, res) {
  try {
    const rate = await sequencesService.getSequencesCreditRate(
      req.stiggServerApiKey,
      req.customerId,
    );
    console.log('Sequences Credit Rate:', rate);
    return res.status(200).json({
      rate,
    });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get sequence credit rate.');
  }
}

router.post('/', requireAuth, resolveStiggContext, addSequence);
router.get('/rate', requireAuth, resolveStiggContext, fetchSequencesCreditRate);
export default router;
