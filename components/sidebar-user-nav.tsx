'use client';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { guestEmailPattern } from '@/lib/constants';

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
import { toast } from './toast';
import { LoaderIcon } from './icons';

interface User {
  id: string;
  email?: string;
  image?: string;
}

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const supabase = createSupabaseBrowserClient();

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
      router.refresh();
      router.push('/');
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
              className="h-12 w-full justify-between px-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-background/10">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.email ?? ''}
                      width={24}
                      height={24}
                      className="aspect-square h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs uppercase text-muted-foreground">
                      {isGuest ? 'G' : (user?.email?.charAt(0) ?? '?')}
                    </div>
                  )}
                </div>
                <div className="truncate text-sm" data-testid="user-email">
                  {isGuest ? 'Guest' : (user?.email ?? 'anonymous@example.com')}
                </div>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 rotate-180" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={isGuest ? handleLogin : handleSignOut}
              >
                {isGuest ? 'Login to your account' : 'Sign out'}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
