'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { SubmitButton } from '@/components/submit-button';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSiteUrl } from '@/lib/utils';
import Form from 'next/form';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const email = formData.get('email') as string;

      setEmail(email);

      const siteUrl = getSiteUrl();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        toast({
          type: 'error',
          description: error.message,
        });
        return;
      }

      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Password reset link sent! Check your email.',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'An error occurred while sending the reset link.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccessful) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
            <div className="size-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg
                className="size-6 text-green-600 dark:text-green-400"
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
              Check Your Email
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to reset your password.
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Didn&apos;t receive an email? Check your spam folder or try again.
            </p>
          </div>
          <div className="px-4 sm:px-16">
            <Link
              href="/login"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center"
            >
              Back to Sign In
            </Link>
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
            Forgot Password
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
        </div>
        <Form
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 sm:px-16"
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              className="bg-muted text-md md:text-sm"
              type="email"
              placeholder="user@acme.com"
              autoComplete="email"
              required
              autoFocus
              defaultValue={email}
            />
          </div>

          <SubmitButton isSuccessful={isSuccessful}>
            Send Reset Link
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
