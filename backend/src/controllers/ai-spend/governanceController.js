import express from 'express';
import * as governanceService from '../../services/ai-spend/governanceService.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { resolveStiggContext } from '../../middleware/resolveStiggContext.js';
import { sendHttpError } from '../../httpErrors.js';
import {
  GOVERNANCE_ENTITY_TYPES,
  GOVERNED_CURRENCY_LABEL,
  DEFAULT_GOVERNANCE_CADENCE,
} from '../../stigg/constants.js';

const router = express.Router();

// Entity types are upserted here rather than behind a setup button: the upsert is idempotent, and
// doing it on read means a fresh environment's governance page just works.
async function fetchTree(req, res) {
  try {
    await governanceService.ensureEntityTypes(req.stiggServerApiKey);
    const nodes = await governanceService.getGovernanceTree(req.stiggServerApiKey, req.customerId);

    return res.status(200).json({
      nodes,
      entityTypes: GOVERNANCE_ENTITY_TYPES.map(({ id, displayName }) => ({ id, displayName })),
      defaultCadence: DEFAULT_GOVERNANCE_CADENCE,
      currencyLabel: GOVERNED_CURRENCY_LABEL,
    });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to load governance tree.');
  }
}

async function addNode(req, res) {
  const { entityId, displayName, entityTypeId, parentId, usageLimit, cadence } = req.body;

  try {
    const nodes = await governanceService.createNode(req.stiggServerApiKey, req.customerId, {
      entityId,
      displayName,
      entityTypeId,
      parentId: parentId || null,
      usageLimit: usageLimit ?? null,
      cadence,
    });
    return res.status(201).json({ nodes });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to create governance entity.');
  }
}

async function updateNode(req, res) {
  // null is meaningful here (track usage but never block), so distinguish it from absent.
  const { usageLimit } = req.body;
  if (usageLimit === undefined) {
    return res.status(400).json({ error: 'usageLimit is required (use null for unlimited)' });
  }

  try {
    const nodes = await governanceService.updateNodeLimit(
      req.stiggServerApiKey,
      req.customerId,
      req.params.entityId,
      usageLimit === null ? null : Number(usageLimit),
    );
    return res.status(200).json({ nodes });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to update governance budget.');
  }
}

async function removeNode(req, res) {
  try {
    const nodes = await governanceService.deleteNode(
      req.stiggServerApiKey,
      req.customerId,
      req.params.entityId,
    );
    return res.status(200).json({ nodes });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to delete governance entity.');
  }
}

async function reportNodeUsage(req, res) {
  try {
    const result = await governanceService.reportEntityUsage(
      req.stiggServerApiKey,
      req.customerId,
      req.params.entityId,
      Number(req.body.amount ?? 1),
    );
    return res.status(201).json(result);
  } catch (error) {
    return sendHttpError(error, res, 'Failed to report governance usage.');
  }
}

router.get('/', requireAuth, resolveStiggContext, fetchTree);
router.post('/nodes', requireAuth, resolveStiggContext, addNode);
router.put('/nodes/:entityId', requireAuth, resolveStiggContext, updateNode);
router.delete('/nodes/:entityId', requireAuth, resolveStiggContext, removeNode);
router.post('/nodes/:entityId/usage', requireAuth, resolveStiggContext, reportNodeUsage);

export default router;
