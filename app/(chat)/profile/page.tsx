import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ProfileForm } from '@/components/profile/profile-form';
import { SubscriptionManager } from '@/components/profile/subscription-manager';
import { auth } from '@/lib/supabase/auth';

export const metadata = {
  title: 'Profile - InfoxAI',
  description: 'Manage your profile and subscription settings',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get full user data with metadata from Supabase
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and subscription preferences.
          </p>
        </div>

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
  );
}
