import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import {
  canUserPerformAction,
  getUserRemainingUsage,
  getUserSubscription,
} from '@/lib/services/subscription';
import { getPlanLimits } from '@/lib/config/subscription';

// Guest user limits (hardcoded as per requirements)
const GUEST_LIMITS = {
  searchesPerDay: 1,
  deepSearchesPerDay: 0,
};

export async function POST(request: NextRequest) {
  try {
    const { searchMode }: { searchMode: 'search' | 'deep-search' } =
      await request.json();

    if (!searchMode || !['search', 'deep-search'].includes(searchMode)) {
      return NextResponse.json(
        { error: 'Valid search mode is required' },
        { status: 400 },
      );
    }

    const session = await auth();

    // Handle guest users
    if (!session?.user || session.user.email?.includes('@guest.local')) {
      const actionType = searchMode === 'deep-search' ? 'deepSearch' : 'search';

      if (actionType === 'deepSearch') {
        return NextResponse.json({
          canPerform: false,
          reason: 'guest_deep_search_not_allowed',
          message:
            'Deep search is not available for guest users. Please login to access this feature.',
          requiresLogin: true,
          userType: 'guest',
          limits: GUEST_LIMITS,
          usage: {
            searches: { used: 0, limit: 1, remaining: 1 },
            deepSearches: { used: 0, limit: 0, remaining: 0 },
          },
        });
      }

      // For regular search, guest users get 1 search
      // We can't track guest usage in DB since they don't have persistent IDs
      // So we'll return that they can perform action and let the UI handle session-based tracking
      return NextResponse.json({
        canPerform: true,
        userType: 'guest',
        limits: GUEST_LIMITS,
        message: 'Guest users can perform 1 search. Login for more searches.',
        usage: {
          searches: { used: 0, limit: 1, remaining: 1 },
          deepSearches: { used: 0, limit: 0, remaining: 0 },
        },
      });
    }

    // Handle authenticated users
    const userId = session.user.id;
    const actionType = searchMode === 'deep-search' ? 'deepSearch' : 'search';

    // Check if user can perform the action
    const canPerform = await canUserPerformAction(userId, actionType);

    // Get user's subscription and remaining usage
    const subscription = await getUserSubscription(userId);
    const planType = subscription?.planType || 'free';
    const remainingUsage = await getUserRemainingUsage(userId);
    const limits = getPlanLimits(planType);

    const userType = planType === 'pro' ? 'pro' : 'free';

    if (!canPerform) {
      const usageType =
        actionType === 'deepSearch' ? 'deepSearches' : 'searches';
      return NextResponse.json({
        canPerform: false,
        reason: 'limit_exceeded',
        message: `You have reached your daily limit of ${limits[usageType === 'searches' ? 'searchesPerDay' : 'deepSearchesPerDay']} ${usageType === 'searches' ? 'searches' : 'deep searches'}. ${userType === 'free' ? 'Upgrade to Pro for higher limits.' : 'Your limits will reset tomorrow.'}`,
        requiresUpgrade: userType === 'free',
        userType,
        limits,
        usage: remainingUsage,
      });
    }

    return NextResponse.json({
      canPerform: true,
      userType,
      limits,
      usage: remainingUsage,
    });
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return NextResponse.json(
      { error: 'Failed to check usage limits' },
      { status: 500 },
    );
  }
}
