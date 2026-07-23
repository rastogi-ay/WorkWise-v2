// Feature IDs for the different features from Stigg
// ** all metered features are expected to be synchronous (calculated usage)
export const CREDIT_CURRENCY = 'cred-type-credits';
export const ANALYTICS_FEATURE_ID = 'feature-analytics';
export const CAMPAIGNS_FEATURE_ID = 'feature-marketing-campaign';
export const SEQUENCES_FEATURE_ID = 'feature-email-sequences';

// Product IDs
export const WORKWISE_AI_PRODUCT_ID = 'product-work-wise';
export const WORKWISE_PLANNER_PRODUCT_ID = 'product-work-wise-planner';

// Error class for feature denied errors to be thrown after entitlement checks
export class FeatureDeniedError extends Error {
  constructor(message) {
    super();
    this.name = 'FeatureDeniedError';
    this.message = message;
  }
}
