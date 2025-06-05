import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { paymentTransaction } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    // Get user's payment transactions (invoices)
    const transactions = await db
      .select({
        id: paymentTransaction.id,
        razorpayPaymentId: paymentTransaction.razorpayPaymentId,
        razorpayOrderId: paymentTransaction.razorpayOrderId,
        amount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
        status: paymentTransaction.status,
        planType: paymentTransaction.planType,
        billingPeriod: paymentTransaction.billingPeriod,
        createdAt: paymentTransaction.createdAt,
        updatedAt: paymentTransaction.updatedAt,
      })
      .from(paymentTransaction)
      .where(eq(paymentTransaction.userId, userId))
      .orderBy(desc(paymentTransaction.createdAt))
      .limit(limit)
      .offset(offset);

    // Format transactions as invoices
    const invoices = transactions.map((transaction) => ({
      id: transaction.id,
      invoiceNumber:
        transaction.razorpayPaymentId || transaction.razorpayOrderId,
      date: transaction.createdAt,
      amount: Number.parseFloat(transaction.amount) / 100, // Convert from cents to dollars
      currency: transaction.currency,
      status: transaction.status,
      planType: transaction.planType,
      billingPeriod: transaction.billingPeriod,
      description: `${transaction.planType.charAt(0).toUpperCase() + transaction.planType.slice(1)} Plan${
        transaction.billingPeriod ? ` - ${transaction.billingPeriod}` : ''
      }`,
      downloadUrl: null, // Would need to implement invoice PDF generation
    }));

    // Get total count for pagination
    const totalTransactions = await db
      .select({ count: paymentTransaction.id })
      .from(paymentTransaction)
      .where(eq(paymentTransaction.userId, userId));

    return NextResponse.json({
      invoices,
      pagination: {
        total: totalTransactions.length,
        limit,
        offset,
        hasMore: totalTransactions.length > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 },
    );
  }
}
