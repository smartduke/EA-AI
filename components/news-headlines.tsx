'use client';

import { Button } from '@/components/ui/button';
import { getNewsHeadlines } from '@/lib/utils/get-news-headings';
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
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  async function fetchHeadlines() {
    try {
      setIsLoading(true);
      const headlines = await getNewsHeadlines();
      setNewsHeadlines(headlines);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching news headlines:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Fetch headlines when component mounts
    fetchHeadlines();

    // Refresh headlines every 30 minutes
    const refreshInterval = 30 * 60 * 1000; // 30 minutes
    const intervalId = setInterval(() => {
      fetchHeadlines();
    }, refreshInterval);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {isLoading
        ? defaultMessages.map((message, index) => (
            <div key={index} className="h-auto p-0 text-base flex items-center">
              <Search
                size={16}
                className="mr-2 text-muted-foreground animate-pulse"
              />
              <div className="animate-pulse flex flex-col space-y-2 w-full">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
              </div>
            </div>
          ))
        : newsHeadlines.map((message, index) => (
            <Button
              key={index}
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
