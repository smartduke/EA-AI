import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo, useState, useEffect } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { ResearchPipeline } from './research-pipeline';

interface ResearchPhase {
  id: string;
  status: 'pending' | 'active' | 'completed';
  title: string;
  queries?: string[];
  sources?: Array<{
    name: string;
    domain: string;
    url: string;
  }>;
}

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  onPromptSelect?: (prompt: string) => void;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  onPromptSelect,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  // Research pipeline state
  const [researchPhases, setResearchPhases] = useState<ResearchPhase[]>([]);
  const [showResearchPipeline, setShowResearchPipeline] = useState(false);

  // Listen for research pipeline updates from data stream
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `research-pipeline-${chatId}`) {
        try {
          const data = JSON.parse(e.newValue || '{}');
          if (data.type === 'research-pipeline') {
            setResearchPhases(data.data.phases);
            setShowResearchPipeline(true);
          } else if (data.type === 'research-pipeline-update') {
            setResearchPhases((prev) =>
              prev.map((phase) =>
                phase.id === data.data.phaseId
                  ? { ...phase, ...data.data }
                  : phase,
              ),
            );
          }
        } catch (error) {
          console.error('Error parsing research pipeline data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [chatId]);

  // Hide research pipeline when response is complete
  useEffect(() => {
    if (status === 'ready' && showResearchPipeline) {
      // Hide pipeline after a delay
      setTimeout(() => setShowResearchPipeline(false), 3000);
    }
  }, [status, showResearchPipeline]);

  // Simple, clean loading logic
  const isLoading = status === 'submitted' || status === 'streaming';
  const isHomePage = messages.length === 0;

  // Filter out incomplete assistant messages during loading
  const displayMessages = isLoading
    ? messages.filter((msg) => {
        if (msg.role !== 'assistant') return true;

        // Only show assistant messages that have substantial content
        const textPart = msg.parts?.find((part) => part.type === 'text');
        const hasSubstantialText =
          textPart && 'text' in textPart && textPart.text.trim().length > 30; // Reduced threshold for smoother transition

        return hasSubstantialText;
      })
    : messages;

  // Show ThinkingMessage only when loading AND no substantial assistant content is displayed
  const shouldShowThinking =
    isLoading &&
    (displayMessages.length === 0 ||
      displayMessages[displayMessages.length - 1]?.role !== 'assistant');

  // Check if the last message has a web search
  const hasWebSearch = messages[messages.length - 1]?.parts?.some(
    (part) =>
      part.type === 'tool-invocation' &&
      (part.toolInvocation?.toolName === 'webSearch' ||
        part.toolInvocation?.toolName === 'deepWebSearch'),
  );

  return (
    <div
      ref={messagesContainerRef}
      className={`flex flex-col min-w-0 gap-3 relative -mt-10 ${
        isHomePage
          ? 'pt-4' // Home page: just basic spacing
          : 'flex-1 overflow-y-scroll pt-4' // Chat page: original layout
      }`}
      suppressHydrationWarning
    >
      {displayMessages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={false} // Never pass loading to individual messages
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === displayMessages.length - 1
          }
          isHomePage={isHomePage}
          onMessageRef={() => {}}
        />
      ))}

      {/* Research Pipeline for Deep Search */}
      <ResearchPipeline
        isVisible={showResearchPipeline}
        phases={researchPhases}
      />

      {shouldShowThinking && (
        <AnimatePresence>
          <ThinkingMessage isWebSearch={hasWebSearch} />
        </AnimatePresence>
      )}

      <motion.div
        ref={messagesEndRef}
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
