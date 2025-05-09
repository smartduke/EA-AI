import { tool } from 'ai';
import { z } from 'zod';
import type { CheerioAPI } from 'cheerio';
import * as cheerio from 'cheerio';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  timestamp: string;
  message: string;
  error?: string;
}

// SearXNG Configuration
const SEARXNG_CONFIG = {
  host: process.env.SEARXNG_HOST || 'searx.be',
  ports: [443], // Use HTTPS port for public instances
  baseUrl: process.env.SEARXNG_URL || 'https://searx.be', // Use a public SearXNG instance
  timeout: Number.parseInt(process.env.SEARXNG_TIMEOUT || '15000'),
  engines: (
    process.env.SEARXNG_ENGINES || 'google,bing,brave,duckduckgo,wikipedia'
  ).split(','),
  categories: (process.env.SEARXNG_CATEGORIES || 'general,science,news').split(
    ',',
  ),
  language: process.env.SEARXNG_LANGUAGE || 'all',
  format: 'html', // Use HTML format
  resultsCount: Number.parseInt(process.env.SEARXNG_RESULTS_COUNT || '10'),
  retryCount: Number.parseInt(process.env.SEARXNG_RETRY_COUNT || '3'),
  retryDelay: Number.parseInt(process.env.SEARXNG_RETRY_DELAY || '1000'),
};

/**
 * Try to find a working SearXNG instance by testing available ports
 */
async function findWorkingSearXNGInstance(): Promise<string> {
  // Use configured URL if provided
  if (SEARXNG_CONFIG.baseUrl) {
    console.log(`Using configured SearXNG URL: ${SEARXNG_CONFIG.baseUrl}`);
    return SEARXNG_CONFIG.baseUrl;
  }

  // Test each port until we find a responsive SearXNG instance
  for (const port of SEARXNG_CONFIG.ports) {
    try {
      const url = `http://${SEARXNG_CONFIG.host}:${port}/`;
      console.log(`Testing SearXNG at ${url}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InfoxAI/1.0)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`✅ Found working SearXNG instance at ${url}`);
        return url.slice(0, -1); // Remove trailing slash
      }
    } catch (error) {
      // Continue trying other ports
    }
  }

  throw new Error(
    `No working SearXNG instance found on host: ${SEARXNG_CONFIG.host}`,
  );
}

/**
 * Initialize SearXNG URL during module loading
 */
let searxngBaseUrl = '';
(async () => {
  try {
    searxngBaseUrl = await findWorkingSearXNGInstance();
  } catch (error) {
    console.error('Error auto-detecting SearXNG URL:', error);
    // Don't set a default - we'll throw a proper error when search is attempted
  }
})();

/**
 * Fetches search results from SearXNG with retry capability
 */
async function fetchFromSearxNG(query: string): Promise<SearchResult[]> {
  if (!searxngBaseUrl) {
    throw new Error(
      'No SearXNG instance available. Please ensure SearXNG is running.',
    );
  }

  let lastError = null;

  // Implement retry logic
  for (let attempt = 0; attempt < SEARXNG_CONFIG.retryCount; attempt++) {
    try {
      // If not the first attempt, wait before retrying
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, SEARXNG_CONFIG.retryDelay),
        );
        console.log(
          `🔄 Retry attempt ${attempt + 1} for SearXNG search: "${query}"`,
        );
      }

      // Build the SearXNG search URL with parameters
      const searchUrl = new URL(`${searxngBaseUrl}/search`);
      searchUrl.searchParams.append('q', query);
      searchUrl.searchParams.append(
        'engines',
        SEARXNG_CONFIG.engines.join(','),
      );
      searchUrl.searchParams.append(
        'categories',
        SEARXNG_CONFIG.categories.join(','),
      );
      searchUrl.searchParams.append('language', SEARXNG_CONFIG.language);
      searchUrl.searchParams.append('pageno', '1');

      // Custom headers to avoid potential blocking
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Origin: searxngBaseUrl,
        Referer: searxngBaseUrl,
        DNT: '1',
        'Cache-Control': 'no-cache',
      };

      console.log(`🔍 Fetching SearXNG results from: ${searchUrl.toString()}`);

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        SEARXNG_CONFIG.timeout,
      );

      const response = await fetch(searchUrl.toString(), {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `SearXNG search failed with status: ${response.status} - ${response.statusText}`,
        );
      }

      const html = await response.text();

      // Parse HTML response using cheerio
      const $: CheerioAPI = cheerio.load(html);
      const results: SearchResult[] = [];

      // Extract results from the HTML
      $('.result').each((_: number, element) => {
        const $element = $(element);
        // Updated selectors to match SearXNG's HTML structure
        const titleElement = $element.find('h3 a');
        const snippetElement = $element.find('.content');
        const urlElement = $element.find('.url');
        const engineElement = $element.find('.engine');

        if (titleElement.length) {
          const title = titleElement.text().trim();
          const url = titleElement.attr('href') || urlElement.text().trim();
          const snippet = snippetElement.text().trim();
          const source = engineElement.text().trim();

          if (title && url) {
            results.push({
              title: title || 'Untitled',
              snippet: snippet || 'No description available',
              url: url,
              source: source || 'web',
            });
          }
        }
      });

      console.log(`Found ${results.length} results in HTML`);

      if (results.length === 0) {
        console.log(`⚠️ No usable results found from SearXNG for "${query}"`);
        return [];
      }

      return results.slice(0, SEARXNG_CONFIG.resultsCount);
    } catch (error: any) {
      console.error(
        `❌ SearXNG search error (attempt ${attempt + 1}/${SEARXNG_CONFIG.retryCount}):`,
        error.message,
      );
      lastError = error;

      // If this is the last attempt, continue to the error handling below
      if (attempt === SEARXNG_CONFIG.retryCount - 1) {
        break;
      }

      // If the error is an AbortError (timeout), try with increased timeout
      if (error.name === 'AbortError') {
        SEARXNG_CONFIG.timeout += 5000; // Increase timeout for next attempts
        console.log(
          `⏱️ Increased timeout to ${SEARXNG_CONFIG.timeout}ms for next attempt`,
        );
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw (
    lastError ||
    new Error('Failed to fetch search results after multiple attempts')
  );
}

export const webSearch = tool({
  description:
    'Search the web for recent information about a specific topic using SearXNG',
  parameters: z.object({
    query: z.string().describe('The search query to use'),
  }),
  execute: async ({ query }): Promise<SearchResponse> => {
    console.log(`🔎 Performing web search for: "${query}"`);

    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query cannot be empty');
      }

      // Try to fetch from SearXNG
      const results = await fetchFromSearxNG(query);

      return {
        results,
        query,
        timestamp: new Date().toISOString(),
        message:
          results.length > 0
            ? `Found ${results.length} results for "${query}"`
            : `No results found for "${query}"`,
      };
    } catch (error: any) {
      console.error(`❌ Web search error:`, error);

      // Return empty results with a descriptive error
      return {
        results: [],
        query: query || '',
        timestamp: new Date().toISOString(),
        error: error?.message || 'An error occurred during the search',
        message: `Unable to get search results: ${error?.message || 'An unknown error occurred'}. Please verify that SearXNG is properly configured and running.`,
      };
    }
  },
});
