export const SUBSCRIPTION_CONFIG = {
  // Free Plan Limits
  FREE_PLAN: {
    SEARCHES_PER_DAY: Number.parseInt(
      process.env.FREE_PLAN_SEARCHES_PER_DAY || '10',
    ),
    DEEP_SEARCHES_PER_DAY: Number.parseInt(
      process.env.FREE_PLAN_DEEP_SEARCHES_PER_DAY || '2',
    ),
    NAME: 'Free',
    PRICE_MONTHLY: 0,
    PRICE_YEARLY: 0,
  },

  // Pro Plan Limits and Pricing
  PRO_PLAN: {
    SEARCHES_PER_DAY: Number.parseInt(
      process.env.PRO_PLAN_SEARCHES_PER_DAY || '100',
    ),
    DEEP_SEARCHES_PER_DAY: Number.parseInt(
      process.env.PRO_PLAN_DEEP_SEARCHES_PER_DAY || '20',
    ),
    NAME: 'Pro',
    PRICE_MONTHLY: Number.parseInt(
      process.env.PRO_PLAN_MONTHLY_PRICE || '2000',
    ), // $20 in cents
    PRICE_YEARLY: Number.parseInt(process.env.PRO_PLAN_YEARLY_PRICE || '19200'), // $192 in cents ($16/month)
  },

  // Razorpay Configuration
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  // Plan Types
  PLAN_TYPES: {
    FREE: 'free',
    PRO: 'pro',
  } as const,

  // Billing Periods
  BILLING_PERIODS: {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  } as const,
} as const;

export type PlanType =
  (typeof SUBSCRIPTION_CONFIG.PLAN_TYPES)[keyof typeof SUBSCRIPTION_CONFIG.PLAN_TYPES];
export type BillingPeriod =
  (typeof SUBSCRIPTION_CONFIG.BILLING_PERIODS)[keyof typeof SUBSCRIPTION_CONFIG.BILLING_PERIODS];

export const getPlanLimits = (planType: PlanType) => {
  switch (planType) {
    case SUBSCRIPTION_CONFIG.PLAN_TYPES.PRO:
      return {
        searchesPerDay: SUBSCRIPTION_CONFIG.PRO_PLAN.SEARCHES_PER_DAY,
        deepSearchesPerDay: SUBSCRIPTION_CONFIG.PRO_PLAN.DEEP_SEARCHES_PER_DAY,
      };
    case SUBSCRIPTION_CONFIG.PLAN_TYPES.FREE:
    default:
      return {
        searchesPerDay: SUBSCRIPTION_CONFIG.FREE_PLAN.SEARCHES_PER_DAY,
        deepSearchesPerDay: SUBSCRIPTION_CONFIG.FREE_PLAN.DEEP_SEARCHES_PER_DAY,
      };
  }
};

export const getPlanPrice = (
  planType: PlanType,
  billingPeriod: BillingPeriod,
) => {
  if (planType === SUBSCRIPTION_CONFIG.PLAN_TYPES.FREE) {
    return 0;
  }

  if (planType === SUBSCRIPTION_CONFIG.PLAN_TYPES.PRO) {
    return billingPeriod === SUBSCRIPTION_CONFIG.BILLING_PERIODS.YEARLY
      ? SUBSCRIPTION_CONFIG.PRO_PLAN.PRICE_YEARLY
      : SUBSCRIPTION_CONFIG.PRO_PLAN.PRICE_MONTHLY;
  }

  return 0;
};
