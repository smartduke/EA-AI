'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchResult, SearchResults } from './search-results';
import { Markdown } from './markdown';
import { sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { FileIcon, BoxIcon } from './icons'; // Import icons

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

interface TabViewProps {
  title: string;
  content: string;
  sources: SearchResult[];
}

export function TabView({ title, content, sources }: TabViewProps) {  
  const [activeTab, setActiveTab] = useState('answer');
  
  // Extract just the main content, removing follow-up questions if they exist
  const mainContent = (() => {
    const sanitizedContent = sanitizeText(content);
    const parts = sanitizedContent.split('---');
    return parts[0].trim();
  })();

  // Handler for "View more" button to switch to Sources tab
  const handleViewMoreSources = () => {
    setActiveTab('sources');
  };

  return (
    <div className="flex flex-col w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid-cols-2 mb-2">
          <TabsTrigger value="answer">
            <span className="flex items-center gap-2">
              <FileIcon size={14} />
              Answer
            </span>
          </TabsTrigger>
          <TabsTrigger value="sources">
            <span className="flex items-center gap-2">
              <BoxIcon size={14} />
              Sources
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="answer" className="space-y-4">
          {/* Display sources in a row at the top of the Answer tab */}
          {sources && sources.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-row gap-3 w-full">
                {sources.slice(0, 3).map((result, index) => (
                  <div 
                    key={`source-preview-${index}`} 
                    className="flex-1 min-w-0"
                  >
                    <div className="overflow-hidden py-1.5 min-h-[80px]">
                      <SearchResults results={[result]} hideTitle={true} listView={true} />
                    </div>
                  </div>
                ))}
                
                {sources.length > 3 && (
                  <div 
                    className="min-w-0 border border-muted/60 rounded-md min-h-[80px] overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors w-24" 
                    onClick={handleViewMoreSources}
                  >
                    <div className="h-full flex flex-col justify-center items-center p-2">
                      <div className="flex mb-2">
                        {sources.slice(3, 6).map((source, idx) => (
                          <div 
                            key={`mini-source-${idx}`} 
                            className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs -ml-1 first:ml-0 border border-background overflow-hidden"
                          >
                            {source.url ? (
                              <img 
                                src={source.favicon || getFaviconUrl(source.url)} 
                                alt={`Source ${idx + 4}`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  // Fallback to first letter if favicon fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.textContent = 
                                    (source.title?.[0] || source.url?.[0] || 'S').toUpperCase();
                                }}
                              />
                            ) : (
                              (source.title?.[0] || 'S').toUpperCase()
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        +{sources.length - 3} sources
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="prose dark:prose-invert max-w-none">
            <Markdown>{mainContent}</Markdown>
          </div>
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-4">
          <div className="flex flex-col space-y-4">
            {sources && sources.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 w-full">
                {sources.map((result, index) => (
                  <div key={`source-list-${index}`} className="flex items-center gap-4">
                    <div className="font-medium">{index + 1}</div>
                    <div className="flex-1">
                      <SearchResults results={[result]} hideTitle={true} listView={true} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No sources available for this response.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}