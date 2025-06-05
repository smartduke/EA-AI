'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/utils';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      setEmail(email);

      const siteUrl = getSiteUrl();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            type: 'error',
            description: 'Account already exists!',
          });
        } else {
          toast({
            type: 'error',
            description: error.message,
          });
        }
        return;
      }

      setIsSuccessful(true);
      toast({
        type: 'success',
        description:
          'Account created successfully! Please check your email to verify your account.',
      });

      // Wait a bit for the session to propagate
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use window.location.href for full page reload to refresh server session
      window.location.href = '/';
    } catch (error) {
      toast({
        type: 'error',
        description: 'An error occurred during registration.',
      });
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
