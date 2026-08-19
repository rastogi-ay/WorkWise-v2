import express from 'express';
import * as sequencesService from '../../services/pages/sequencesService.js';
import { sendHttpError } from '../../httpErrors.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { resolveStiggContext } from '../../middleware/resolveStiggContext.js';

const router = express.Router();

async function addSequence(req, res) {
  try {
    const usage = await sequencesService.createSequence(req.stiggServerApiKey, req.customerId);
    return res.status(201).json(usage);
  } catch (error) {
    return sendHttpError(error, res, 'Failed to create sequence.');
  }
}

async function fetchSequencesCost(req, res) {
  try {
    const cost = await sequencesService.getSequencesCost(req.stiggServerApiKey, req.customerId);
    return res.status(200).json({
      cost,
    });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get sequence cost.');
  }
}

router.post('/', requireAuth, resolveStiggContext, addSequence);
router.get('/cost', requireAuth, resolveStiggContext, fetchSequencesCost);
export default router;
