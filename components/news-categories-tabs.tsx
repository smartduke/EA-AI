'use client';

import { cn } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';

// Define the props for the component
interface NewsCategoryTabsProps {
  onSelectMessageAction: (message: string) => void;
  className?: string;
}

// Define news category type
interface Category {
  id: string;
  label: string;
}

// Define headline type
type HeadlineType = {
  heading: string;
  message: string;
  pubDate: string;
  link: string;
};

// Define news categories
const CATEGORIES: Category[] = [
  { id: 'LOCAL', label: 'Local' },
  { id: 'WORLD', label: 'World' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'TECHNOLOGY', label: 'Technology' },
  { id: 'ENTERTAINMENT', label: 'Entertainment' },
  { id: 'SCIENCE', label: 'Science' },
  { id: 'SPORTS', label: 'Sports' },
  { id: 'HEALTH', label: 'Health' },
];

export function NewsCategoryTabs({
  onSelectMessageAction,
  className,
}: NewsCategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('LOCAL');
  const [headlines, setHeadlines] = useState<Record<string, HeadlineType[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>(() => {
    const loadingState: Record<string, boolean> = {};
    CATEGORIES.forEach((category) => {
      loadingState[category.id] = true;
    });
    return loadingState;
  });

  // Function to fetch headlines for a specific category
  const fetchCategoryHeadlines = useCallback(
    async (category: string) => {
      if (headlines[category]?.length > 0) {
        return; // Already loaded
      }

      setIsLoading((prev) => ({ ...prev, [category]: true }));
      try {
        const baseUrl = window.location.origin;
        const response = await fetch(
          `${baseUrl}/api/news-headlines?category=${category}`,
          {
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (data.headlines?.length > 0) {
          setHeadlines((prev) => ({
            ...prev,
            [category]: data.headlines.slice(0, 6), // Limit to 6 headlines per category
          }));
        }
      } catch (error) {
        console.error(`Error fetching headlines for ${category}:`, error);
      } finally {
        setIsLoading((prev) => ({ ...prev, [category]: false }));
      }
    },
    [headlines],
  );

  // Initial fetch for the first active category
  useEffect(() => {
    fetchCategoryHeadlines(activeCategory);
  }, [activeCategory, fetchCategoryHeadlines]);

  // Load headlines for all categories on mount
  useEffect(() => {
    CATEGORIES.forEach((category) => {
      fetchCategoryHeadlines(category.id);
    });
  }, [fetchCategoryHeadlines]);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center mb-2 gap-2">
        <h3 className="font-semibold text-md">News Headlines</h3>
        {isLoading[activeCategory] && (
          <Loader2 className="size-3 mr-2 animate-spin" />
        )}
      </div>

      {/* Custom tab navigation */}
      <div className="flex overflow-x-auto mb-3 bg-muted p-1 rounded-md w-full">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
              activeCategory === category.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => {
              setActiveCategory(category.id);
              fetchCategoryHeadlines(category.id);
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Content for active category */}
      <div className="mt-1">
        {CATEGORIES.map((category) => (
          <div
            key={category.id}
            className={cn(
              'flex flex-col space-y-1.5',
              activeCategory === category.id ? 'block' : 'hidden',
            )}
          >
            {isLoading[category.id] ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`loading-${category.id}-${i}`}
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
            ) : headlines[category.id]?.length > 0 ? (
              // Loaded headlines
              headlines[category.id].map(
                (headline: HeadlineType, i: number) => (
                  <Button
                    key={`${category.id}-${headline.link}-${i}`}
                    variant="link"
                    className="h-auto p-0 text-left"
                    name={headline.message}
                    onClick={async () => {
                      // Trigger the client callback
                      onSelectMessageAction(headline.message);
                    }}
                    style={{
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: '1.3',
                    }}
                  >
                    <Search
                      size={14}
                      className="mr-1.5 mt-0.5 shrink-0 text-muted-foreground"
                    />
                    {headline.heading}
                  </Button>
                ),
              )
            ) : (
              <div className="text-muted-foreground">
                No headlines available
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
