'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Custom DialogContent without close button
const DialogContentNoClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
      {/* No close button here */}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContentNoClose.displayName = 'DialogContentNoClose';

interface GuestLimitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function GuestLimitDialog({
  isOpen,
  onClose,
  message,
}: GuestLimitDialogProps) {
  const router = useRouter();

  const handleLogin = () => {
    // Just go to login page without returnUrl - user will be redirected to home after login
    router.push('/login');
  };

  const handleCancel = () => {
    // Close dialog and redirect to home page
    onClose();
    router.push('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContentNoClose
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <Lock className="h-12 w-12 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">Search Limit Reached</DialogTitle>
          <DialogDescription className="text-base">
            Please login to continue searching
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center">
          <p className="text-muted-foreground">
            Create an account to unlock more searches.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleLogin}>Login to Continue</Button>
        </DialogFooter>
      </DialogContentNoClose>
    </Dialog>
  );
}
