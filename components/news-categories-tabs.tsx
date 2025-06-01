'use client';

import { cn } from '@/lib/utils';
import {
  Loader2,
  MapPin,
  Globe,
  Briefcase,
  Smartphone,
  Clapperboard,
  Atom,
  Trophy,
  Heart,
  Search,
} from 'lucide-react';
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
  icon: React.ComponentType<{ className?: string }>;
}

// Define headline type
type HeadlineType = {
  heading: string;
  message: string;
  pubDate: string;
  link: string;
};

// Define news categories with icons
const CATEGORIES: Category[] = [
  { id: 'LOCAL', label: 'Local', icon: MapPin },
  { id: 'WORLD', label: 'World', icon: Globe },
  { id: 'BUSINESS', label: 'Business', icon: Briefcase },
  { id: 'TECHNOLOGY', label: 'Technology', icon: Smartphone },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: Clapperboard },
  { id: 'SCIENCE', label: 'Science', icon: Atom },
  { id: 'SPORTS', label: 'Sports', icon: Trophy },
  { id: 'HEALTH', label: 'Health', icon: Heart },
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
      {/* Horizontal scroll tabs with hidden scrollbar and scroll indicators */}
      <div className="relative mb-6">
        {/* Gradient fade indicator at the right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none z-10" />

        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max pr-8">
            {CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <Button
                  key={category.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-md border-0'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md',
                  )}
                  onClick={() => {
                    setActiveCategory(category.id);
                    fetchCategoryHeadlines(category.id);
                  }}
                >
                  <IconComponent className="size-4" />
                  <span className="font-medium">{category.label}</span>
                  {isLoading[category.id] && isActive && (
                    <Loader2 className="size-3 animate-spin ml-1" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Premium headlines section */}
      <div className="relative min-h-[300px]">
        {CATEGORIES.map((category) => (
          <div
            key={category.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-200',
              activeCategory === category.id
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none',
            )}
          >
            {isLoading[category.id] ? (
              // Premium Loading State
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`loading-${category.id}-${i}`}
                    className="py-3 px-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50"
                  >
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-3/4" />
                  </div>
                ))}
              </div>
            ) : headlines[category.id]?.length > 0 ? (
              // Premium headlines
              <div className="space-y-0">
                {headlines[category.id].map(
                  (headline: HeadlineType, i: number) => (
                    <button
                      key={`${category.id}-${headline.link}-${i}`}
                      type="button"
                      className="w-full text-left py-2 px-3 text-sm text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/60 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group"
                      onClick={async () => {
                        onSelectMessageAction(headline.message);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Search className="size-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="font-medium leading-relaxed group-hover:text-blue-700 dark:group-hover:text-blue-300 flex-1">
                          {headline.heading}
                        </span>
                      </div>
                    </button>
                  ),
                )}
              </div>
            ) : (
              // Premium Empty State
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded animate-pulse" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  No headlines available
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Check back later for updates
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
