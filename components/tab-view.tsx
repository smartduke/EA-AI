'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SearchResult } from './search-results';
import { Markdown } from './markdown';
import { sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import {
  BoxIcon,
  CheckCircleFillIcon,
  ImageIcon,
  PlayIcon,
  CrossIcon,
} from './icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    const domain = urlObj.hostname.replace('www.', '');
    // Limit domain name length for display
    return domain.length > 20 ? `${domain.substring(0, 18)}...` : domain;
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

// Extended SearchResult interface with additional properties for image, video, and text search
interface ExtendedSearchResult extends SearchResult {
  type?: 'image' | 'text' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
}

interface TabViewProps {
  title: string;
  content: string;
  sources: ExtendedSearchResult[];
  isLoading?: boolean;
}

export function TabView({
  title,
  content,
  sources,
  isLoading = false,
}: TabViewProps) {
  const [activeTab, setActiveTab] = useState('answer');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
  const [lightboxVideoIndex, setLightboxVideoIndex] = useState(0);

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
          const linkPattern = new RegExp(
            `\\[(.*?)\\]\\(${escapeRegExp(source.url)}\\)`,
            'g',
          );
          processedContent = processedContent.replace(
            linkPattern,
            (match, text) => {
              // Clean any existing citation format, including domain names, source names, etc.
              const cleanText = text.replace(/<sup>\[\d+\]<\/sup>/, '').trim();
              const cleanText2 = cleanText.replace(/\s*\([^)]+\)$/, '').trim(); // Remove any (domain) parts
              const cleanText3 = cleanText2.replace(/\s+\w+$/, '').trim(); // Remove any trailing word (likely a source name)

              // Return just the cleaned text and URL, let the Markdown component add the source name
              return `[${cleanText3}](${source.url})`;
            },
          );
        }
      });
    }

    return processedContent;
  })();

  // Separate text, image, and video results
  const textSources = sources.filter(
    (source) => source.type !== 'image' && source.type !== 'video',
  );
  const imageSources = sources.filter((source) => source.type === 'image');
  const videoSources = sources.filter((source) => source.type === 'video');

  // Handler for "View more" button to switch to Sources tab
  const handleViewMoreSources = () => {
    setActiveTab('sources');
  };

  // Handler for "View more" button to switch to Images tab
  const handleViewMoreImages = () => {
    setActiveTab('images');
  };

  // Handler for "View more" button to switch to Videos tab
  const handleViewMoreVideos = () => {
    setActiveTab('videos');
  };

  // Helper function to escape special regex characters
  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Lightbox handlers for images
  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setLightboxImageIndex((prev) =>
      prev > 0 ? prev - 1 : imageSources.length - 1,
    );
  };

  const goToNext = () => {
    setLightboxImageIndex((prev) =>
      prev < imageSources.length - 1 ? prev + 1 : 0,
    );
  };

  // Lightbox handlers for videos
  const openVideoLightbox = (index: number) => {
    setLightboxVideoIndex(index);
    setVideoLightboxOpen(true);
  };

  const closeVideoLightbox = () => {
    setVideoLightboxOpen(false);
  };

  const goToPreviousVideo = () => {
    setLightboxVideoIndex((prev) =>
      prev > 0 ? prev - 1 : videoSources.length - 1,
    );
  };

  const goToNextVideo = () => {
    setLightboxVideoIndex((prev) =>
      prev < videoSources.length - 1 ? prev + 1 : 0,
    );
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (lightboxOpen) {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    } else if (videoLightboxOpen) {
      switch (e.key) {
        case 'Escape':
          closeVideoLightbox();
          break;
        case 'ArrowLeft':
          goToPreviousVideo();
          break;
        case 'ArrowRight':
          goToNextVideo();
          break;
      }
    }
  };

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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 dark:bg-neutral-200" />
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
              Sources{' '}
              {textSources?.length > 0 && (
                <span className="ml-1 text-sm text-neutral-500">
                  {textSources.length}
                </span>
              )}
            </span>
            {activeTab === 'sources' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 dark:bg-neutral-200" />
            )}
          </TabsTrigger>

          {imageSources.length > 0 && (
            <TabsTrigger
              value="images"
              className="relative px-0 py-3 min-w-0 h-auto bg-transparent hover:bg-transparent rounded-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white">
                <div className="text-neutral-800 dark:text-neutral-200">
                  <ImageIcon size={16} />
                </div>
                Images{' '}
                {imageSources.length > 0 && (
                  <span className="ml-1 text-sm text-neutral-500">
                    {imageSources.length}
                  </span>
                )}
              </span>
              {activeTab === 'images' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 dark:bg-neutral-200" />
              )}
            </TabsTrigger>
          )}

          {videoSources.length > 0 && (
            <TabsTrigger
              value="videos"
              className="relative px-0 py-3 min-w-0 h-auto bg-transparent hover:bg-transparent rounded-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white">
                <div className="text-neutral-800 dark:text-neutral-200">
                  <PlayIcon size={16} />
                </div>
                Videos{' '}
                {videoSources.length > 0 && (
                  <span className="ml-1 text-sm text-neutral-500">
                    {videoSources.length}
                  </span>
                )}
              </span>
              {activeTab === 'videos' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 dark:bg-neutral-200" />
              )}
            </TabsTrigger>
          )}
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
                    <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="w-12 h-3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  </div>
                ))}
              </div>

              {/* Skeleton for paragraphs */}
              <div className="space-y-3">
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-4/5 animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-2/3 animate-pulse" />
              </div>
            </>
          ) : (
            <>
              {textSources && textSources.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-row gap-2 flex-wrap">
                    <TooltipProvider delayDuration={50}>
                      {textSources.slice(0, 5).map((result) => (
                        <Tooltip key={`source-${result.url}`}>
                          <TooltipTrigger asChild>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 px-2.5 py-1.5 rounded-full text-sm transition-colors"
                            >
                              {result.url && (
                                <img
                                  src={
                                    result.favicon || getFaviconUrl(result.url)
                                  }
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
                          <TooltipContent
                            side="bottom"
                            className="max-w-[20rem]"
                          >
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
                                    src={
                                      result.favicon ||
                                      getFaviconUrl(result.url)
                                    }
                                    alt=""
                                    className="w-3 h-3 rounded-full"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-xs text-muted-foreground/80">
                                  {extractDomainName(result.url || '')}
                                  {result.publishedDate &&
                                    ` • ${formatPublicationDate(result.publishedDate)}`}
                                </span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>

                    {textSources.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium px-2.5 py-1.5 h-auto rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        onClick={handleViewMoreSources}
                      >
                        +{textSources.length - 5} more
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Preview images */}
              {imageSources && imageSources.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-row flex-wrap gap-2 sm:flex-nowrap sm:overflow-hidden">
                    {imageSources.slice(0, 4).map((result, index) => (
                      <button
                        key={`answer-mobile-image-${index}-${result.url}`}
                        type="button"
                        onClick={() => setActiveTab('images')}
                        className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:opacity-90 transition-opacity cursor-pointer sm:hidden"
                      >
                        <img
                          src={result.imageUrl || result.url}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Blur overlay on last image if there are more images */}
                        {index === 3 && imageSources.length > 4 && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              +{imageSources.length - 4}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}

                    {/* Desktop: Show 7 images */}
                    {imageSources.slice(0, 7).map((result, index) => (
                      <button
                        key={`answer-desktop-image-${index}-${result.url}`}
                        type="button"
                        onClick={() => setActiveTab('images')}
                        className="relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:opacity-90 transition-opacity cursor-pointer hidden sm:block"
                      >
                        <img
                          src={result.imageUrl || result.url}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Blur overlay on last image if there are more images */}
                        {index === 6 && imageSources.length > 7 && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white text-xs sm:text-sm font-medium">
                              +{imageSources.length - 7}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview videos */}
              {videoSources && videoSources.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-row flex-wrap gap-2 sm:flex-nowrap sm:overflow-hidden">
                    {/* Mobile: Show 3 videos */}
                    {videoSources.slice(0, 3).map((result, index) => (
                      <button
                        key={`answer-mobile-video-${index}-${result.url}`}
                        type="button"
                        onClick={() => openVideoLightbox(index)}
                        className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:opacity-90 transition-opacity cursor-pointer sm:hidden"
                      >
                        <img
                          src={result.thumbnailUrl || result.url}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-black/60 rounded-full p-2">
                            <div className="text-white">
                              <PlayIcon size={16} />
                            </div>
                          </div>
                        </div>
                        {/* Blur overlay on last video if there are more videos */}
                        {index === 2 && videoSources.length > 3 && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              +{videoSources.length - 3}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}

                    {/* Desktop: Show 5 videos */}
                    {videoSources.slice(0, 5).map((result, index) => (
                      <button
                        key={`answer-desktop-video-${index}-${result.url}`}
                        type="button"
                        onClick={() => openVideoLightbox(index)}
                        className="relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:opacity-90 transition-opacity cursor-pointer hidden sm:block"
                      >
                        <img
                          src={result.thumbnailUrl || result.url}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-black/60 rounded-full p-2">
                            <div className="text-white">
                              <PlayIcon size={16} />
                            </div>
                          </div>
                        </div>
                        {/* Blur overlay on last video if there are more videos */}
                        {index === 4 && videoSources.length > 5 && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white text-xs sm:text-sm font-medium">
                              +{videoSources.length - 5}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
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
                    <div className="flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 w-7 h-7 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                        <div className="w-24 h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                      </div>
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-full animate-pulse" />
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-5/6 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : textSources && textSources.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                {textSources.map((result, i) => (
                  <div
                    key={`source-detail-${result.url}`}
                    className="flex gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 w-7 h-7 text-sm font-bold shrink-0">
                      {i + 1}
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
                          {result.publishedDate &&
                            ` • ${formatPublicationDate(result.publishedDate)}`}
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

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4 mt-0 pt-0">
          <div className="flex flex-col space-y-4">
            {isLoading ? (
              // Skeleton for images tab
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={`image-skeleton-${idx}`}
                    className="aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse overflow-hidden"
                  />
                ))}
              </div>
            ) : imageSources && imageSources.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                {imageSources.map((result, index) => (
                  <button
                    key={`images-tab-${index}-${result.url}`}
                    type="button"
                    onClick={() => openLightbox(index)}
                    className="group flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    <div className="relative aspect-square bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
                      <img
                        src={result.imageUrl || result.url}
                        alt={result.title || 'Image result'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2 text-left">
                      <p className="text-xs text-neutral-800 dark:text-neutral-200 truncate group-hover:underline">
                        {result.title || 'Image result'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
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
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {extractDomainName(result.url || '')}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">
                No image results available for this response.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4 mt-0 pt-0">
          <div className="flex flex-col space-y-4">
            {isLoading ? (
              // Skeleton for videos tab
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={`video-skeleton-${idx}`}
                    className="aspect-video rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse overflow-hidden"
                  />
                ))}
              </div>
            ) : videoSources && videoSources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                {videoSources.map((result, index) => (
                  <button
                    key={`videos-tab-${index}-${result.url}`}
                    type="button"
                    onClick={() => openVideoLightbox(index)}
                    className="group flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    <div className="relative aspect-video bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
                      <img
                        src={result.thumbnailUrl || result.url}
                        alt={result.title || 'Video result'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/80 rounded-full p-3">
                          <div className="text-white">
                            <PlayIcon size={24} />
                          </div>
                        </div>
                      </div>
                      {/* Duration badge */}
                      {result.duration && result.duration !== 'Unknown' && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {result.duration}
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-left">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:underline">
                        {result.title || 'Video result'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="text-red-600">
                          <PlayIcon size={12} />
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          YouTube
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">
                No YouTube videos available for this response.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Lightbox Modal */}
      {lightboxOpen && imageSources[lightboxImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <CrossIcon size={24} />
          </button>

          {/* Navigation buttons */}
          {imageSources.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            </>
          )}

          {/* Main image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                imageSources[lightboxImageIndex].imageUrl ||
                imageSources[lightboxImageIndex].url
              }
              alt={imageSources[lightboxImageIndex].title || 'Image'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* Image info */}
            <div className="mt-4 bg-black/50 rounded-lg p-4 max-w-full">
              <h3 className="text-white font-medium mb-2">
                {imageSources[lightboxImageIndex].title || 'Image result'}
              </h3>
              <div className="flex items-center gap-2">
                {imageSources[lightboxImageIndex].url && (
                  <img
                    src={
                      imageSources[lightboxImageIndex].favicon ||
                      getFaviconUrl(imageSources[lightboxImageIndex].url)
                    }
                    alt=""
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="text-neutral-300 text-sm">
                  {extractDomainName(
                    imageSources[lightboxImageIndex].url || '',
                  )}
                </span>
                <a
                  href={imageSources[lightboxImageIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline ml-2"
                >
                  View source
                </a>
              </div>
              {imageSources.length > 1 && (
                <p className="text-neutral-400 text-sm mt-2">
                  {lightboxImageIndex + 1} of {imageSources.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Lightbox Modal */}
      {videoLightboxOpen && videoSources[lightboxVideoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeVideoLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeVideoLightbox}
            className="absolute top-4 right-4 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <CrossIcon size={24} />
          </button>

          {/* Navigation buttons */}
          {videoSources.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousVideo();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextVideo();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            </>
          )}

          {/* Main video */}
          <div
            className="relative w-full max-w-5xl aspect-video flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const videoId = getYouTubeVideoId(
                videoSources[lightboxVideoIndex].url,
              );
              return videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title={
                    videoSources[lightboxVideoIndex].title || 'YouTube video'
                  }
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full bg-neutral-800 rounded-lg flex items-center justify-center">
                  <p className="text-white">Unable to load video</p>
                </div>
              );
            })()}

            {/* Video info */}
            <div className="mt-4 bg-black/50 rounded-lg p-4 max-w-full">
              <h3 className="text-white font-medium mb-2">
                {videoSources[lightboxVideoIndex].title || 'Video result'}
              </h3>
              <div className="flex items-center gap-2">
                <div className="text-red-600">
                  <PlayIcon size={16} />
                </div>
                <span className="text-neutral-300 text-sm">YouTube</span>
                <a
                  href={videoSources[lightboxVideoIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline ml-2"
                >
                  View on YouTube
                </a>
              </div>
              {videoSources.length > 1 && (
                <p className="text-neutral-400 text-sm mt-2">
                  {lightboxVideoIndex + 1} of {videoSources.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
