'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { LayoutGrid } from 'lucide-react';
import { entitlementsByUserType, type UserType } from '@/lib/ai/entitlements';
import { guestEmailPattern } from '@/lib/constants';

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

export function ModelSelector({
  session,
  selectedModelId,
  className,
  compact = false,
}: {
  session: Session;
  selectedModelId: string;
  compact?: boolean;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  // Determine user type based on email pattern (guest emails contain @guest.local)
  const userType: UserType = guestEmailPattern.test(session.user.email ?? '')
    ? 'guest'
    : 'regular';
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'md:px-2 md:h-fit max-w-fit border-dashed justify-start items-center gap-2 md:justify-center font-medium',
            className,
          )}
        >
          <div className="text-xs text-muted-foreground">Model</div>

          {compact ? (
            <LayoutGrid size={16} />
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium">
                {selectedChatModel?.name}
              </div>
              <ChevronDownIcon />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {availableChatModels.map((chatModel) => (
          <DropdownMenuItem
            key={chatModel.id}
            onSelect={() => {
              setOptimisticModelId(chatModel.id);

              startTransition(() => {
                saveChatModelAsCookie(chatModel.id);
              });
            }}
            className="gap-4 group/item"
            data-active={chatModel.id === optimisticModelId}
          >
            <div className="flex flex-col gap-1 items-start">
              <div className="font-medium">{chatModel.name}</div>
              {chatModel.description && (
                <div className="text-xs text-muted-foreground">
                  {chatModel.description}
                </div>
              )}
            </div>
            <div className="ml-auto opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
