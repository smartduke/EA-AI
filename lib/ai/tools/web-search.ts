import { tool } from 'ai';
import { z } from 'zod';

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
  host: process.env.SEARXNG_HOST || 'localhost',
  ports: [8080, 8081, 8082, 80], // Try multiple possible ports
  baseUrl: process.env.SEARXNG_URL || '', // Will be auto-detected if not set
  timeout: 15000, // 15 seconds timeout
  engines: ['google', 'bing', 'brave', 'duckduckgo', 'wikipedia'], // Default engines to use
  categories: ['general', 'science', 'news'], // Categories to search in
  language: 'all',
  format: 'json',
  resultsCount: 10, // Number of results to return
  retryCount: 3, // Number of retries if search fails
  retryDelay: 1000, // Delay between retries in ms
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
        signal: controller.signal
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
  
  throw new Error(`No working SearXNG instance found on host: ${SEARXNG_CONFIG.host}`);
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
    throw new Error('No SearXNG instance available. Please ensure SearXNG is running.');
  }
  
  let lastError = null;
  
  // Implement retry logic
  for (let attempt = 0; attempt < SEARXNG_CONFIG.retryCount; attempt++) {
    try {
      // If not the first attempt, wait before retrying
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, SEARXNG_CONFIG.retryDelay));
        console.log(`🔄 Retry attempt ${attempt+1} for SearXNG search: "${query}"`);
      }
      
      // Build the SearXNG search URL with parameters
      const searchUrl = new URL(`${searxngBaseUrl}/search`);
      searchUrl.searchParams.append('q', query);
      searchUrl.searchParams.append('format', SEARXNG_CONFIG.format);
      searchUrl.searchParams.append('engines', SEARXNG_CONFIG.engines.join(','));
      searchUrl.searchParams.append('categories', SEARXNG_CONFIG.categories.join(','));
      searchUrl.searchParams.append('language', SEARXNG_CONFIG.language);
      searchUrl.searchParams.append('pageno', '1');
      searchUrl.searchParams.append('max_results', String(SEARXNG_CONFIG.resultsCount));
      
      // Custom headers to avoid potential blocking
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': searxngBaseUrl,
        'Referer': searxngBaseUrl,
        'DNT': '1',
        'Cache-Control': 'no-cache',
      };
      
      console.log(`🔍 Fetching SearXNG results from: ${searchUrl.toString()}`);
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SEARXNG_CONFIG.timeout);
      
      const response = await fetch(searchUrl.toString(), {
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`SearXNG search failed with status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        console.log(`⚠️ Invalid response format from SearXNG for "${query}":`, JSON.stringify(data).slice(0, 200));
        throw new Error('Invalid response format from SearXNG');
      }
      
      console.log(`✅ SearXNG returned ${data.results.length} results for "${query}"`);
      
      // Process and format SearXNG results
      const results: SearchResult[] = data.results
        .filter((result: any) => result.url && (result.title || result.content))
        .map((result: any) => ({
          title: result.title || 'Untitled',
          snippet: result.content || result.snippet || result.description || 'No description available',
          url: result.url,
          source: result.engine || 'web'
        }))
        .slice(0, SEARXNG_CONFIG.resultsCount);
        
      if (results.length === 0) {
        console.log(`⚠️ No usable results found from SearXNG for "${query}"`);
        return [];
      }
      
      return results;
    } catch (error: any) {
      console.error(`❌ SearXNG search error (attempt ${attempt+1}/${SEARXNG_CONFIG.retryCount}):`, error.message);
      lastError = error;
      
      // If this is the last attempt, continue to the error handling below
      if (attempt === SEARXNG_CONFIG.retryCount - 1) {
        break;
      }
      
      // If the error is an AbortError (timeout), try with increased timeout
      if (error.name === 'AbortError') {
        SEARXNG_CONFIG.timeout += 5000; // Increase timeout for next attempts
        console.log(`⏱️ Increased timeout to ${SEARXNG_CONFIG.timeout}ms for next attempt`);
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError || new Error('Failed to fetch search results after multiple attempts');
}

export const webSearch = tool({
  description: 'Search the web for recent information about a specific topic using SearXNG',
  parameters: z.object({
    query: z.string().describe('The search query to use')
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
        message: results.length > 0 
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
  }
});