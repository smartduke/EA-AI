'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { WeatherSnippet } from './weather-snippet';

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

interface Session {
  user: SessionUser;
  expires: string;
}

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
  isHomePage,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  isHomePage: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  // Check if we're on a chat page (has a valid chatId)
  const isChatPage = chatId !== '';

  return (
    <header className="flex sticky top-0 py-1.5 items-start px-2 md:px-2 gap-2 bg-transparent z-10">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="md:px-2 px-2 md:h-fit"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {/* Show visibility selector only on chat pages (not home page or other pages) */}
      {!isReadonly && !isHomePage && isChatPage && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="ml-auto"
        />
      )}

      {/* Show weather snippet only on home page */}
      {isHomePage && (
        <div className="ml-auto">
          <WeatherSnippet />
        </div>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
  if (prevProps.isHomePage !== nextProps.isHomePage) return false;
  return true;
});
