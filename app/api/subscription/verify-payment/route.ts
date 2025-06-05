import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import { verifyPaymentSignature, getOrder } from '@/lib/services/razorpay';
import {
  createOrUpdateSubscription,
  createPaymentTransaction,
  resetUserUsage,
} from '@/lib/services/subscription';
import type { PlanType, BillingPeriod } from '@/lib/config/subscription';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    // Validate request
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment parameters' },
        { status: 400 },
      );
    }

    // Get user from Supabase
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 },
      );
    }

    // Get order details to extract plan information
    const order = await getOrder(razorpay_order_id);
    const planType = order.notes?.planType as PlanType;
    const billingPeriod = order.notes?.billingPeriod as BillingPeriod;

    if (!planType || !billingPeriod) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 },
      );
    }

    // Create payment transaction record
    await createPaymentTransaction({
      userId: session.user.id,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      amount: Number(order.amount) / 100, // Convert from smallest currency unit
      currency: order.currency,
      status: 'completed',
      planType,
      billingPeriod,
      metadata: {
        order,
        verifiedAt: new Date().toISOString(),
      },
    });

    // Calculate subscription period
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();

    if (billingPeriod === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Update user subscription
    await createOrUpdateSubscription({
      userId: session.user.id,
      planType,
      billingPeriod,
      currentPeriodStart,
      currentPeriodEnd,
    });

    // Reset user usage when upgrading (gives them a fresh start)
    try {
      await resetUserUsage(session.user.id);
      console.log(
        `Usage reset for user ${session.user.id} after subscription upgrade`,
      );
    } catch (resetError) {
      console.error('Failed to reset user usage after upgrade:', resetError);
      // Don't fail the entire process if usage reset fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription updated',
      subscription: {
        planType,
        billingPeriod,
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 },
    );
  }
}
