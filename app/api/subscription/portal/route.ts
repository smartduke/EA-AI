import { NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import { getUserSubscription } from '@/lib/services/subscription';

export async function GET() {
  try {
    // Get user from Supabase
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's current subscription
    const subscription = await getUserSubscription(userId);

    if (!subscription || subscription.planType === 'free') {
      return NextResponse.json(
        { error: 'No paid subscription found' },
        { status: 404 },
      );
    }

    // For Razorpay, we'll redirect to their dashboard
    // In a production app, you might want to create a custom billing portal
    // or use Razorpay's customer portal if available
    const portalUrl = subscription.razorpayCustomerId
      ? `https://dashboard.razorpay.com/app/customers/${subscription.razorpayCustomerId}`
      : 'https://dashboard.razorpay.com/app/customers';

    return NextResponse.json({
      portalUrl,
      customerId: subscription.razorpayCustomerId,
      subscriptionId: subscription.razorpaySubscriptionId,
    });
  } catch (error) {
    console.error('Error accessing billing portal:', error);
    return NextResponse.json(
      { error: 'Failed to access billing portal' },
      { status: 500 },
    );
  }
}
