'use client';

import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NewsHeadlinesProps {
  defaultMessages: Array<{ heading: string; message: string }>;
  onSelectMessageAction: (message: string) => void;
}

export function NewsHeadlines({
  defaultMessages,
  onSelectMessageAction,
}: NewsHeadlinesProps) {
  const [newsHeadlines, setNewsHeadlines] =
    useState<Array<{ heading: string; message: string }>>(defaultMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Use the provided default messages as static content
  useEffect(() => {
    setNewsHeadlines(defaultMessages);
    setIsLoading(false);
  }, [defaultMessages]);

  return (
    <>
      {isLoading
        ? defaultMessages.map((message, index) => (
            <div
              key={`loading-${message.heading}-${index}`}
              className="h-auto p-0 text-base flex items-center"
            >
              <Search
                size={16}
                className="mr-2 text-muted-foreground animate-pulse"
              />
              <div className="animate-pulse flex flex-col space-y-2 w-full">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
              </div>
            </div>
          ))
        : newsHeadlines.map((message, index) => (
            <Button
              key={`headline-${message.heading}-${index}`}
              variant="link"
              className="h-auto p-0 text-left"
              name={message.message}
              onClick={() => onSelectMessageAction(message.message)}
              style={{
                textAlign: 'left',
                fontSize: '0.9rem',
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              <Search size={16} className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
    </>
  );
}
