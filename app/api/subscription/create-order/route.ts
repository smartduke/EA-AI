import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import { createOrder } from '@/lib/services/razorpay';
import {
  getPlanPrice,
  type PlanType,
  type BillingPeriod,
} from '@/lib/config/subscription';

export async function POST(request: NextRequest) {
  try {
    const {
      planType,
      billingPeriod,
    }: { planType: PlanType; billingPeriod: BillingPeriod } =
      await request.json();

    console.log('Create order request:', { planType, billingPeriod });

    // Validate request
    if (!planType || !billingPeriod) {
      return NextResponse.json(
        { error: 'Plan type and billing period are required' },
        { status: 400 },
      );
    }

    // Check Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay configuration');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 },
      );
    }

    // Get user from Supabase
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', {
      userId: session.user.id,
      email: session.user.email,
    });

    // Get plan price
    const amount = getPlanPrice(planType, billingPeriod);

    if (amount === 0) {
      return NextResponse.json(
        { error: 'Invalid plan selection' },
        { status: 400 },
      );
    }

    console.log('Creating order with amount:', amount);

    // Create Razorpay order
    const order = await createOrder({
      amount,
      currency: 'USD',
      planType,
      billingPeriod,
      userId: session.user.id,
      userEmail: session.user.email || '',
    });

    console.log('Order created successfully:', {
      orderId: order.id,
      amount: order.amount,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planType,
      billingPeriod,
    });
  } catch (error) {
    console.error('Error creating subscription order:', error);

    // Return more specific error message
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to create order', details: errorMessage },
      { status: 500 },
    );
  }
}
