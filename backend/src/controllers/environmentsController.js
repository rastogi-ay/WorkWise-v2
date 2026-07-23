import express from 'express';
import * as environmentsService from '../services/environmentsService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function list(req, res) {
  try {
    const environments = await environmentsService.listEnvironments(
      req.stiggCustomerId,
    );
    return res.status(200).json({ environments });
  } catch (error) {
    console.error('Failed to list environments:', error);
    return res.status(500).json({ error: 'Failed to list environments' });
  }
}

async function add(req, res) {
  const { name, clientApiKey, serverApiKey } = req.body;

  try {
    const environments = await environmentsService.addEnvironment(
      req.stiggCustomerId,
      name,
      {
        clientApiKey,
        serverApiKey,
      },
    );
    return res.status(201).json({ environments });
  } catch (error) {
    console.error('Failed to add environment:', error);
    return res
      .status(400)
      .json({ error: error.message || 'Failed to add environment' });
  }
}

async function remove(req, res) {
  try {
    const environments = await environmentsService.removeEnvironment(
      req.stiggCustomerId,
      req.params.name,
    );
    return res.status(200).json({ environments });
  } catch (error) {
    console.error('Failed to remove environment:', error);
    return res
      .status(400)
      .json({ error: error.message || 'Failed to remove environment' });
  }
}

async function setActive(req, res) {
  try {
    const environments = await environmentsService.setActiveEnvironment(
      req.stiggCustomerId,
      req.body.name ?? null,
    );
    return res.status(200).json({ environments });
  } catch (error) {
    console.error('Failed to set active environment:', error);
    return res
      .status(400)
      .json({ error: error.message || 'Failed to set active environment' });
  }
}

router.get('/', requireAuth, list);
router.post('/', requireAuth, add);
router.delete('/:name', requireAuth, remove);
router.put('/active', requireAuth, setActive);

export default router;
