import { useState, useEffect } from 'react';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { UseChatHelpers } from '@ai-sdk/react';

export function useMessages({
  chatId,
  status,
}: {
  chatId: string;
  status: UseChatHelpers['status'];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Removed auto-scroll to bottom on chat load/refresh
  // useEffect(() => {
  //   if (chatId) {
  //     scrollToBottom('instant');
  //     setHasSentMessage(false);
  //   }
  // }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (chatId) {
      setHasSentMessage(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (status === 'submitted') {
      setHasSentMessage(true);
    }
  }, [status]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
