import express from 'express';
import * as environmentsService from '../../services/account/environmentsService.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { sendHttpError } from '../../httpErrors.js';

const router = express.Router();

async function list(req, res) {
  try {
    const environments = await environmentsService.listEnvironments(req.clerkId);
    return res.status(200).json({ environments });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to list environments.');
  }
}

async function add(req, res) {
  const { name, clientApiKey, serverApiKey, customer } = req.body;

  if (!name || !clientApiKey || !serverApiKey || !customer?.customerId) {
    return res
      .status(400)
      .json({ error: 'name, clientApiKey, serverApiKey, and customerId are required' });
  }
  if (!clientApiKey.startsWith('client')) {
    return res.status(400).json({ error: 'clientApiKey must start with "client"' });
  }
  if (!serverApiKey.startsWith('server')) {
    return res.status(400).json({ error: 'serverApiKey must start with "server"' });
  }

  try {
    const environments = await environmentsService.addEnvironment(req.clerkId, name, {
      clientApiKey,
      serverApiKey,
      customer,
    });
    return res.status(201).json({ environments });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to add environment.');
  }
}

async function remove(req, res) {
  const { name } = req.params;

  if (name === 'Default') {
    return res.status(400).json({ error: 'The Default environment cannot be removed' });
  }

  try {
    const environments = await environmentsService.removeEnvironment(req.clerkId, name);
    return res.status(200).json({ environments });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to remove environment.');
  }
}

async function setActive(req, res) {
  const name = req.body.name ?? null;

  // null clears the active environment; anything else must be a non-empty name
  if (name !== null && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ error: 'name must be a non-empty string or null' });
  }

  try {
    const environments = await environmentsService.setActiveEnvironment(req.clerkId, name);
    return res.status(200).json({ environments });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to set active environment.');
  }
}

router.get('/', requireAuth, list);
router.post('/', requireAuth, add);
router.delete('/:name', requireAuth, remove);
router.put('/', requireAuth, setActive);

export default router;
