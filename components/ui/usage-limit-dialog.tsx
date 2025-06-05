'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UsageLimitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'guest' | 'free' | 'pro';
  limitType: 'search' | 'deep-search';
  message: string;
  requiresLogin?: boolean;
  requiresUpgrade?: boolean;
  requiresContact?: boolean;
  onActionClick?: () => void;
}

export function UsageLimitDialog({
  isOpen,
  onClose,
  userType,
  limitType,
  message,
  requiresLogin = false,
  requiresUpgrade = false,
  requiresContact = false,
  onActionClick,
}: UsageLimitDialogProps) {
  const router = useRouter();

  const handleAction = () => {
    // Call onActionClick first to set the flag
    if (onActionClick) {
      onActionClick();
    }

    if (requiresLogin) {
      // Include current path as return URL so user comes back here after login
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
      // Close the dialog after a short delay to allow navigation to complete
      setTimeout(() => {
        onClose();
      }, 100);
    } else if (requiresUpgrade) {
      router.push('/subscription');
      // Close the dialog after a short delay to allow navigation to complete
      setTimeout(() => {
        onClose();
      }, 100);
    } else if (requiresContact) {
      // Open email client or contact page
      window.location.href =
        'mailto:support@infoxai.com?subject=Increase Usage Limits&body=I would like to discuss increasing my usage limits for my Pro subscription.';
      // Don't call onClose() immediately - let the parent handle it
      // The onActionClick() call above sets the flag to prevent home redirect

      // Close the dialog after a short delay to allow email client to open
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  const getIcon = () => {
    if (userType === 'guest' || requiresLogin) {
      return <Lock className="h-12 w-12 text-amber-500" />;
    }
    if (requiresUpgrade) {
      return <Crown className="h-12 w-12 text-amber-500" />;
    }
    if (requiresContact) {
      return <Crown className="h-12 w-12 text-blue-500" />;
    }
    return <Lock className="h-12 w-12 text-gray-500" />;
  };

  const getTitle = () => {
    if (userType === 'guest' || requiresLogin) {
      return 'Login Required';
    }
    if (requiresUpgrade) {
      return 'Upgrade to Pro';
    }
    if (requiresContact) {
      return 'Contact Us for More Usage';
    }
    return 'Limit Reached';
  };

  const getActionText = () => {
    if (requiresLogin) {
      return 'Login to Continue';
    }
    if (requiresUpgrade) {
      return 'Upgrade to Pro';
    }
    if (requiresContact) {
      return 'Contact Us';
    }
    return 'OK';
  };

  const getLimitInfo = () => {
    if (userType === 'guest') {
      return {
        current: 'Guest',
        searches: '1 search',
        deepSearches: '0 deep searches',
      };
    }
    if (userType === 'free') {
      return {
        current: 'Free',
        searches: '10 searches',
        deepSearches: '2 deep searches',
      };
    }
    return {
      current: 'Pro',
      searches: '100 searches',
      deepSearches: '20 deep searches',
    };
  };

  const limitInfo = getLimitInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">{getIcon()}</div>
          <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
          <DialogDescription className="text-base">{message}</DialogDescription>
        </DialogHeader>

        {/* Show plan details only for non-guest users */}
        {userType !== 'guest' && (
          <div className="space-y-4">
            {/* Current Plan Info */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Plan:</span>
                <Badge
                  variant={userType === 'pro' ? 'default' : 'secondary'}
                  className={
                    userType === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''
                  }
                >
                  {limitInfo.current}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• {limitInfo.searches} per day</div>
                <div>• {limitInfo.deepSearches} per day</div>
              </div>
            </div>

            {/* Upgrade Benefits (only for free users) */}
            {userType === 'free' && (
              <div className="rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    Pro Plan Benefits:
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• 100 searches per day</div>
                  <div>• 20 deep searches per day</div>
                  <div>• Priority support</div>
                  <div>• Advanced features</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simple message for guest users */}
        {userType === 'guest' && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Create an account to unlock more searches and features.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              // Use window.location.href for reliable navigation in production
              setTimeout(() => {
                window.location.href = '/';
              }, 50);
            }}
          >
            Cancel
          </Button>
          {(requiresLogin || requiresUpgrade || requiresContact) && (
            <Button onClick={handleAction}>{getActionText()}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
