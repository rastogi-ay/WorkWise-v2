import express from 'express';
import * as templatesService from '../services/templatesService.js';
import { FeatureDeniedError } from '../stigg/stigg.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function fetchTemplates(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const result = await templatesService.getTemplates(customerId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Failed to get templates:', error);
    return res.status(500).json({ error: 'Failed to get templates' });
  }
}

async function createTemplate(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const result = await templatesService.saveTemplate(customerId);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      return res
        .status(403)
        .json({
          error:
            'You cannot create another template. Please upgrade your plan.',
        });
    }
    console.error('Failed to save template:', error);
    return res.status(500).json({ error: 'Failed to save template' });
  }
}

router.post('/', requireAuth, createTemplate);
router.get('/', requireAuth, fetchTemplates);
export default router;
