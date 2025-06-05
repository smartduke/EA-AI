import Razorpay from 'razorpay';
import { createHmac } from 'node:crypto';
import {
  SUBSCRIPTION_CONFIG,
  type PlanType,
  type BillingPeriod,
} from '@/lib/config/subscription';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: SUBSCRIPTION_CONFIG.RAZORPAY.KEY_ID,
  key_secret: SUBSCRIPTION_CONFIG.RAZORPAY.KEY_SECRET,
});

export interface CreateOrderParams {
  amount: number; // Amount in smallest currency unit (cents for USD)
  currency: string;
  planType: PlanType;
  billingPeriod: BillingPeriod;
  userId: string;
  userEmail: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Create a Razorpay order for subscription payment
 */
export async function createOrder(params: CreateOrderParams) {
  try {
    const { amount, currency, planType, billingPeriod, userId, userEmail } =
      params;

    // Create a shorter receipt (max 40 chars for Razorpay)
    // Use first 8 chars of userId + timestamp suffix
    const shortUserId = userId.substring(0, 8);
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const receipt = `ord_${shortUserId}_${timestamp}`; // Format: ord_12345678_87654321 (24 chars)

    const order = await razorpay.orders.create({
      amount: amount, // Amount in smallest currency unit
      currency: currency,
      receipt: receipt,
      notes: {
        userId,
        userEmail,
        planType,
        billingPeriod,
        createdAt: new Date().toISOString(),
      },
    });

    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Verify payment signature for security
 */
export function verifyPaymentSignature(params: VerifyPaymentParams): boolean {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      params;

    const generated_signature = createHmac(
      'sha256',
      SUBSCRIPTION_CONFIG.RAZORPAY.KEY_SECRET,
    )
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    return generated_signature === razorpay_signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  try {
    const generated_signature = createHmac(
      'sha256',
      SUBSCRIPTION_CONFIG.RAZORPAY.WEBHOOK_SECRET,
    )
      .update(payload)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPayment(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw new Error('Failed to fetch payment details');
  }
}

/**
 * Fetch order details from Razorpay
 */
export async function getOrder(orderId: string) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Failed to fetch order details');
  }
}

/**
 * Create customer for future payments
 */
export async function createCustomer(
  name: string,
  email: string,
  contact?: string,
) {
  try {
    const customer = await razorpay.customers.create({
      name,
      email,
      contact: contact || '',
      notes: {
        createdAt: new Date().toISOString(),
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Create subscription plan (for recurring payments)
 */
export async function createPlan(
  planType: PlanType,
  billingPeriod: BillingPeriod,
) {
  try {
    const amount =
      billingPeriod === 'yearly'
        ? SUBSCRIPTION_CONFIG.PRO_PLAN.PRICE_YEARLY
        : SUBSCRIPTION_CONFIG.PRO_PLAN.PRICE_MONTHLY;

    const plan = await razorpay.plans.create({
      period: billingPeriod === 'yearly' ? 'yearly' : 'monthly',
      interval: 1,
      item: {
        name: `${SUBSCRIPTION_CONFIG.PRO_PLAN.NAME} Plan`,
        amount: amount, // Amount in smallest currency unit
        currency: 'USD',
        description: `${SUBSCRIPTION_CONFIG.PRO_PLAN.NAME} subscription plan - ${billingPeriod}`,
      },
      notes: {
        planType,
        billingPeriod,
        createdAt: new Date().toISOString(),
      },
    });

    return plan;
  } catch (error) {
    console.error('Error creating plan:', error);
    throw new Error('Failed to create subscription plan');
  }
}

/**
 * Create subscription
 */
export async function createSubscription(
  planId: string,
  customerId: string,
  totalCount = 12,
) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount, // Number of billing cycles
      notes: {
        customerId,
        createdAt: new Date().toISOString(),
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription');
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true,
) {
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId,
      cancelAtCycleEnd,
    );

    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}
