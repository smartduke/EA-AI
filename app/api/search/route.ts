import { type NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';

// Secret key for generating image proxy hashes
// In production, use a secure environment variable
const SECRET_KEY =
  process.env.IMAGE_PROXY_SECRET || 'infoxai-secure-image-proxy';

// Generate a secure image proxy URL
function getProxiedImageUrl(originalUrl: string): string {
  // Generate HMAC hash for security verification
  const hash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(originalUrl)
    .digest('hex');

  // Create the proxied URL with the hash for verification - use absolute path
  return `/api/image_proxy?url=${encodeURIComponent(originalUrl)}&h=${hash}`;
}

// Extract domain name from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    // Remove www. prefix if present
    domain = domain.replace(/^www\./, '');
    return domain;
  } catch (e) {
    return 'unknown';
  }
}

// Generate favicon URL from domain
function getFaviconUrl(domain: string): string {
  // Use Google's favicon service for better reliability
  return getProxiedImageUrl(
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  );
}

// SearXNG Configuration - Using the same config as in web-search.ts
const SEARXNG_CONFIG = {
  host: process.env.SEARXNG_HOST || 'searx.be',
  baseUrl: process.env.SEARXNG_URL || 'https://searx.be',
  timeout: Number.parseInt(process.env.SEARXNG_TIMEOUT || '15000'),
  engines: (
    process.env.SEARXNG_ENGINES || 'google_news,bing_news,brave,duckduckgo_news'
  ).split(','),
  categories: ['news'],
  language: process.env.SEARXNG_LANGUAGE || 'all',
  format: 'html',
  resultsCount: Number.parseInt(process.env.SEARXNG_RESULTS_COUNT || '5'),
  retryCount: Number.parseInt(process.env.SEARXNG_RETRY_COUNT || '2'),
  retryDelay: Number.parseInt(process.env.SEARXNG_RETRY_DELAY || '2000'),
};

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  domain?: string; // Domain name of the source
  favicon?: string; // Favicon URL for the source website
  imageUrl?: string; // Keep this for backward compatibility
}

// Fallback news data organized by country
const FALLBACK_NEWS: Record<string, SearchResult[]> = {
  India: [
    {
      title:
        "India's Space Program Achieves New Milestone with Mars Mission Success",
      snippet:
        'The Indian Space Research Organization (ISRO) successfully completed its second Mars mission, establishing a new research station.',
      url: 'https://www.thehindu.com/sci-tech/science/india-space-news',
      source: 'fallback',
      domain: 'thehindu.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=thehindu.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'New High-Speed Rail Line Connects Delhi to Mumbai in Record Time',
      snippet:
        'The bullet train project has finally been completed, reducing travel time between the two major cities to just 3 hours.',
      url: 'https://indianexpress.com/article/india/rail-news',
      source: 'fallback',
      domain: 'indianexpress.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=indianexpress.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1540961016486-0ce04bef3b61?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'India GDP Growth Reaches 7.8%, Highest in Five Years',
      snippet:
        'Economic experts attribute the growth to technology sector expansion and manufacturing investments.',
      url: 'https://economictimes.indiatimes.com/news/economy/india-economy-news',
      source: 'fallback',
      domain: 'economictimes.indiatimes.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=economictimes.indiatimes.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1542728109-15dac07bd87b?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Mumbai Hosts International Film Festival with Record Attendance',
      snippet:
        'The film festival attracted celebrities and filmmakers from around the globe, showcasing over 200 films.',
      url: 'https://timesofindia.indiatimes.com/entertainment/india-film-news',
      source: 'fallback',
      domain: 'timesofindia.indiatimes.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=timesofindia.indiatimes.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1626704348629-e4179eb9032f?q=80&w=1000&auto=format&fit=crop',
    },
  ],
  default: [
    {
      title: 'Global Climate Summit Reaches Historic Agreement on Emissions',
      snippet:
        'Over 190 countries have signed the new climate accord, pledging to reach carbon neutrality by 2050.',
      url: 'https://www.bbc.com/news/climate-news',
      source: 'fallback',
      domain: 'bbc.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=bbc.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1532947974358-a218d18d8d14?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Breakthrough in Quantum Computing Announced by Research Team',
      snippet:
        'Scientists have achieved quantum supremacy with a new 1000-qubit processor, solving previously impossible problems.',
      url: 'https://www.wired.com/tech-news',
      source: 'fallback',
      domain: 'wired.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=wired.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1629654291663-b91ad427698f?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Global Economy Shows Signs of Recovery After Pandemic',
      snippet:
        'IMF reports indicate stronger than expected growth across major economies as supply chains normalize.',
      url: 'https://www.economist.com/economy-news',
      source: 'fallback',
      domain: 'economist.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=economist.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title:
        'Renewable Energy Installations Surpass Fossil Fuels for First Time',
      snippet:
        'Solar and wind power now account for over 50% of new electricity generation capacity worldwide.',
      url: 'https://www.theguardian.com/energy-news',
      source: 'fallback',
      domain: 'theguardian.com',
      favicon: getProxiedImageUrl(
        'https://www.google.com/s2/favicons?domain=theguardian.com&sz=128',
      ),
      imageUrl:
        'https://images.unsplash.com/photo-1509391618207-32f1db0bd0f6?q=80&w=1000&auto=format&fit=crop',
    },
  ],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'trending news';
  const category = searchParams.get('category') || 'news';

  // Extract country from query for potential fallback
  const countryMatch = query.match(
    /^(India|United States|UK|Japan|Australia|Canada|Germany|France|Spain|Brazil|Mexico)/i,
  );
  const country = countryMatch ? countryMatch[1] : null;

  try {
    // Add category to search query for better results
    const searchQuery = category === 'news' ? `${query} news` : query;
    const results = await fetchFromSearxNG(searchQuery);

    // If results are empty but we have a fallback for this country, use it
    if (results.length === 0 && country && FALLBACK_NEWS[country]) {
      console.log(`Using fallback news for ${country}`);
      return NextResponse.json({
        results: FALLBACK_NEWS[country],
        query,
        timestamp: new Date().toISOString(),
        message: `Using fallback news for ${country}`,
        isUsingFallback: true,
      });
    } else if (results.length === 0) {
      // Use default fallback if no country-specific fallback is available
      console.log('Using default fallback news');
      return NextResponse.json({
        results: FALLBACK_NEWS.default,
        query,
        timestamp: new Date().toISOString(),
        message: `Using default fallback news`,
        isUsingFallback: true,
      });
    }

    return NextResponse.json({
      results,
      query,
      timestamp: new Date().toISOString(),
      message:
        results.length > 0
          ? `Found ${results.length} results for "${query}"`
          : `No results found for "${query}"`,
    });
  } catch (error: any) {
    console.error(`❌ Search API error:`, error);

    // Use fallback news based on country in query or default
    const fallbackNews =
      (country && FALLBACK_NEWS[country]) || FALLBACK_NEWS.default;
    console.log(
      `Error occurred, using fallback news (${country || 'default'})`,
    );

    return NextResponse.json({
      results: fallbackNews,
      query,
      timestamp: new Date().toISOString(),
      error: error?.message || 'An error occurred during the search',
      message: `Using fallback news due to error: ${error?.message || 'An unknown error occurred'}.`,
      isUsingFallback: true,
    });
  }
}

