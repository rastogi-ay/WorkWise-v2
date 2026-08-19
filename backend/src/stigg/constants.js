// Feature IDs for the different features from Stigg
// ** all metered features are expected to be synchronous (calculated usage)
export const CREDIT_CURRENCY = 'cred-type-credits';
export const ANALYTICS_FEATURE_ID = 'feature-analytics';
export const SEQUENCES_FEATURE_ID = 'feature-email-sequences';

// Product IDs
export const WORKWISE_AI_PRODUCT_ID = 'product-work-wise';
export const WORKWISE_PLANNER_PRODUCT_ID = 'product-work-wise-planner';

// Plan IDs
export const WORKWISE_AI_FREE_PLAN_ID = 'plan-work-wise-ai-free';

// --- Governance ---------------------------------------------------------------
// Entity types are defined once per environment. Each declares the attribution key(s) that usage
// events carry to identify an instance; Stigg allows at most 2 keys per type and 4 tree levels.
// The array order IS the hierarchy: a node's legal child type is the next entry.
export const GOVERNANCE_ENTITY_TYPES = [
  { id: 'department', displayName: 'Department', attributionKeys: ['departmentId'] },
  { id: 'team', displayName: 'Team', attributionKeys: ['teamId'] },
  { id: 'user', displayName: 'User', attributionKeys: ['userId'] },
];

export const ROOT_ENTITY_TYPE_ID = GOVERNANCE_ENTITY_TYPES[0].id;

// Single-unit ISO-8601 duration for the budget reset window. Composites like 'P1M10D' are rejected.
export const DEFAULT_GOVERNANCE_CADENCE = 'P1M';

// Governance budgets exactly one thing: the token credit currency the chatbot spends. Tokens are
// consumed directly against the currency (POST /api/v1/credits/consumption), so there is no metered
// feature in the loop at all — no feature to entitle, no consumption mapping to configure, and an
// amount that is already denominated in tokens.
//
// Deliberately NOT cred-type-credits: credits still back sequences (see sequencesService.js) and the
// account balance on /credits, but they are not governed.
export const GOVERNED_CURRENCY = 'cred-type-token';
export const GOVERNED_CURRENCY_LABEL = 'tokens';
