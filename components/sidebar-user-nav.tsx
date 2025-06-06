'use client';

import {
  ChevronUp,
  User as UserIcon,
  Moon,
  Sun,
  LogIn,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { guestEmailPattern } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from './toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface User {
  id: string;
  email?: string;
  image?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  // Check if user is guest
  const isGuest = guestEmailPattern.test(user.email ?? '');

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          type: 'error',
          description: error.message,
        });
        return;
      }

      // Force a complete page reload to clear all cached state
      window.location.href = '/';
    } catch (error) {
      toast({
        type: 'error',
        description: 'An error occurred while signing out.',
      });
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center justify-between p-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              data-testid="user-nav-button"
              className={cn(
                'h-14 w-full justify-between px-3',
                'bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10',
                'hover:from-blue-500/20 hover:to-purple-500/20 dark:hover:from-blue-400/20 dark:hover:to-purple-400/20',
                'transition-all duration-200',
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 select-none items-center justify-center',
                    'overflow-hidden rounded-full',
                    'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
                    'ring-1 ring-sidebar-foreground/10',
                    'transition-all duration-200',
                  )}
                >
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.email ?? ''}
                      width={32}
                      height={32}
                      className="aspect-square h-full w-full"
                    />
                  ) : (
                    <div
                      className={cn(
                        'flex h-full w-full items-center justify-center',
                        'text-sm font-medium text-sidebar-foreground/70',
                      )}
                    >
                      {isGuest ? 'G' : (user?.email?.charAt(0) ?? '?')}
                    </div>
                  )}
                </div>
                <div className="truncate">
                  {user?.user_metadata?.full_name ? (
                    <>
                      <div className="truncate text-sm font-medium">
                        {user.user_metadata.full_name}
                      </div>
                      <div className="truncate text-xs text-sidebar-foreground/50">
                        {isGuest ? 'Guest' : user.email}
                      </div>
                    </>
                  ) : (
                    <div
                      className="truncate text-sm font-medium"
                      data-testid="user-email"
                    >
                      {isGuest
                        ? 'Guest'
                        : (user?.email ?? 'anonymous@example.com')}
                    </div>
                  )}
                </div>
              </div>
              <ChevronUp
                className={cn(
                  'h-4 w-4 shrink-0 text-sidebar-foreground/50',
                  'transition-transform duration-200',
                  'group-data-[state=open]:rotate-0',
                  'group-data-[state=closed]:rotate-180',
                )}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className={cn(
              'w-[--radix-popper-anchor-width]',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=top]:slide-in-from-bottom-2',
            )}
          >
            {!isGuest && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      'transition-colors duration-200',
                    )}
                  >
                    <UserIcon className="h-4 w-4 text-sidebar-foreground/70" />
                    <span className="font-medium">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-sidebar-accent/50" />
              </>
            )}
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className={cn(
                'cursor-pointer gap-2',
                'transition-colors duration-200',
              )}
              onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-sidebar-foreground/70" />
              ) : (
                <Sun className="h-4 w-4 text-sidebar-foreground/70" />
              )}
              <span className="font-medium">
                {`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-sidebar-accent/50" />
            <DropdownMenuItem
              asChild
              data-testid="user-nav-item-auth"
              className="cursor-pointer"
            >
              <button
                type="button"
                className={cn(
                  'w-full cursor-pointer flex items-center gap-2',
                  'transition-colors duration-200',
                )}
                onClick={isGuest ? handleLogin : handleSignOut}
              >
                {isGuest ? (
                  <>
                    <LogIn className="h-4 w-4 text-sidebar-foreground/70" />
                    <span className="font-medium">Sign in</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 text-sidebar-foreground/70" />
                    <span className="font-medium">Sign out</span>
                  </>
                )}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
