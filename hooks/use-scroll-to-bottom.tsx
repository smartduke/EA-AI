import useSWR from 'swr';
import { useRef, useEffect, useCallback, useState } from 'react';

type ScrollFlag = ScrollBehavior | false;

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);

  const { data: isAtBottom = false, mutate: setIsAtBottom } = useSWR(
    'messages:is-at-bottom',
    null,
    { fallbackData: false },
  );

  const { data: scrollBehavior = false, mutate: setScrollBehavior } =
    useSWR<ScrollFlag>('messages:should-scroll', null, { fallbackData: false });

  // Clear any cached scroll behavior on mount to prevent auto-scroll on page reload
  useEffect(() => {
    setScrollBehavior(false);
    // Set a longer delay to prevent any initial auto-scroll
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [setScrollBehavior]);

  // Restore manual scroll functionality (for scroll-to-bottom button) - but not during initial mount
  useEffect(() => {
    if (scrollBehavior && !isInitialMount) {
      endRef.current?.scrollIntoView({ behavior: scrollBehavior });
      setScrollBehavior(false);
    } else if (scrollBehavior && isInitialMount) {
      // Clear any scroll behavior that tries to execute during initial mount
      setScrollBehavior(false);
    }
  }, [setScrollBehavior, scrollBehavior, isInitialMount]);

  const scrollToBottom = useCallback(
    (scrollBehavior: ScrollBehavior = 'smooth') => {
      setScrollBehavior(scrollBehavior);
    },
    [setScrollBehavior],
  );

  function onViewportEnter() {
    setIsAtBottom(true);
  }

  function onViewportLeave() {
    setIsAtBottom(false);
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
