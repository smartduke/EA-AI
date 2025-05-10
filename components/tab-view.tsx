'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchResult, SearchResults } from './search-results';
import { Markdown } from './markdown';
import { sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { FileIcon, BoxIcon, CheckCircleFillIcon } from './icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper function to get favicon URL for a domain
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    return '';
  }
}

// Extracts domain name from URL for display
function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname.replace('www.', '');
    // Limit domain name length for display
    return domain.length > 20 ? domain.substring(0, 18) + '...' : domain;
  } catch (e) {
    return url;
  }
}

// Format publication date if available
function formatPublicationDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch (e) {
    return dateStr;
  }
}

interface TabViewProps {
  title: string;
  content: string;
  sources: SearchResult[];
  isLoading?: boolean;
}

export function TabView({ title, content, sources, isLoading = false }: TabViewProps) {
  const [activeTab, setActiveTab] = useState('answer');

  // Extract just the main content, removing follow-up questions if they exist
  const mainContent = (() => {
    const sanitizedContent = sanitizeText(content);
    const parts = sanitizedContent.split('---');
    return parts[0].trim();
  })();

  // Process content to enhance citation links for Perplexity-style
  const enhancedContent = (() => {
    let processedContent = mainContent;
    
    // Replace citations with enhanced format without domains in parentheses
    if (sources && sources.length > 0) {
      sources.forEach((source, index) => {
        if (source.url && source.title) {
          // Look for Markdown citation links [Text](URL) or previously enhanced ones
          const linkPattern = new RegExp(`\\[(.*?)\\]\\(${escapeRegExp(source.url)}\\)`, 'g');
          processedContent = processedContent.replace(linkPattern, (match, text) => {
            // Clean any existing citation format, including domain names, source names, etc.
            const cleanText = text.replace(/<sup>\[\d+\]<\/sup>/, '').trim();
            const cleanText2 = cleanText.replace(/\s*\([^)]+\)$/, '').trim(); // Remove any (domain) parts
            const cleanText3 = cleanText2.replace(/\s+\w+$/, '').trim(); // Remove any trailing word (likely a source name)
            
            // Return just the cleaned text and URL, let the Markdown component add the source name
            return `[${cleanText3}](${source.url})`;
          });
        }
      });
    }
    
    return processedContent;
  })();

  // Handler for "View more" button to switch to Sources tab
  const handleViewMoreSources = () => {
    setActiveTab('sources');
  };
  
  // Helper function to escape special regex characters
  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  return (
    <div className="flex flex-col w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto bg-transparent p-0 border-0 flex gap-6 mb-4 mt-2 justify-start">
          <TabsTrigger 
            value="answer" 
            className="relative px-0 py-3 min-w-0 h-auto bg-transparent hover:bg-transparent rounded-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white">
              <div className="text-neutral-800 dark:text-neutral-200">
                <CheckCircleFillIcon size={16} />
              </div>
              Answer
            </span>
            {activeTab === 'answer' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 dark:bg-neutral-200"></div>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="sources" 
            className="relative px-0 py-3 min-w-0 h-auto bg-transparent hover:bg-transparent rounded-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white">
              <div className="text-neutral-800 dark:text-neutral-200">
                <BoxIcon size={16} />
              </div>
              Sources {sources?.length > 0 && <span className="ml-1 text-sm text-neutral-500">{sources.length}</span>}
            </span>
            {activeTab === 'sources' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 dark:bg-neutral-200"></div>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="answer" className="space-y-4 mt-0 pt-0">
          {/* Top sources row with no divider */}
          {isLoading ? (
            <>
              {/* Skeleton for source chips */}
              <div className="flex flex-row gap-2 flex-wrap mb-4">
                {[1, 2, 3].map((idx) => (
                  <div 
                    key={`source-skeleton-${idx}`} 
                    className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1.5 rounded-full animate-pulse"
                  >
                    <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                    <div className="w-12 h-3 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                ))}
              </div>
              
              {/* Skeleton for paragraphs */}
              <div className="space-y-3">
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-4/5 animate-pulse"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-2/3 animate-pulse"></div>
              </div>
            </>
          ) : (
            <>
              {sources && sources.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-row gap-2 flex-wrap">
                    <TooltipProvider delayDuration={50}>
                      {sources.slice(0, 5).map((result, index) => (
                        <Tooltip key={`source-chip-${index}`}>
                          <TooltipTrigger asChild>
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 px-2.5 py-1.5 rounded-full text-sm transition-colors"
                            >
                              {result.url && (
                                <img
                                  src={result.favicon || getFaviconUrl(result.url)}
                                  alt=""
                                  className="w-4 h-4 rounded-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="font-medium text-xs">
                                {extractDomainName(result.url || '')}
                              </span>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[20rem]">
                            <div className="space-y-2">
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="font-semibold text-sm text-primary hover:underline"
                              >
                                {result.title}
                              </a>
                              {result.snippet && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {result.snippet}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 pt-1">
                                {result.url && (
                                  <img
                                    src={result.favicon || getFaviconUrl(result.url)}
                                    alt=""
                                    className="w-3 h-3 rounded-full"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-xs text-muted-foreground/80">
                                  {extractDomainName(result.url || '')}
                                  {result.publishedDate && ` • ${formatPublicationDate(result.publishedDate)}`}
                                </span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                    
                    {sources.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium px-2.5 py-1.5 h-auto rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        onClick={handleViewMoreSources}
                      >
                        +{sources.length - 5} more
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none">
                <Markdown sources={sources}>{enhancedContent}</Markdown>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="sources" className="space-y-4 mt-0 pt-0">
          <div className="flex flex-col space-y-4">
            {isLoading ? (
              // Skeleton for sources tab
              <div className="flex flex-col gap-4 w-full">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={`source-detail-skeleton-${idx}`}
                    className="flex gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 w-7 h-7 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse"></div>
                        <div className="w-24 h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-5/6 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sources && sources.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                {sources.map((result, index) => (
                  <div
                    key={`source-detail-${index}`}
                    className="flex gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 w-7 h-7 text-sm font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1.5">
                        {result.url && (
                          <img
                            src={result.favicon || getFaviconUrl(result.url)}
                            alt=""
                            className="w-4 h-4 rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:underline truncate"
                        >
                          {extractDomainName(result.url || '')}
                          {result.publishedDate && ` • ${formatPublicationDate(result.publishedDate)}`}
                        </a>
                      </div>
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:no-underline"
                      >
                        <h3 className="font-semibold text-sm mb-1 text-neutral-800 dark:text-neutral-200 hover:underline">
                          {result.title || 'Untitled Source'}
                        </h3>
                      </a>
                      {result.snippet && (
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                          {result.snippet}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">
                No sources available for this response.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
