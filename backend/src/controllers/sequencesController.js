import express from 'express';
import * as sequencesService from '../services/sequencesService.js';
import { FeatureDeniedError } from '../stigg/constants.js';
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
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({});
    }
    console.error('Failed to create sequence:', error);
    return res.status(500).json({
      error: 'Failed to create sequence.',
    });
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
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({});
    }
    console.error('Failed to get sequence credit rate:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to get sequence credit rate.',
    });
  }
}

router.post('/', requireAuth, resolveStiggContext, addSequence);
router.get('/rate', requireAuth, resolveStiggContext, fetchSequencesCreditRate);
export default router;
