// Feature IDs for the different features from Stigg
// ** all metered features are expected to be synchronous (calculated usage)
export const CREDIT_CURRENCY = 'cred-type-credits';
export const ANALYTICS_FEATURE_ID = 'feature-analytics';
export const CAMPAIGNS_FEATURE_ID = 'feature-marketing-campaign';
export const SEQUENCES_FEATURE_ID = 'feature-email-sequences';

// Product IDs
export const WORKWISE_AI_PRODUCT_ID = 'product-work-wise';
export const WORKWISE_PLANNER_PRODUCT_ID = 'product-work-wise-planner';

export const CREDIT_RATE_MAPPINGS = {
  [CAMPAIGNS_FEATURE_ID]: 'dc2caf63-b135-4dc2-8e70-07326e9f0023',
  [SEQUENCES_FEATURE_ID]: 'eaf78208-a925-4173-a793-1922148cd609',
};

// Error class for feature denied errors to be thrown after entitlement checks
export class FeatureDeniedError extends Error {
  constructor(message) {
    super();
    this.name = 'FeatureDeniedError';
    this.message = message;
  }
}
