'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ProfileForm } from '@/components/profile/profile-form';
import { SubscriptionManager } from '@/components/profile/subscription-manager';
import { ChatHeader } from '@/components/chat-header';
import type { User } from '@supabase/auth-helpers-nextjs';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/login');
          return;
        }

        if (!session?.user) {
          router.push('/login');
          return;
        }

        // Get full user data
        const {
          data: { user: userData },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !userData) {
          console.error('User data error:', userError);
          router.push('/login');
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-w-0 h-dvh">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh">
      <ChatHeader
        chatId=""
        selectedModelId=""
        selectedVisibilityType="private"
        isReadonly={false}
        session={{ user, expires: '' }}
        isHomePage={false}
      />

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Profile Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Profile Information
            </h2>
            <ProfileForm user={user} profile={user.user_metadata} />
          </div>

          {/* Subscription Management Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Subscription & Usage
            </h2>
            <SubscriptionManager userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
