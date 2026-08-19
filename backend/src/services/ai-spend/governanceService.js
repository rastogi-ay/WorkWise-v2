import { randomUUID } from 'node:crypto';
import {
  DEFAULT_GOVERNANCE_CADENCE,
  GOVERNANCE_ENTITY_TYPES,
  GOVERNED_CURRENCY,
  GOVERNED_CURRENCY_LABEL,
  ROOT_ENTITY_TYPE_ID,
} from '../../stigg/constants.js';
import { BadRequestError, FeatureDeniedError, NotFoundError } from '../../httpErrors.js';
import {
  archiveEntities,
  checkGovernedCurrency,
  listAssignments,
  listEntities,
  queryGovernanceTree,
  consumeCredits,
  upsertAssignments,
  upsertEntities,
  upsertEntityTypes,
} from '../../stigg/stiggClient.js';

const ENTITY_TYPE_BY_ID = new Map(GOVERNANCE_ENTITY_TYPES.map((type) => [type.id, type]));

// The hierarchy is the declaration order in GOVERNANCE_ENTITY_TYPES: a root is the first type, and
// a node's only legal child is the next one along.
function childTypeIdOf(entityTypeId) {
  const index = GOVERNANCE_ENTITY_TYPES.findIndex((type) => type.id === entityTypeId);
  return GOVERNANCE_ENTITY_TYPES[index + 1]?.id ?? null;
}

function attributionKeyOf(entityTypeId) {
  const key = ENTITY_TYPE_BY_ID.get(entityTypeId)?.attributionKeys?.[0];
  if (!key) {
    throw new BadRequestError(`Unknown governance entity type "${entityTypeId}"`);
  }
  return key;
}

// Defined once per environment and shared by every customer in it. The upsert is idempotent, so
// calling this on each tree read keeps the page self-provisioning with no setup step.
export function ensureEntityTypes(serverApiKey) {
  return upsertEntityTypes(serverApiKey, GOVERNANCE_ENTITY_TYPES);
}

// Flattens the tree depth-first so the frontend can render indentation from `depth` without
// rebuilding a hierarchy. Roots and siblings are ordered by display name for a stable table.
function flattenDepthFirst(nodes) {
  const childrenOf = new Map();
  for (const node of nodes) {
    const key = node.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key).push(node);
  }

  const rows = [];
  const visited = new Set();

  function walk(parentId, depth) {
    const children = (childrenOf.get(parentId) ?? []).sort((a, b) =>
      (a.displayName || a.entityId).localeCompare(b.displayName || b.entityId),
    );
    for (const node of children) {
      // Guards against a cycle or a parent that was archived out from under its children — either
      // way, emit the node once rather than looping forever.
      if (visited.has(node.entityId)) continue;
      visited.add(node.entityId);
      rows.push({ ...node, depth });
      walk(node.entityId, depth + 1);
    }
  }

  walk(null, 0);

  // Anything whose parent is missing (archived parent, or a node the tree query didn't return) is
  // still the customer's data — surface it at the root rather than dropping it silently.
  for (const node of nodes) {
    if (!visited.has(node.entityId)) {
      visited.add(node.entityId);
      rows.push({ ...node, depth: 0 });
    }
  }

  return rows;
}

// The tree query already joins hierarchy + budget + usage, so it's the primary read. Entities are
// listed too, purely to include any node that has no assignment yet (which the budget-row query
// wouldn't return) so a freshly created node can never appear to vanish.
export async function getGovernanceTree(serverApiKey, customerId) {
  const [treeRows, entities, assignments] = await Promise.all([
    queryGovernanceTree(serverApiKey, customerId, { currencyIds: [GOVERNED_CURRENCY] }),
    listEntities(serverApiKey, customerId),
    listAssignments(serverApiKey, customerId),
  ]);

  const parentByEntityId = new Map(
    assignments
      .filter((assignment) => assignment.currencyId === GOVERNED_CURRENCY)
      .map((assignment) => [assignment.entityId, assignment.parentId ?? null]),
  );

  // Node-wide budgets only (scopeEntityIds: []). Dimension-scoped sub-budgets aren't modeled here.
  const byEntityId = new Map(
    treeRows
      .filter((row) => (row.scopeEntityIds ?? []).length === 0)
      .map((row) => [
        row.entityId,
        {
          entityId: row.entityId,
          displayName: row.displayName ?? row.entityId,
          entityTypeId: row.entityTypeId,
          parentId: row.parentId ?? null,
          usageLimit: row.usageLimit ?? null,
          currentUsage: row.currentUsage ?? 0,
          utilization: row.utilization ?? null,
          cadence: row.cadence ?? null,
          usagePeriodEnd: row.usagePeriodEnd ?? null,
        },
      ]),
  );

  for (const entity of entities) {
    if (byEntityId.has(entity.id)) continue;
    byEntityId.set(entity.id, {
      entityId: entity.id,
      displayName: entity.displayName ?? entity.id,
      entityTypeId: entity.entityTypeId,
      parentId: parentByEntityId.get(entity.id) ?? null,
      usageLimit: null,
      currentUsage: 0,
      utilization: null,
      cadence: null,
      usagePeriodEnd: null,
    });
  }

  const nodes = [...byEntityId.values()].map((node) => ({
    ...node,
    childEntityTypeId: childTypeIdOf(node.entityTypeId),
  }));

  return flattenDepthFirst(nodes);
}

