'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
      secondary:
        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
      destructive: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      outline:
        'border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';

export { Badge };
