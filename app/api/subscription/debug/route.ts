import { NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      NEXT_PUBLIC_RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

      // Subscription config
      FREE_PLAN_SEARCHES_PER_DAY:
        process.env.FREE_PLAN_SEARCHES_PER_DAY || '10',
      FREE_PLAN_DEEP_SEARCHES_PER_DAY:
        process.env.FREE_PLAN_DEEP_SEARCHES_PER_DAY || '2',
      PRO_PLAN_SEARCHES_PER_DAY: process.env.PRO_PLAN_SEARCHES_PER_DAY || '100',
      PRO_PLAN_DEEP_SEARCHES_PER_DAY:
        process.env.PRO_PLAN_DEEP_SEARCHES_PER_DAY || '20',
      PRO_PLAN_MONTHLY_PRICE: process.env.PRO_PLAN_MONTHLY_PRICE || '2000',
      PRO_PLAN_YEARLY_PRICE: process.env.PRO_PLAN_YEARLY_PRICE || '19200',
    };

    // Client-side env vars (only show partial for security)
    const clientEnvCheck = {
      NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        ? `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.slice(0, 8)}...`
        : 'NOT_SET',
    };

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      environmentVariables: envCheck,
      clientEnvironmentVariables: clientEnvCheck,
      missingRequired: Object.entries(envCheck)
        .filter(
          ([key, value]) =>
            [
              'POSTGRES_URL',
              'RAZORPAY_KEY_ID',
              'RAZORPAY_KEY_SECRET',
              'NEXT_PUBLIC_RAZORPAY_KEY_ID',
            ].includes(key) && !value,
        )
        .map(([key]) => key),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Debug check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
