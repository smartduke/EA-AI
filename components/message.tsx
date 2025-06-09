'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useRef } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { Markdown } from './markdown';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText, generateUUID } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { TabView } from './tab-view';
import type { SearchResult } from './search-results';
import { PipelineLoader } from './pipeline-loader';

// Global state temporarily disabled
/*
// Global state to track which message is currently sticky
let currentStickyMessageId: string | null = null;
const stickyCallbacks = new Map<string, (isSticky: boolean) => void>();
*/

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
  isHomePage,
  onMessageRef,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isHomePage?: boolean;
  onMessageRef?: (messageId: string, element: HTMLDivElement | null) => void;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  // Temporarily disable sticky behavior
  // const [isSticky, setIsSticky] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Sticky behavior temporarily disabled
  /*
  // Simple sticky behavior for user messages
  useEffect(() => {
    if (message.role !== 'user' || isHomePage) return;

    const messageElement = messageRef.current;
    if (!messageElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Message becomes sticky when it goes out of view at the top
        setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {
        threshold: 0,
        rootMargin: '-60px 0px 0px 0px', // 60px offset from top
      }
    );

    observer.observe(messageElement);

    return () => {
      observer.disconnect();
    };
  }, [message.role, message.id, isHomePage]);
  */

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className={cn(
          'w-full mx-auto max-w-3xl [@media(max-width:640px)]:max-w-sm px-4 group/message',
          {
            // Sticky behavior temporarily disabled
            // 'sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50':
            //   message.role === 'user' && isSticky && !isHomePage,
          },
        )}
        ref={message.role === 'user' ? messageRef : undefined}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn('flex gap-4 w-full', {
            'w-full': mode === 'edit',
          })}
        >
          <div
            className={cn('flex flex-col w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          // Sticky behavior temporarily disabled - always use default styling
                          'py-2 rounded-xl text-2xl font-semibold':
                            message.role === 'user',
                          // Commented out sticky styling
                          // 'py-2 rounded-xl text-2xl font-semibold':
                          //   message.role === 'user' &&
                          //   (!isSticky || isHomePage),
                          // // Sticky user message styling - smaller font and compact layout (only on chat pages)
                          // 'py-3 text-lg font-medium':
                          //   message.role === 'user' && isSticky && !isHomePage,
                        })}
                      >
                        {/* Only render the text content directly for user messages */}
                        {message.role === 'user' && (
                          <Markdown>
                            {(() => {
                              const content = sanitizeText(part.text);
                              // Remove the follow-up questions section if it exists
                              const parts = content.split('---');
                              return parts[0].trim();
                            })()}
                          </Markdown>
                        )}
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                }
              }
            })}

            {message.role === 'assistant' && (
              <motion.div
                data-testid="message-content"
                className="flex flex-col gap-4"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  ease: [0.23, 1, 0.32, 1], // Smooth easing
                  opacity: { duration: 0.4 },
                  y: { duration: 0.6 },
                }}
              >
                {(() => {
                  // Extract sources from any webSearch tool calls
                  let sources: SearchResult[] = [];
                  let content = '';
                  let title = '';

                  // Extract title from message content
                  if (message.content) {
                    const titleMatch = message.content.match(/^# (.+)$/m);
                    if (titleMatch?.[1]) {
                      title = titleMatch[1].trim();
                    }
                  }

                  // Get the content from message parts
                  message.parts?.forEach((part) => {
                    if (part.type === 'text') {
                      content = part.text;
                    } else if (
                      part.type === 'tool-invocation' &&
                      (part.toolInvocation?.toolName === 'webSearch' ||
                        part.toolInvocation?.toolName === 'deepWebSearch') &&
                      part.toolInvocation?.state === 'result'
                    ) {
                      const results = part.toolInvocation.result?.results;
                      if (results && Array.isArray(results)) {
                        sources = [...sources, ...results];
                      }
                    }
                  });

                  // Extract follow-up questions
                  const followUpQuestions = (() => {
                    // Look for follow-up questions in message parts
                    const followUpPart = message.parts?.find(
                      (part) =>
                        part.type === 'text' &&
                        'text' in part &&
                        part.text.includes('---'),
                    );

                    if (followUpPart && 'text' in followUpPart) {
                      const parts = followUpPart.text.split('---');
                      if (parts.length > 1) {
                        const questionsText = parts[1].trim();
                        // Extract numbered questions [1] Question text
                        const questions =
                          questionsText.match(/\[\d+\][^\n]+/g) || [];
                        return questions;
                      }
                    }
                    return [];
                  })();

                  const handleQuestionSelect = (question: string) => {
                    // Add the question as a new user message
                    setMessages((currentMessages) => {
                      const newMessages = [
                        ...currentMessages,
                        {
                          id: generateUUID(),
                          role: 'user' as const,
                          content: question,
                          parts: [{ type: 'text' as const, text: question }],
                        } as UIMessage,
                      ];

                      // Update the last assistant message to include the follow-up questions
                      const lastAssistantMessage = newMessages
                        .filter((msg) => msg.role === 'assistant')
                        .pop();

                      if (lastAssistantMessage) {
                        const textPart = lastAssistantMessage.parts?.find(
                          (part) => part.type === 'text' && 'text' in part,
                        );

                        if (textPart && 'text' in textPart) {
                          const parts = textPart.text.split('---');
                          if (parts.length > 1) {
                            // Keep the follow-up questions in the message
                            textPart.text = `${parts[0].trim()}\n\n---\n${parts[1].trim()}`;
                          }
                        }
                      }

                      return newMessages;
                    });
                    reload();
                  };

                  return (
                    <TabView
                      title={title}
                      content={content}
                      sources={sources}
                      isLoading={isLoading}
                      followUpQuestions={followUpQuestions}
                      onSelectQuestion={handleQuestionSelect}
                      chatId={chatId}
                      message={message}
                      vote={vote}
                    />
                  );
                })()}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (prevProps.isHomePage !== nextProps.isHomePage) return false;
    if (prevProps.onMessageRef !== nextProps.onMessageRef) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = ({
  isWebSearch = false,
}: { isWebSearch?: boolean }) => {
  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      exit={{
        y: -5,
        opacity: 0,
        transition: {
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1],
        },
      }}
      data-role="assistant"
    >
      <PipelineLoader isSimpleMode={!isWebSearch} />
    </motion.div>
  );
};
