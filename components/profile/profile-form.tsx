'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  profile?: {
    full_name?: string;
  } | null;
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(
    profile?.full_name || user.user_metadata?.full_name || '',
  );

  const supabase = createClient();

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });

      if (error) throw error;

      toast({
        type: 'success',
        description: 'Profile updated successfully!',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        type: 'error',
        description: error.message || 'Error updating profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFullName(profile?.full_name || user.user_metadata?.full_name || '');
  };

  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email || ''}
            disabled
            className="mt-1 bg-gray-50 dark:bg-gray-800"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Email cannot be changed. Please contact support if needed.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={handleProfileUpdate}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>

        <Button variant="outline" onClick={handleReset} disabled={loading}>
          Reset
        </Button>
      </div>
    </div>
  );
}
