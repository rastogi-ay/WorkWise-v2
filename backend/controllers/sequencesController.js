import express from 'express';
import * as sequencesService from '../services/sequencesService.js';
import { FeatureDeniedError } from '../stigg/stiggFeatures.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function addSequence(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const usage = await sequencesService.createSequence(customerId);
    console.log('Sequences Usage:', usage);
    return res.status(201).json({
      access: true,
      usageLimit: usage.credit.usageLimit,
      currentUsage: usage.credit.currentUsage,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({
        access: false,
        error: 'You have reached your credit limit. Please upgrade your plan.',
      });
    }
    console.error('Failed to create sequence:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to create sequence',
    });
  }
}

async function fetchSequencesCreditRate(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const rate = await sequencesService.getSequencesCreditRate(customerId);
    console.log('Sequences Credit Rate:', rate);
    return res.status(200).json({
      amount: rate.amount,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({
        access: false,
        error: 'No credit rate found on subscribed plan.',
      });
    }
    console.error('Failed to get sequence credit rate:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to get sequence credit rate',
    });
  }
}

router.post('/', requireAuth, addSequence);
router.get('/rate', requireAuth, fetchSequencesCreditRate);
export default router;
