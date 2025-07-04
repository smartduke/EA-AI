import { tool } from 'ai';
import { z } from 'zod';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  type?: 'image' | 'text' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  domain?: string;
  favicon?: string;
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
  imageEngines: (
    process.env.SEARXNG_IMAGE_ENGINES || 'google_images,bing_images'
  ).split(','),
  videoEngines: (
    process.env.SEARXNG_VIDEO_ENGINES || 'youtube,google_videos'
  ).split(','),
  categories: (process.env.SEARXNG_CATEGORIES || 'general,science,news').split(
    ',',
  ),
  language: process.env.SEARXNG_LANGUAGE || 'all',
  format: 'json', // Use JSON format
  // Regular search configuration
  resultsCount: Number.parseInt(process.env.SEARXNG_RESULTS_COUNT || '8'),
  imageResultsCount: Number.parseInt(
    process.env.SEARXNG_IMAGE_RESULTS_COUNT || '10',
  ),
  videoResultsCount: Number.parseInt(
    process.env.SEARXNG_VIDEO_RESULTS_COUNT || '10',
  ),
  // Deep search specific configuration - separate from regular search
  deepSearchTextCount: Number.parseInt(
    process.env.SEARXNG_DEEP_TEXT_COUNT || '20',
  ),
  deepSearchImageCount: Number.parseInt(
    process.env.SEARXNG_DEEP_IMAGE_COUNT || '20',
  ),
  deepSearchVideoCount: Number.parseInt(
    process.env.SEARXNG_DEEP_VIDEO_COUNT || '20',
  ),
  totalResultsLimit: Number.parseInt(
    process.env.SEARXNG_TOTAL_RESULTS_LIMIT || '40',
  ),
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
 * Makes a search request to SearXNG
 */
