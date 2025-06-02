import React from 'react';
import { Card, } from '@/components/ui/card';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  favicon?: string; // Optional favicon URL
  publishedDate?: string; // Optional publication date
}

interface SearchResultsProps {
  results: SearchResult[];
  query?: string;
  hideTitle?: boolean; // Option to hide the "Sources" title
  listView?: boolean; // Option for list view in Sources tab
}

// Helper function to clean URL for display
function cleanUrlForDisplay(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    // If URL parsing fails, return a cleaned version of the original
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

// Helper function to get favicon URL for a domain
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    // Using Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    return ''; // Return empty string if URL parsing fails
  }
}

// Helper function to convert protocol-relative URLs to absolute HTTPS URLs
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

export function SearchResults({
  results,
  query,
  hideTitle = false,
  listView = false,
}: SearchResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  // Ensure we're working with a valid array, not a string or other type
  const searchResults = Array.isArray(results) ? results : [];

  if (searchResults.length === 0) {
    return (
      <div className="flex flex-col space-y-3 mt-4 mb-2 text-sm">
        <div className="text-xs font-medium text-muted-foreground">
          No search results found
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col space-y-3 mt-2 mb-2 text-sm w-full">
        {!hideTitle && (
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Sources
            </div>
            {query && (
              <div className="text-xs text-muted-foreground">
                Results for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        )}
        <div
          className={cn(
            'grid gap-3 w-full',
            listView
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
          )}
        >
          {searchResults.map((result, index) => (
            <Tooltip
              key={`search-result-${index}-${result.source || 'unknown'}`}
            >
              <TooltipTrigger asChild>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <Card
                    className={cn(
                      'p-3 hover:bg-muted/50 transition-colors border border-muted/60 flex flex-col justify-between cursor-pointer',
                      listView ? 'h-auto' : 'h-[90px]',
                    )}
                  >
                    <div className="flex flex-col justify-between h-full space-y-0">
                      <span className="font-medium text-primary line-clamp-2 text-sm">
                        {result.title || 'Untitled'}
                      </span>
                      <div className="flex items-center text-xs">
                        <div className="flex items-center gap-2">
                          {result.favicon ? (
                            <Image
                              src={result.favicon}
                              alt={`${cleanUrlForDisplay(result.url)} favicon`}
                              width={16}
                              height={16}
                              className="size-4 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Image
                              src={getFaviconUrl(result.url)}
                              alt={`${cleanUrlForDisplay(result.url)} favicon`}
                              width={16}
                              height={16}
                              className="size-4 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div
                            className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-[10px]"
                            style={{ display: 'none' }}
                          >
                            {(
                              cleanUrlForDisplay(result.url).charAt(0) || 'S'
                            ).toUpperCase()}
                          </div>
                          <span className="text-muted-foreground truncate">
                            {cleanUrlForDisplay(result.url)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px]">
                <div className="space-y-2">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium inline-block"
                  >
                    {result.title}
                  </a>
                  {result.snippet && (
                    <p className="text-xs text-muted-foreground">
                      {result.snippet}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {result.favicon ? (
                      <Image
                        src={result.favicon}
                        alt={`${cleanUrlForDisplay(result.url)} favicon`}
                        width={16}
                        height={16}
                        className="size-4 rounded-full"
                      />
                    ) : (
                      <Image
                        src={getFaviconUrl(result.url)}
                        alt={`${cleanUrlForDisplay(result.url)} favicon`}
                        width={16}
                        height={16}
                        className="size-4 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span>{cleanUrlForDisplay(result.url)}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
