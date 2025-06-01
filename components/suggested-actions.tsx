'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo, useEffect, useState } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import { ClockRewind } from './icons';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';

// Define the interface for news items
interface NewsItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
  timestamp?: string; // Adding timestamp field
  imageUrl?: string;
  domain?: string; // Domain name of the source
  favicon?: string; // Favicon URL for the source website
}

// List of non-English news domains to filter out
const nonEnglishDomains = [
  'ilpost.it',
  'en.wikinews.org',
  // Add more non-English domains here as needed
];

interface GeoLocation {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
}

// Helper function to convert protocol-relative URLs to absolute HTTPS URLs
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

// Function to format relative time
function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) return 'Just now';

  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} day ago`;

  return `${Math.floor(diffInSeconds / 604800)} week ago`;
}

// Function to fetch trending news from SearXNG
async function fetchTrendingNews(): Promise<NewsItem[]> {
  try {
    // Get user location first
    let locationQuery = '';
    let countryName = '';

    try {
      console.log('Fetching geolocation data...');
      const geoResponse = await fetch('/api/geolocation');
      if (geoResponse.ok) {
        const geoData: GeoLocation = await geoResponse.json();
        console.log('Geolocation data received:', {
          ip: geoData.ip,
          country: geoData.country || 'Not detected',
          city: geoData.city || 'Not detected',
          region: geoData.region || 'Not detected',
        });

        // Only use country for news relevance, ignore city
        if (geoData.country) {
          countryName = geoData.country;
          locationQuery = `${geoData.country} `;
          console.log(`Country detected: ${geoData.country}`);
        } else {
          console.log('No country data detected');
        }
      } else {
        console.log(
          'Geolocation API response not OK',
          await geoResponse.text(),
        );
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }

    // Using trending news queries tailored to location if available
    const newsTypes = [
      'breaking news',
      'trending today',
      'latest headlines',
      'top stories',
    ];
    const randomNewsType =
      newsTypes[Math.floor(Math.random() * newsTypes.length)];

    // Create query based on country data only
    const searchQuery = countryName
      ? `${countryName} ${randomNewsType}`
      : randomNewsType;

    console.log(`Final search query: "${searchQuery}"`);
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(searchQuery)}&category=news`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      console.error('News API response not OK', await response.text());
      throw new Error('Failed to fetch trending news');
    }

    const data = await response.json();
    console.log(`Retrieved ${data.results?.length || 0} news items`);

    // Add timestamps to news items
    const now = new Date();
    const results = (data.results || []).map(
      (item: NewsItem, index: number) => {
        // Simulate different timestamps for items
        const minutesAgo = Math.floor(Math.random() * 120) + 5;
        const timestamp = new Date(
          now.getTime() - minutesAgo * 60000,
        ).toISOString();

        // Extract domain from URL if not already provided
        if (!item.domain && item.url) {
          try {
            const url = new URL(item.url);
            item.domain = url.hostname;
          } catch (e) {
            console.error('Could not parse URL for domain:', item.url);
          }
        }

        return { ...item, timestamp };
      },
    );

    // Filter out non-English news sources
    const filteredResults = results.filter((item: NewsItem) => {
      const domain = item.domain || '';
      return !nonEnglishDomains.some((blockedDomain) =>
        domain.includes(blockedDomain),
      );
    });

    console.log(
      `Filtered ${results.length - filteredResults.length} non-English news items`,
    );

    return filteredResults;
  } catch (error) {
    console.error('Error fetching trending news:', error);
    return [];
  }
}

// Loading skeleton component for news boxes
const NewsBoxSkeleton = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.05 * index }}
    className={index > 1 ? 'hidden sm:block' : 'block'}
  >
    <div className="border rounded-xl p-4 w-full h-auto hover:bg-slate-50 dark:hover:bg-slate-900/50">
      <Skeleton className="h-3.5 w-full mb-1.5" />
      <Skeleton className="h-3.5 w-4/5 mb-3" />
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  </motion.div>
);

// Display news items when loaded
const NewsBox = ({
  item,
  index,
  onClick,
}: { item: NewsItem; index: number; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.05 * index }}
    className={index > 1 ? 'hidden sm:block' : 'block'}
  >
    <Button
      variant="ghost"
      onClick={onClick}
      className="text-left border rounded-xl p-4 w-full h-auto flex-col items-start justify-start hover:bg-slate-50 dark:hover:bg-slate-900/50 overflow-hidden"
    >
      {/* Title with improved display - no truncation */}
      <h3
        className="font-medium text-sm leading-normal w-full"
        style={{
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          whiteSpace: 'normal',
        }}
      >
        {item.title}
      </h3>

      {/* Source domain and timestamp */}
      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
        <div className="flex items-center">
          {/* Small favicon near source name */}
          {item.favicon ? (
            <Image
              src={normalizeImageUrl(item.favicon)}
              alt={item.domain || 'Source'}
              width={16}
              height={16}
              className="w-4 h-4 rounded-full mr-1.5"
            />
          ) : (
            <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-[10px] mr-1.5">
              {(item.domain?.charAt(0) || 'N').toUpperCase()}
            </div>
          )}
          <span className="truncate max-w-[100px]">
            {item.domain || 'News Source'}
          </span>
        </div>
        <div className="flex items-center">
          <ClockRewind className="mr-0.5 svg-size-2" />
          <span>{formatRelativeTime(item.timestamp)}</span>
        </div>
      </div>
    </Button>
  </motion.div>
);

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch trending news when component mounts
    const getTrendingNews = async () => {
      setIsLoading(true);
      const news = await fetchTrendingNews();
      // Limit to 6 news items
      setNewsItems(news.slice(0, 6));
      setIsLoading(false);
    };

    getTrendingNews();
  }, []);

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-3 w-full"
    >
      {isLoading
        ? // Display loading skeletons while fetching news
          Array(6)
            .fill(0)
            .map((_, index) => (
              <NewsBoxSkeleton
                key={`skeleton-loading-${index}-${Date.now()}`}
                index={index}
              />
            ))
        : // Display news items when loaded
          newsItems.map((item, index) => (
            <NewsBox
              key={`trending-news-${item.url || item.title}-${index}`}
              item={item}
              index={index}
              onClick={async () => {
                window.history.replaceState({}, '', `/chat/${chatId}`);
                append({
                  role: 'user',
                  content: `Tell me more about this news: "${item.title}"`,
                });
              }}
            />
          ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