/**
 * Fetches search results from SearXNG
 */
async function fetchFromSearxNG(query: string): Promise<SearchResult[]> {
  const searxngBaseUrl = SEARXNG_CONFIG.baseUrl;
  let lastError = null;

  // Implement retry logic
  for (let attempt = 0; attempt < SEARXNG_CONFIG.retryCount; attempt++) {
    try {
      // If not the first attempt, wait before retrying
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, SEARXNG_CONFIG.retryDelay),
        );
        console.log(`🔄 Retry attempt ${attempt + 1} for search: "${query}"`);
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
      const $ = cheerio.load(html);
      const results: SearchResult[] = [];

      // Extract results from the HTML
      $('.result').each((_: number, element) => {
        const $element = $(element);
        // Updated selectors to match SearXNG's HTML structure
        const titleElement = $element.find('h3 a');
        const snippetElement = $element.find('.content');
        const urlElement = $element.find('.url');
        const engineElement = $element.find('.engine');
        const imageElement = $element.find('img');

        if (titleElement.length) {
          const title = titleElement.text().trim();
          const url = titleElement.attr('href') || urlElement.text().trim();
          const snippet = snippetElement.text().trim();
          const source = engineElement.text().trim();
          // Extract image URL if present
          let imageUrl = imageElement.attr('src') || '';

          // Only use real image URLs (avoid icons/placeholders)
          if (
            imageUrl &&
            (imageUrl.startsWith('data:') ||
              imageUrl.includes('favicon') ||
              imageUrl.length < 20)
          ) {
            imageUrl = '';
          }

          // Use original image URL directly instead of proxying
          // Note: Keep favicon proxying for security and reliability

          if (title && url) {
            // Extract domain from URL
            const domain = extractDomain(url);

            results.push({
              title: title || 'Untitled',
              snippet: snippet || 'No description available',
              url: url,
              source: source || 'news',
              domain: domain,
              favicon: getFaviconUrl(domain),
              imageUrl: imageUrl || '',
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
    }
  }

  throw (
    lastError ||
    new Error('Failed to fetch search results after multiple attempts')
  );
}
