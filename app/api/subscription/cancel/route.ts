import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import { cancelSubscription as cancelRazorpaySubscription } from '@/lib/services/razorpay';
import {
  cancelSubscription,
  getUserSubscription,
} from '@/lib/services/subscription';

export async function POST(request: NextRequest) {
  try {
    const { cancelAtPeriodEnd = true } = await request.json();

    // Get user from Supabase
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's current subscription from database
    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 },
      );
    }

    if (subscription.planType === 'free') {
      return NextResponse.json(
        { error: 'Cannot cancel free plan' },
        { status: 400 },
      );
    }

    // Cancel subscription with Razorpay if we have subscription ID
    let razorpayResult = null;
    if (subscription.razorpaySubscriptionId) {
      try {
        razorpayResult = await cancelRazorpaySubscription(
          subscription.razorpaySubscriptionId,
          cancelAtPeriodEnd,
        );
      } catch (error) {
        console.error('Razorpay cancellation error:', error);
        // Continue with local cancellation even if Razorpay fails
      }
    }

    // Update subscription status in database
    const updatedSubscription = await cancelSubscription(
      userId,
      cancelAtPeriodEnd,
    );

    return NextResponse.json({
      success: true,
      message: cancelAtPeriodEnd
        ? 'Subscription will be cancelled at the end of the current billing period'
        : 'Subscription cancelled immediately',
      subscription: updatedSubscription,
      razorpayResult,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 },
    );
  }
}
