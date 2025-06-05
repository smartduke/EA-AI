import { NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import {
  getUserSubscription,
  getUserRemainingUsage,
} from '@/lib/services/subscription';

export async function GET() {
  try {
    // Get user from Supabase
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user subscription and usage
    const [subscription, usage] = await Promise.all([
      getUserSubscription(session.user.id),
      getUserRemainingUsage(session.user.id),
    ]);

    return NextResponse.json({
      subscription: subscription
        ? {
            planType: subscription.planType,
            billingPeriod: subscription.billingPeriod,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : {
            planType: 'free',
            billingPeriod: null,
            status: 'active',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
      usage,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 },
    );
  }
}
