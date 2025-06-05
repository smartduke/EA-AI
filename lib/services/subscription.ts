import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  userSubscription,
  usageTracking,
  paymentTransaction,
} from '@/lib/db/schema';
import { eq, and, } from 'drizzle-orm';
import {
  getPlanLimits,
  type PlanType,
  type BillingPeriod,
} from '@/lib/config/subscription';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface CreateSubscriptionParams {
  userId: string;
  planType: PlanType;
  billingPeriod?: BillingPeriod;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

export interface UpdateUsageParams {
  userId: string;
  date: string; // YYYY-MM-DD format
  searchesUsed?: number;
  deepSearchesUsed?: number;
}

export interface CreatePaymentTransactionParams {
  userId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  planType: PlanType;
  billingPeriod?: BillingPeriod;
  metadata?: Record<string, any>;
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  try {
    const [subscription] = await db
      .select()
      .from(userSubscription)
      .where(eq(userSubscription.userId, userId))
      .limit(1);

    return subscription || null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw new Error('Failed to fetch subscription');
  }
}

/**
 * Create or update user subscription
 */
export async function createOrUpdateSubscription(
  params: CreateSubscriptionParams,
) {
  try {
    const existingSubscription = await getUserSubscription(params.userId);

    if (existingSubscription) {
      // Update existing subscription
      const [updated] = await db
        .update(userSubscription)
        .set({
          planType: params.planType,
          billingPeriod: params.billingPeriod,
          razorpaySubscriptionId: params.razorpaySubscriptionId,
          razorpayCustomerId: params.razorpayCustomerId,
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          status: 'active',
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .where(eq(userSubscription.userId, params.userId))
        .returning();

      return updated;
    } else {
      // Create new subscription
      const [created] = await db
        .insert(userSubscription)
        .values({
          userId: params.userId,
          planType: params.planType,
          billingPeriod: params.billingPeriod,
          razorpaySubscriptionId: params.razorpaySubscriptionId,
          razorpayCustomerId: params.razorpayCustomerId,
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          status: 'active',
        })
        .returning();

      return created;
    }
  } catch (error) {
    console.error('Error creating/updating subscription:', error);
    throw new Error('Failed to create/update subscription');
  }
}

/**
 * Cancel user subscription
 */
export async function cancelSubscription(
  userId: string,
  cancelAtPeriodEnd = true,
) {
  try {
    const [updated] = await db
      .update(userSubscription)
      .set({
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancelAtPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(userSubscription.userId, userId))
      .returning();

    return updated;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Get user's usage for a specific date
 */
export async function getUserUsage(userId: string, date: string) {
  try {
    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(
        and(eq(usageTracking.userId, userId), eq(usageTracking.date, date)),
      )
      .limit(1);

    return (
      usage || {
        searchesUsed: 0,
        deepSearchesUsed: 0,
        _isFromDatabase: false, // Flag to indicate this is a fallback object
      }
    );
  } catch (error) {
    console.error('Error fetching user usage:', error);
    throw new Error('Failed to fetch usage');
  }
}

/**
 * Update user usage
 */
export async function updateUsage(params: UpdateUsageParams) {
  try {
    const existingUsage = await getUserUsage(params.userId, params.date);

    // Check if we got an actual database record (not the fallback object)
    const hasExistingRecord = !('_isFromDatabase' in existingUsage);

    if (hasExistingRecord) {
      // Update existing usage record
      console.log('Updating existing usage record for user:', params.userId);
      const [updated] = await db
        .update(usageTracking)
        .set({
          searchesUsed: params.searchesUsed ?? existingUsage.searchesUsed,
          deepSearchesUsed:
            params.deepSearchesUsed ?? existingUsage.deepSearchesUsed,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(usageTracking.userId, params.userId),
            eq(usageTracking.date, params.date),
          ),
        )
        .returning();

      return updated;
    } else {
      // Create new usage record
      console.log('Creating new usage record for user:', params.userId);
      const [created] = await db
        .insert(usageTracking)
        .values({
          userId: params.userId,
          date: params.date,
          searchesUsed: params.searchesUsed ?? 0,
          deepSearchesUsed: params.deepSearchesUsed ?? 0,
        })
        .returning();

      return created;
    }
  } catch (error) {
    console.error('Error updating usage:', error);
    throw new Error('Failed to update usage');
  }
}

/**
 * Increment user usage
 */
export async function incrementUsage(
  userId: string,
  type: 'search' | 'deepSearch',
) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const currentUsage = await getUserUsage(userId, today);

  console.log(`Incrementing ${type} usage for user ${userId}`);
  console.log('Current usage:', currentUsage);

  if (type === 'search') {
    const newSearchesUsed = currentUsage.searchesUsed + 1;
    console.log(
      `Updating searchesUsed from ${currentUsage.searchesUsed} to ${newSearchesUsed}`,
    );

    return updateUsage({
      userId,
      date: today,
      searchesUsed: newSearchesUsed,
      deepSearchesUsed: currentUsage.deepSearchesUsed, // Preserve existing value
    });
  } else {
    const newDeepSearchesUsed = currentUsage.deepSearchesUsed + 1;
    console.log(
      `Updating deepSearchesUsed from ${currentUsage.deepSearchesUsed} to ${newDeepSearchesUsed}`,
    );

    return updateUsage({
      userId,
      date: today,
      searchesUsed: currentUsage.searchesUsed, // Preserve existing value
      deepSearchesUsed: newDeepSearchesUsed,
    });
  }
}

/**
 * Check if user can perform action based on their plan limits
 */
export async function canUserPerformAction(
  userId: string,
  type: 'search' | 'deepSearch',
): Promise<boolean> {
  try {
    const subscription = await getUserSubscription(userId);
    const planType = subscription?.planType || 'free';
    const limits = getPlanLimits(planType);

    const today = new Date().toISOString().split('T')[0];
    const usage = await getUserUsage(userId, today);

    if (type === 'search') {
      return usage.searchesUsed < limits.searchesPerDay;
    } else {
      return usage.deepSearchesUsed < limits.deepSearchesPerDay;
    }
  } catch (error) {
    console.error('Error checking user limits:', error);
    return false; // Default to not allowing action if there's an error
  }
}

/**
 * Get user's remaining usage for today
 */
export async function getUserRemainingUsage(userId: string) {
  try {
    const subscription = await getUserSubscription(userId);
    const planType = subscription?.planType || 'free';
    const limits = getPlanLimits(planType);

    const today = new Date().toISOString().split('T')[0];
    const usage = await getUserUsage(userId, today);

    return {
      searches: {
        used: usage.searchesUsed,
        limit: limits.searchesPerDay,
        remaining: Math.max(0, limits.searchesPerDay - usage.searchesUsed),
      },
      deepSearches: {
        used: usage.deepSearchesUsed,
        limit: limits.deepSearchesPerDay,
        remaining: Math.max(
          0,
          limits.deepSearchesPerDay - usage.deepSearchesUsed,
        ),
      },
    };
  } catch (error) {
    console.error('Error getting remaining usage:', error);
    throw new Error('Failed to get remaining usage');
  }
}

/**
 * Create payment transaction record
 */
export async function createPaymentTransaction(
  params: CreatePaymentTransactionParams,
) {
  try {
    const [transaction] = await db
      .insert(paymentTransaction)
      .values({
        userId: params.userId,
        razorpayPaymentId: params.razorpayPaymentId,
        razorpayOrderId: params.razorpayOrderId,
        razorpaySignature: params.razorpaySignature,
        amount: params.amount.toString(),
        currency: params.currency,
        status: params.status,
        planType: params.planType,
        billingPeriod: params.billingPeriod,
        metadata: params.metadata,
      })
      .returning();

    return transaction;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw new Error('Failed to create payment transaction');
  }
}

/**
 * Update payment transaction status
 */
export async function updatePaymentTransactionStatus(
  razorpayPaymentId: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
) {
  try {
    const [updated] = await db
      .update(paymentTransaction)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(paymentTransaction.razorpayPaymentId, razorpayPaymentId))
      .returning();

    return updated;
  } catch (error) {
    console.error('Error updating payment transaction:', error);
    throw new Error('Failed to update payment transaction');
  }
}

/**
 * Reset user usage for the current day (used when upgrading subscription)
 */
export async function resetUserUsage(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if usage record exists for today
    const existingUsage = await getUserUsage(userId, today);

    if (existingUsage.searchesUsed || existingUsage.deepSearchesUsed) {
      // Reset existing usage to zero
      await db
        .update(usageTracking)
        .set({
          searchesUsed: 0,
          deepSearchesUsed: 0,
          updatedAt: new Date(),
        })
        .where(
          and(eq(usageTracking.userId, userId), eq(usageTracking.date, today)),
        );
    }

    return { success: true, message: 'Usage reset successfully' };
  } catch (error) {
    console.error('Error resetting user usage:', error);
    throw new Error('Failed to reset user usage');
  }
}

/**
 * Get user's payment history
 */
export async function getUserPaymentHistory(userId: string) {
  try {
    const transactions = await db
      .select()
      .from(paymentTransaction)
      .where(eq(paymentTransaction.userId, userId))
      .orderBy(paymentTransaction.createdAt);

    return transactions;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw new Error('Failed to fetch payment history');
  }
}
