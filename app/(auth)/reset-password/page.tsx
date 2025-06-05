'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { toast } from '@/components/toast';
import { SubmitButton } from '@/components/submit-button';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Form from 'next/form';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      const supabase = createClient();
      let attempts = 0;
      const maxAttempts = 3;
      const retryDelay = 1000; // 1 second

      const attemptAuth = async (): Promise<boolean> => {
        try {
          attempts++;
          console.log(`Authentication attempt ${attempts}/${maxAttempts}`);

          // Check if we have a code parameter in the URL
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');

          console.log('Reset password URL code:', code);

          if (code) {
            console.log('Code found, exchanging for session...');

            // Exchange the code for a session
            const { data, error } =
              await supabase.auth.exchangeCodeForSession(code);

            if (error) {
              console.error(
                `Code exchange error (attempt ${attempts}):`,
                error,
              );
              if (attempts < maxAttempts) {
                console.log(`Retrying in ${retryDelay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                return await attemptAuth();
              }
              throw new Error(
                `Failed to exchange code after ${maxAttempts} attempts: ${error.message}`,
              );
            }

            if (data.session?.user) {
              console.log(
                'Successfully authenticated user:',
                data.session.user.email,
              );
              setIsValidToken(true);

              // Clear the code from URL to prevent reuse
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('code');
              window.history.replaceState({}, '', newUrl.pathname);
              return true;
            } else {
              if (attempts < maxAttempts) {
                console.log('No session returned, retrying...');
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                return await attemptAuth();
              }
              throw new Error('No session returned after code exchange');
            }
          } else {
            // No code parameter, check if user is already authenticated
            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

            if (error) {
              console.error('Session check error:', error);
              throw error;
            }

            if (session?.user) {
              console.log('User already authenticated:', session.user.email);
              setIsValidToken(true);
              return true;
            } else {
              if (attempts < maxAttempts) {
                console.log('No session found, retrying...');
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                return await attemptAuth();
              }
              throw new Error('No code parameter and no existing session');
            }
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            console.log(`Auth attempt ${attempts} failed, retrying...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return await attemptAuth();
          }
          throw error;
        }
      };

      try {
        // Small initial delay to let Supabase initialize
        await new Promise((resolve) => setTimeout(resolve, 500));
        await attemptAuth();
      } catch (error) {
        console.error(
          'Password reset authentication failed after all attempts:',
          error,
        );
        toast({
          type: 'error',
          description:
            'Invalid or expired reset link. Please request a new one.',
        });
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Also listen for auth state changes as a backup
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        session?.user &&
        !isValidToken
      ) {
        console.log('Auth state change detected, setting valid token');
        setIsValidToken(true);
        setIsLoading(false);
      }
    });

    handlePasswordReset();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [isValidToken]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const supabase = createClient();
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Validate passwords match
      if (password !== confirmPassword) {
        toast({
          type: 'error',
          description: 'Passwords do not match.',
        });
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        toast({
          type: 'error',
          description: 'Password must be at least 6 characters long.',
        });
        return;
      }

      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Error updating password:', error);
        toast({
          type: 'error',
          description: error.message,
        });
        return;
      }

      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Password updated successfully!',
      });

      // Redirect to login after success
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        type: 'error',
        description: 'An error occurred while updating your password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Verifying reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold dark:text-zinc-50">
              Invalid Reset Link
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>
          <div className="px-4 sm:px-16 flex flex-col gap-2">
            <Link
              href="/forgot-password"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center"
            >
              Request New Reset Link
            </Link>
            <Link
              href="/login"
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccessful) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold dark:text-zinc-50">
              Password Updated
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Your password has been successfully updated. You can now sign in
              with your new password.
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Redirecting to sign in page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Reset Password
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your new password below
          </p>
        </div>
        <Form
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 sm:px-16"
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              New Password
            </Label>
            <Input
              id="password"
              name="password"
              className="bg-muted text-md md:text-sm"
              type="password"
              placeholder="Enter new password"
              autoComplete="new-password"
              required
              autoFocus
              minLength={6}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="confirmPassword"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              className="bg-muted text-md md:text-sm"
              type="password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <SubmitButton isSuccessful={isSuccessful}>
            Update Password
          </SubmitButton>

          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
          <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
            <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Loading...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
