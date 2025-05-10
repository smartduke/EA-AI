import Link from 'next/link';
import React, { memo, useContext } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './code-block';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Function to get favicon URL for a domain
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

// Context to pass sources data to the Markdown component
const MarkdownContext = React.createContext<{
  sources: any[] | undefined;
}>({ sources: undefined });

// Regular expression to find citation references like [1], [2], etc.
const CITATION_REGEX = /\[(\d+)\]/g;

// Function to process text and wrap citations in styled spans
const processTextWithCitations = (text: string) => {
  if (!text) return null;

  // Avoid processing text that's already part of a citation link
  if (text.includes('<sup>') || text.includes('</sup>')) {
    return text;
  }

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>,
      );
    }

    parts.push(
      <span
        key={`citation-${match.index}`}
        className="inline-flex justify-center items-center bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md text-xs font-medium"
      >
        {match[0]}
      </span>,
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length ? <>{parts}</> : text;
};

const CustomLink = ({ node, children, href, ...props }: any) => {
  const { sources } = useContext(MarkdownContext);
  
  // Check if this is a citation link by matching URL with sources
  if (href && sources && sources.length > 0) {
    const sourceMatch = sources.find(source => 
      source.url && href.includes(source.url)
    );
    
    if (sourceMatch) {
      // Extract the source name (publication name)
      let sourceName = '';
      if (sourceMatch.title) {
        // Try to extract publication name from title
        const parts = sourceMatch.title.split(' - ');
        if (parts.length > 1) {
          sourceName = parts[parts.length - 1].trim();
        } else {
          // Just use the domain name without TLD as fallback
          const domain = extractDomainName(sourceMatch.url).split('.')[0];
          // Capitalize first letter
          sourceName = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }

      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={href}
                className="inline-flex items-center text-xs bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 ml-0.5 whitespace-nowrap hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 no-underline transition-colors"
                target="_blank"
                rel="noreferrer"
                {...props}
              >
                {sourceMatch.url && (
                  <img
                    src={sourceMatch.favicon || getFaviconUrl(sourceMatch.url)}
                    alt=""
                    className="w-3 h-3 rounded-full mr-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="font-medium">{sourceName || children}</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[20rem] p-1" sideOffset={5}>
              <a 
                href={href}
                target="_blank"
                rel="noreferrer"
                className="block font-medium text-xs leading-tight mb-0.5 text-neutral-800 dark:text-neutral-200"
              >
                {sourceMatch.title}
              </a>
              {sourceMatch.snippet && (
                <span className="block text-xs text-muted-foreground line-clamp-2 mb-0.5">
                  {sourceMatch.snippet}
                </span>
              )}
              <span className="flex items-center gap-1">
                {sourceMatch.url && (
                  <img
                    src={sourceMatch.favicon || getFaviconUrl(sourceMatch.url)}
                    alt=""
                    className="w-3 h-3 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="text-xs text-muted-foreground/80 leading-none">
                  {extractDomainName(sourceMatch.url || '')}
                  {sourceMatch.publishedDate && ` • ${formatPublicationDate(sourceMatch.publishedDate)}`}
                </span>
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  }

  // Default link rendering
  return (
    <Link
      className="text-blue-500 hover:underline"
      target="_blank"
      rel="noreferrer"
      href={href || '#'}
      {...props}
    >
      {children}
    </Link>
  );
};

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  text: ({ children }) => processTextWithCitations(children as string),
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-disc list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: CustomLink,
  sup: ({ children }) => {
    return (
      <sup className="text-xs align-super">{children}</sup>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
};

// Add rehypeRaw to allow HTML parsing
const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];

const NonMemoizedMarkdown = ({ children, sources }: { children: string, sources?: any[] }) => {
  return (
    <MarkdownContext.Provider value={{ sources }}>
      <ReactMarkdown 
        remarkPlugins={remarkPlugins} 
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </MarkdownContext.Provider>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => 
    prevProps.children === nextProps.children && 
    JSON.stringify(prevProps.sources) === JSON.stringify(nextProps.sources)
);