async function findEntity(serverApiKey, customerId, entityId) {
  const entities = await listEntities(serverApiKey, customerId);
  const entity = entities.find((candidate) => candidate.id === entityId);
  if (!entity) {
    throw new NotFoundError(`Governance entity "${entityId}" does not exist`);
  }
  return entity;
}

// Creating a node is two calls: the entity (identity + name), then the assignment, which is where
// both the budget and the tree placement live — the entity upsert rejects parentId.
export async function createNode(
  serverApiKey,
  customerId,
  { entityId, displayName, entityTypeId, parentId, usageLimit, cadence },
) {
  if (!entityId?.trim()) throw new BadRequestError('entityId is required');
  if (!ENTITY_TYPE_BY_ID.has(entityTypeId)) {
    throw new BadRequestError(`Unknown governance entity type "${entityTypeId}"`);
  }

  if (parentId) {
    const parent = await findEntity(serverApiKey, customerId, parentId);
    const expected = childTypeIdOf(parent.entityTypeId);
    if (!expected) {
      throw new BadRequestError(
        `"${parent.entityTypeId}" is the deepest level and cannot have children`,
      );
    }
    if (expected !== entityTypeId) {
      throw new BadRequestError(
        `A "${parent.entityTypeId}" can only contain a "${expected}", not a "${entityTypeId}"`,
      );
    }
  } else if (entityTypeId !== ROOT_ENTITY_TYPE_ID) {
    throw new BadRequestError(`A "${entityTypeId}" requires a parent entity`);
  }

  await upsertEntities(serverApiKey, customerId, [
    { id: entityId, entityTypeId, displayName: displayName?.trim() || entityId },
  ]);

  await upsertAssignments(serverApiKey, customerId, [
    {
      entityId,
      currencyId: GOVERNED_CURRENCY,
      parentId: parentId ?? null,
      usageLimit: usageLimit ?? null,
      cadence: cadence || DEFAULT_GOVERNANCE_CADENCE,
    },
  ]);

  return getGovernanceTree(serverApiKey, customerId);
}

// usageLimit null means "track usage but never block" — useful for watching a node before
// committing to a number. cadence is omitted so the upsert's patch semantics preserve it.
export async function updateNodeLimit(serverApiKey, customerId, entityId, usageLimit) {
  if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit < 0)) {
    throw new BadRequestError('usageLimit must be a non-negative number or null');
  }

  await findEntity(serverApiKey, customerId, entityId);
  await upsertAssignments(serverApiKey, customerId, [
    { entityId, currencyId: GOVERNED_CURRENCY, usageLimit },
  ]);

  return getGovernanceTree(serverApiKey, customerId);
}

// Archive is NOT leaf-gated by the platform — archiving a parent would leave its children active
// and orphaned. So collect the subtree and archive deepest-first ourselves.
export async function deleteNode(serverApiKey, customerId, entityId) {
  await findEntity(serverApiKey, customerId, entityId);
  const assignments = await listAssignments(serverApiKey, customerId);

  const childrenOf = new Map();
  for (const assignment of assignments) {
    if (assignment.currencyId !== GOVERNED_CURRENCY) continue;
    const parentId = assignment.parentId ?? null;
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(assignment.entityId);
  }

  // Breadth-first down the subtree, then reverse so the deepest ids are archived first.
  const ordered = [];
  const queue = [entityId];
  const seen = new Set([entityId]);
  while (queue.length > 0) {
    const current = queue.shift();
    ordered.push(current);
    for (const child of childrenOf.get(current) ?? []) {
      if (seen.has(child)) continue;
      seen.add(child);
      queue.push(child);
    }
  }

  await archiveEntities(serverApiKey, customerId, ordered.reverse());
  return getGovernanceTree(serverApiKey, customerId);
}

