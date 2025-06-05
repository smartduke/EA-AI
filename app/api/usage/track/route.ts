import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/auth';
import { incrementUsage } from '@/lib/services/subscription';

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

    // Only track usage for authenticated users (not guests)
    if (!session?.user || session.user.email?.includes('@guest.local')) {
      return NextResponse.json({
        success: true,
        message: 'Guest usage not tracked in database',
      });
    }

    const userId = session.user.id;
    const actionType = searchMode === 'deep-search' ? 'deepSearch' : 'search';

    // Increment usage
    await incrementUsage(userId, actionType);

    return NextResponse.json({
      success: true,
      message: `${actionType} usage tracked successfully`,
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 },
    );
  }
}
