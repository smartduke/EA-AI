'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useLocalStorage } from 'usehooks-ts';
import type { SearchMode } from './search-mode-selector';
import { UsageLimitDialog } from '@/components/ui/usage-limit-dialog';
import { GuestLimitDialog } from '@/components/ui/guest-limit-dialog';
import { cn } from '@/lib/utils';

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

// State for usage limit dialog
interface UsageLimitState {
  isOpen: boolean;
  userType: 'guest' | 'free' | 'pro';
  limitType: 'search' | 'deep-search';
  message: string;
  requiresLogin: boolean;
  requiresUpgrade: boolean;
  requiresContact: boolean;
}

// Guest dialog state (separate for simplicity)
interface GuestLimitState {
  isOpen: boolean;
  message: string;
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  // Search mode state management
  const [selectedSearchMode] = useLocalStorage<SearchMode>(
    'search-mode',
    'search',
  );

  // Usage limit dialog state
  const [usageLimitState, setUsageLimitState] = useState<UsageLimitState>({
    isOpen: false,
    userType: 'guest',
    limitType: 'search',
    message: '',
    requiresLogin: false,
    requiresUpgrade: false,
    requiresContact: false,
  });

  // Guest dialog state (separate for simplicity)
  const [guestLimitState, setGuestLimitState] = useState<GuestLimitState>({
    isOpen: false,
    message: '',
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: visibilityType,
      selectedSearchMode: selectedSearchMode,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.log('Chat error received:', error.message);
      console.log('Full error object:', error);

      // Function to try parsing JSON from various formats
      const tryParseErrorResponse = (errorMessage: string) => {
        const parseAttempts = [
          // Direct JSON parse
          () => JSON.parse(errorMessage),
          // Parse after '403: ' prefix
          () => {
            if (errorMessage.includes('403: ')) {
              const jsonPart = errorMessage.split('403: ')[1];
              return JSON.parse(jsonPart);
            }
            throw new Error('No 403 prefix found');
          },
          // Parse after any status code pattern
          () => {
            const match = errorMessage.match(/\d{3}: (.+)/);
            if (match) {
              return JSON.parse(match[1]);
            }
            throw new Error('No status code pattern found');
          },
          // Try to extract JSON from anywhere in the string
          () => {
            const jsonMatch = errorMessage.match(/\{.*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in string');
          },
        ];

        for (const attempt of parseAttempts) {
          try {
            const result = attempt();
            console.log('Successfully parsed error response:', result);
            return result;
          } catch (parseError) {
            // Continue to next attempt
          }
        }
        return null;
      };

      // Check if this is a usage limit error (403 status or contains limit language)
      const isUsageLimitError =
        error.message.includes('403') ||
        error.message.includes('daily limit') ||
        error.message.includes('requiresUpgrade') ||
        error.message.includes('requiresLogin');

      if (isUsageLimitError) {
        const response = tryParseErrorResponse(error.message);

        if (
          response?.error &&
          (response.requiresLogin ||
            response.requiresUpgrade ||
            response.requiresContact)
        ) {
          console.log('Showing usage limit dialog for:', response);

          // Use guest dialog for guest users
          if (response.requiresLogin || response.userType === 'guest') {
            setGuestLimitState({
              isOpen: true,
              message: response.error,
            });
          } else {
            // Use regular dialog for authenticated users
            setUsageLimitState({
              isOpen: true,
              userType: response?.userType || 'free',
              limitType: selectedSearchMode,
              message: response.error,
              requiresLogin: false,
              requiresUpgrade: response?.requiresUpgrade || false,
              requiresContact: response?.requiresContact || false,
            });
          }
          return; // Don't show the regular toast
        }

        // Fallback handling for specific error patterns if JSON parsing fails
        if (
          error.message.includes('Deep search is not available for guest users')
        ) {
          setGuestLimitState({
            isOpen: true,
            message:
              'Deep search is not available for guest users. Please login to access this feature.',
          });
          return;
        }

        if (error.message.includes('daily limit')) {
          // Try to determine user type based on session
          const isGuest =
            session?.user?.email?.includes('@guest.local') || false;
          const userType = isGuest ? 'guest' : 'free';

          const message = error.message.includes('deep search')
            ? `You have reached your daily limit of deep searches. ${userType === 'guest' ? 'Please login to access more searches.' : 'Upgrade to Pro for higher limits.'}`
            : `You have reached your daily limit of searches. ${userType === 'guest' ? 'Please login to access more searches.' : 'Upgrade to Pro for higher limits.'}`;

          if (userType === 'guest') {
            setGuestLimitState({
              isOpen: true,
              message: message,
            });
          } else {
            setUsageLimitState({
              isOpen: true,
              userType: userType,
              limitType: selectedSearchMode,
              message: message,
              requiresLogin: false,
              requiresUpgrade: userType === 'free',
              requiresContact: false,
            });
          }
          return;
        }
      }

      // Default error handling
      toast({
        type: 'error',
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (autoResume) {
      experimental_resume();
    }

    // note: this hook has no dependencies since it only needs to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const selectedArtifact = useArtifactSelector((state) => state);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const {
    data: votes,
    mutate: mutateVotes,
    isLoading: isVotesLoading,
  } = useSWR<Array<Vote>>(
    session?.user ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  // Check if this is the home page (no messages)
  const isHomePage = messages.length === 0;

  // Handler for quick prompt selection
  const handlePromptSelect = (prompt: string) => {
    // Directly submit the prompt without setting input
    append({
      role: 'user',
      content: prompt,
    });
  };

  return (
    <>
      <div className={cn('flex flex-col min-w-0 h-dvh')}>
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
          isHomePage={isHomePage}
        />

        {/* Conditional layout based on whether we're on home page or chat page */}
        {isHomePage ? (
          /* Home page: Center everything vertically */
          <div className="flex flex-col justify-center items-center flex-1 px-4 gap-4">
            <Messages
              chatId={id}
              status={status}
              votes={votes}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
              onPromptSelect={!isReadonly ? handlePromptSelect : undefined}
            />

            {!isReadonly && (
              <div className="w-full md:max-w-3xl">
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  append={append}
                  selectedVisibilityType={visibilityType}
                  session={session}
                  selectedModelId={initialChatModel}
                />
              </div>
            )}
          </div>
        ) : (
          /* Chat page: Original layout */
          <>
            <Messages
              chatId={id}
              status={status}
              votes={votes}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
              onPromptSelect={!isReadonly ? handlePromptSelect : undefined}
            />

            <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
              {!isReadonly && (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  append={append}
                  selectedVisibilityType={visibilityType}
                  session={session}
                  selectedModelId={initialChatModel}
                />
              )}
            </form>
          </>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
        session={session}
        selectedModelId={initialChatModel}
      />

      {/* Guest Limit Dialog (Simple, no redirects) */}
      <GuestLimitDialog
        isOpen={guestLimitState.isOpen}
        onClose={() => setGuestLimitState({ isOpen: false, message: '' })}
        message={guestLimitState.message}
      />

      {/* Usage Limit Dialog for Authenticated Users */}
      <UsageLimitDialog
        isOpen={usageLimitState.isOpen}
        onClose={() =>
          setUsageLimitState((prev) => ({ ...prev, isOpen: false }))
        }
        userType={usageLimitState.userType}
        limitType={usageLimitState.limitType}
        message={usageLimitState.message}
        requiresLogin={usageLimitState.requiresLogin}
        requiresUpgrade={usageLimitState.requiresUpgrade}
        requiresContact={usageLimitState.requiresContact}
      />
    </>
  );
}
