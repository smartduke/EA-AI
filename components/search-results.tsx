import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLinkIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query?: string;
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

export function SearchResults({ results, query }: SearchResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }
  
  // Ensure we're working with a valid array, not a string or other type
  const searchResults = Array.isArray(results) ? results : [];
  
  if (searchResults.length === 0) {
    return (
      <div className="flex flex-col space-y-3 mt-4 mb-2 text-sm">
        <div className="text-xs font-medium text-muted-foreground">No search results found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 mt-4 mb-2 text-sm w-full">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">Sources</div>
        {query && (
          <div className="text-xs text-muted-foreground">
            Results for "{query}"
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {searchResults.map((result, index) => (
          <Card 
            key={`search-result-${index}-${result.source || 'unknown'}`} 
            className="p-3 hover:bg-muted/50 transition-colors border border-muted/60"
          >
            <div className="flex flex-col space-y-2">
              <a 
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline line-clamp-1 flex items-center gap-1 group"
              >
                {result.title || 'Untitled'}
                <span className="opacity-70 group-hover:opacity-100">
                  <ExternalLinkIcon size={12} />
                </span>
              </a>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {result.snippet || 'No description available'}
              </p>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-muted-foreground truncate max-w-[70%]">
                  {cleanUrlForDisplay(result.url)}
                </span>
                <span 
                  className={cn(
                    "px-2 py-0.5 rounded font-medium",
                    result.source === 'wikipedia' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-muted text-muted-foreground'
                  )}
                >
                  [{index + 1}]
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}