// Turns a denied check into a message the operator can act on. Shared by the governance report
// control and the chatbot gate so both explain a denial the same way.
//
// One check enforces two independent things: the governance chain AND the account-level pool. Which
// one objected changes what you should do about it, so they get different messages.
export function describeDenial(check, requested) {
  // The chain runs leaf -> root and any exhausted ancestor blocks the whole subtree, so the node
  // that denied the request is often not the one being reported against.
  const blocked = (check.chains ?? []).flat().find((node) => !node.isGranted);
  if (blocked) {
    const remaining = Math.max(0, (blocked.usageLimit ?? 0) - blocked.currentUsage);
    return `Blocked by "${blocked.entityId}" — ${requested} ${GOVERNED_CURRENCY_LABEL} requested, ${remaining} of ${blocked.usageLimit} left this period.`;
  }

  // No governed node objected, so the account's own balance is the binding constraint. Raising any
  // budget would change nothing. EntitlementNotFound means the currency isn't granted on the plan at
  // all, which is a setup gap rather than an exhausted balance — worth saying so explicitly.
  if (check.accessDeniedReason === 'EntitlementNotFound') {
    return `This customer has no ${GOVERNED_CURRENCY_LABEL} at all — grant ${GOVERNED_CURRENCY} on their plan before budgeting it.`;
  }

  const poolRemaining = Math.max(0, (check.usageLimit ?? 0) - (check.currentUsage ?? 0));
  return `Every budget allows this, but the account ${GOVERNED_CURRENCY_LABEL} balance does not — ${requested} requested, ${poolRemaining} of ${check.usageLimit ?? 0} left. Top up to continue.`;
}

// The chatbot's gate. Consults the governance chain for whichever entity the caller is acting as,
// before any tokens are spent. A missing/empty `dimensions` means nobody is selected, and governance
// is opt-in — so there is nothing to enforce and the caller proceeds ungoverned.
//
// requestedUsage is 1 rather than the eventual token count: the spend is only known after the reply
// is generated, and the question being asked here is "does this entity have any allowance left",
// matching how the account-level gate in tokensService already behaves.
export async function checkTokenBudget(serverApiKey, customerId, dimensions) {
  if (!dimensions || Object.keys(dimensions).length === 0) return null;

  const check = await checkGovernedCurrency(
    serverApiKey,
    customerId,
    GOVERNED_CURRENCY,
    1,
    dimensions,
  );
  if (!check.isGranted) {
    throw new FeatureDeniedError(describeDenial(check, 1), check);
  }
  return check;
}

// Check-then-consume against one node. The amount is in governed currency units (tokens), deducted
// straight from the pool — the same path the chatbot uses, so this control exercises the real thing.
export async function reportEntityUsage(serverApiKey, customerId, entityId, amount) {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new BadRequestError('amount must be a positive integer');
  }

  const entity = await findEntity(serverApiKey, customerId, entityId);
  const dimensions = { [attributionKeyOf(entity.entityTypeId)]: entityId };

  const check = await checkGovernedCurrency(
    serverApiKey,
    customerId,
    GOVERNED_CURRENCY,
    amount,
    dimensions,
  );

  if (!check.isGranted) {
    throw new FeatureDeniedError(describeDenial(check, amount), check);
  }

  const usage = await consumeCredits(
    serverApiKey,
    customerId,
    GOVERNED_CURRENCY,
    amount,
    randomUUID(),
    dimensions,
  );

  return {
    entityId,
    amount,
    accountCurrentUsage: usage?.credit?.currentUsage ?? null,
    accountUsageLimit: usage?.credit?.usageLimit ?? null,
    chain: (check.chains ?? []).flat().map((node) => ({
      entityId: node.entityId,
      usageLimit: node.usageLimit,
      currentUsage: node.currentUsage,
    })),
  };
}
