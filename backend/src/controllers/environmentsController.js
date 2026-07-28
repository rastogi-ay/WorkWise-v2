import express from 'express';
import * as environmentsService from '../services/environmentsService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function list(req, res) {
  try {
    const environments = await environmentsService.listEnvironments(req.clerkId);
    return res.status(200).json({ environments });
  } catch (error) {
    console.error('Failed to list environments:', error);
    return res.status(500).json({ error: 'Failed to list environments' });
  }
}

async function add(req, res) {
  const { name, clientApiKey, serverApiKey, customerId, firstName, lastName, email } = req.body;

  try {
    const environments = await environmentsService.addEnvironment(req.clerkId, name, {
      clientApiKey,
      serverApiKey,
      customerId,
      firstName,
      lastName,
      email,
    });
    return res.status(201).json({ environments });
  } catch (error) {
    console.error('Failed to add environment:', error);
    return res.status(400).json({ error: error.message });
  }
}

async function remove(req, res) {
  try {
    const environments = await environmentsService.removeEnvironment(req.clerkId, req.params.name);
    return res.status(200).json({ environments });
  } catch (error) {
    console.error('Failed to remove environment:', error);
    return res.status(400).json({ error: error.message });
  }
}

async function setActive(req, res) {
  try {
    const environments = await environmentsService.setActiveEnvironment(
      req.clerkId,
      req.body.name ?? null,
    );
    return res.status(200).json({ environments });
  } catch (error) {
    console.error('Failed to set active environment:', error);
    return res.status(400).json({ error: error.message });
  }
}

router.get('/', requireAuth, list);
router.post('/', requireAuth, add);
router.delete('/:name', requireAuth, remove);
router.put('/', requireAuth, setActive);

export default router;