async function makeSearchRequest(
  baseUrl: string,
  query: string,
  category: string,
  engines: string[],
  numResults: number,
): Promise<any[]> {
  const searchUrl = new URL('search', baseUrl);
  searchUrl.searchParams.append('format', 'json');
  searchUrl.searchParams.append('q', query);
  searchUrl.searchParams.append('engines', engines.join(','));
  searchUrl.searchParams.append('categories', category);
  searchUrl.searchParams.append('language', SEARXNG_CONFIG.language);
  searchUrl.searchParams.append('pageno', '1');
  searchUrl.searchParams.append('results', numResults.toString());

  // Custom headers to avoid potential blocking
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    Origin: baseUrl,
    Referer: baseUrl,
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

  try {
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

    const jsonResponse = await response.json();
    return jsonResponse.results || [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Process text search results into a standardized format
 */
function processTextResults(results: any[]): SearchResult[] {
  return results.map((result) => ({
    title: result.title || 'Untitled',
    snippet: result.content || 'No description available',
    url: result.url,
    source: result.engine || 'web',
    type: 'text',
    domain: result.parsed_url?.[1] || new URL(result.url).hostname,
    favicon: result.favicon || null,
  }));
}

/**
 * Process image search results into a standardized format
 */
function processImageResults(results: any[]): SearchResult[] {
  // Domains to exclude from image results
  const excludedDomains = ['artic.edu', 'unsplash.com'];

  return results
    .map((result) => ({
      title: result.title || 'Untitled Image',
      snippet: result.content || 'No description available',
      url: result.url,
      source: result.engine || 'image',
      type: 'image',
      imageUrl: result.img_src || result.thumbnail || result.url,
      domain: result.parsed_url?.[1] || new URL(result.url).hostname,
    }))
    .filter((result) => {
      // Extract domain from URL for filtering
      let domain = '';
      try {
        domain = new URL(result.url).hostname.toLowerCase();
      } catch (e) {
        domain = result.domain?.toLowerCase() || '';
      }

      // Check if domain should be excluded
      const shouldExclude = excludedDomains.some((excludedDomain) =>
        domain.includes(excludedDomain.toLowerCase()),
      );

      if (shouldExclude) {
        console.log(`🚫 Filtered out image from excluded domain: ${domain}`);
      }

      return !shouldExclude;
    }) as SearchResult[];
}

/**
 * Process video search results into a standardized format
 */
function processVideoResults(results: any[]): SearchResult[] {
  // Only include YouTube videos
  const allowedDomains = ['youtube.com', 'youtu.be'];

  return results
    .map((result) => ({
      title: result.title || 'Untitled Video',
      snippet: result.content || 'No description available',
      url: result.url,
      source: result.engine || 'video',
      type: 'video',
      videoUrl: result.url,
      thumbnailUrl: result.thumbnail || result.img_src || result.url,
      duration: result.duration || 'Unknown',
      domain: result.parsed_url?.[1] || new URL(result.url).hostname,
    }))
    .filter((result) => {
      // Extract domain from URL for filtering
      let domain = '';
      try {
        domain = new URL(result.url).hostname.toLowerCase();
      } catch (e) {
        domain = result.domain?.toLowerCase() || '';
      }

      // Check if domain is YouTube
      const isYouTube = allowedDomains.some((allowedDomain) =>
        domain.includes(allowedDomain.toLowerCase()),
      );

      if (!isYouTube) {
        console.log(`🚫 Filtered out non-YouTube video from domain: ${domain}`);
      }

      return isYouTube;
    }) as SearchResult[];
}

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

      // Make all searches in parallel
      const [textResultsRaw, imageResultsRaw, videoResultsRaw] =
        await Promise.all([
          makeSearchRequest(
            searxngBaseUrl,
            query,
            'general',
            SEARXNG_CONFIG.engines,
            8, // Max 8 sources for regular search
          ),
          makeSearchRequest(
            searxngBaseUrl,
            query,
            'images',
            SEARXNG_CONFIG.imageEngines,
            15, // Fetch extra to account for filtering, target max 10 images
          ),
          makeSearchRequest(
            searxngBaseUrl,
            query,
            'videos',
            SEARXNG_CONFIG.videoEngines,
            15, // Fetch extra to account for filtering, target max 10 videos
          ),
        ]);

      // Process results into standardized format
      const textResults = processTextResults(textResultsRaw);
      const imageResults = processImageResults(imageResultsRaw);
      const videoResults = processVideoResults(videoResultsRaw);

      // Ensure proper balance of results for regular search
      const combinedResults: SearchResult[] = [];

      // Get text results for 3-4 paragraphs (8 sources max)
      const textResultsToInclude = Math.min(8, textResults.length);
      combinedResults.push(...textResults.slice(0, textResultsToInclude));

      // Get up to 10 image results (user requirement)
      const maxImages = Math.min(10, imageResults.length);
      combinedResults.push(...imageResults.slice(0, maxImages));

      // Get up to 10 video results (user requirement)
      const maxVideos = Math.min(10, videoResults.length);
      combinedResults.push(...videoResults.slice(0, maxVideos));

      console.log(
        `Found ${textResults.length} text results, ${imageResults.length} image results, and ${videoResults.length} video results, returning ${combinedResults.length} combined results (with ${combinedResults.filter((r) => r.type === 'image').length} images and ${combinedResults.filter((r) => r.type === 'video').length} videos)`,
      );

      if (combinedResults.length === 0) {
        console.log(`⚠️ No usable results found from SearXNG for "${query}"`);
        return [];
      }

      return combinedResults;
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

export const deepWebSearch = tool({
  description:
    'Perform comprehensive deep web search for extensive research with 30-50 results using SearXNG',
  parameters: z.object({
    query: z.string().describe('The search query to use for deep research'),
  }),
  execute: async ({ query }): Promise<SearchResponse> => {
    console.log(`🔍 Performing DEEP web search for: "${query}"`);

    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query cannot be empty');
      }

      // Enhanced configuration for deep search
      const deepSearchResults = await fetchDeepSearchResults(query);

      return {
        results: deepSearchResults,
        query,
        timestamp: new Date().toISOString(),
        message:
          deepSearchResults.length > 0
            ? `Found ${deepSearchResults.length} comprehensive results for deep research on "${query}"`
            : `No results found for deep search on "${query}"`,
      };
    } catch (error: any) {
      console.error(`❌ Deep web search error:`, error);

      // Return empty results with a descriptive error
      return {
        results: [],
        query: query || '',
        timestamp: new Date().toISOString(),
        error: error?.message || 'An error occurred during the deep search',
        message: `Unable to get deep search results: ${error?.message || 'An unknown error occurred'}. Please verify that SearXNG is properly configured and running.`,
      };
    }
  },
});

/**
 * Fetches comprehensive search results for deep search mode (20 text, 20 images, 20 videos)
 */
async function fetchDeepSearchResults(query: string): Promise<SearchResult[]> {
  if (!searxngBaseUrl) {
    throw new Error(
      'No SearXNG instance available. Please ensure SearXNG is running.',
    );
  }

  let lastError = null;

  // Implement retry logic for deep search
  for (let attempt = 0; attempt < SEARXNG_CONFIG.retryCount; attempt++) {
    try {
      // If not the first attempt, wait before retrying
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, SEARXNG_CONFIG.retryDelay),
        );
        console.log(
          `🔄 Deep search retry attempt ${attempt + 1} for: "${query}"`,
        );
      }

      // Enhanced search requests for deep search - use dedicated deep search counts
      const [textResultsRaw, imageResultsRaw, videoResultsRaw] =
        await Promise.all([
          makeSearchRequest(
            searxngBaseUrl,
            query,
            'general',
            SEARXNG_CONFIG.engines,
            SEARXNG_CONFIG.deepSearchTextCount + 5, // Fetch extra to ensure target count after filtering
          ),
          makeSearchRequest(
            searxngBaseUrl,
            query,
            'images',
            SEARXNG_CONFIG.imageEngines,
            SEARXNG_CONFIG.deepSearchImageCount + 10, // Fetch extra to account for filtering
          ),
          makeSearchRequest(
            searxngBaseUrl,
            query,
            'videos',
            SEARXNG_CONFIG.videoEngines,
            SEARXNG_CONFIG.deepSearchVideoCount + 10, // Fetch extra to account for filtering
          ),
        ]);

      // Process results into standardized format
      const textResults = processTextResults(textResultsRaw);
      const imageResults = processImageResults(imageResultsRaw);
      const videoResults = processVideoResults(videoResultsRaw);

      // For deep search, provide comprehensive coverage with EXACT counts
      const combinedResults: SearchResult[] = [];

      // Include EXACTLY 20 text sources for deep analysis (20-25 paragraph requirement)
      const textResultsToInclude = Math.min(
        SEARXNG_CONFIG.deepSearchTextCount,
        textResults.length,
      );
      combinedResults.push(...textResults.slice(0, textResultsToInclude));

      // Add EXACTLY 20 images for deep search (user requirement)
      const maxImages = Math.min(
        SEARXNG_CONFIG.deepSearchImageCount,
        imageResults.length,
      );
      combinedResults.push(...imageResults.slice(0, maxImages));

      // Add EXACTLY 20 videos for deep search (user requirement)
      const maxVideos = Math.min(
        SEARXNG_CONFIG.deepSearchVideoCount,
        videoResults.length,
      );
      combinedResults.push(...videoResults.slice(0, maxVideos));

      console.log(
        `🔍 Deep search found ${textResults.length} text results, ${imageResults.length} image results, and ${videoResults.length} video results, returning EXACTLY ${combinedResults.length} comprehensive results (${textResultsToInclude} texts, ${maxImages} images, ${maxVideos} videos) for deep analysis`,
      );

      if (combinedResults.length === 0) {
        console.log(
          `⚠️ No usable results found from deep search for "${query}"`,
        );
        return [];
      }

      // Deep search MUST return comprehensive results to support 20-25 paragraph responses
      if (textResultsToInclude < 10) {
        console.warn(
          `⚠️ Deep search only found ${textResultsToInclude} text sources, may impact response quality`,
        );
      }

      return combinedResults;
    } catch (error: any) {
      console.error(
        `❌ Deep search error (attempt ${attempt + 1}/${SEARXNG_CONFIG.retryCount}):`,
        error.message,
      );
      lastError = error;

      // If this is the last attempt, continue to the error handling below
      if (attempt === SEARXNG_CONFIG.retryCount - 1) {
        break;
      }

      // If the error is an AbortError (timeout), try with increased timeout for deep search
      if (error.name === 'AbortError') {
        SEARXNG_CONFIG.timeout += 10000; // Increase timeout more for deep search
        console.log(
          `⏱️ Increased deep search timeout to ${SEARXNG_CONFIG.timeout}ms for next attempt`,
        );
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw (
    lastError ||
    new Error('Failed to fetch deep search results after multiple attempts')
  );
}
