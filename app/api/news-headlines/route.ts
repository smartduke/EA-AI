import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import RSS from 'rss-parser';

const rssParser = new RSS();

// Country code to Google News region mapping
const COUNTRY_REGION_MAP: Record<
  string,
  { gl: string; hl: string; ceid: string }
> = {
  US: { gl: 'US', hl: 'en-US', ceid: 'US:en' },
  GB: { gl: 'GB', hl: 'en-GB', ceid: 'GB:en' },
  CA: { gl: 'CA', hl: 'en-CA', ceid: 'CA:en' },
  AU: { gl: 'AU', hl: 'en-AU', ceid: 'AU:en' },
  IN: { gl: 'IN', hl: 'en-IN', ceid: 'IN:en' },
  DE: { gl: 'DE', hl: 'de-DE', ceid: 'DE:de' },
  FR: { gl: 'FR', hl: 'fr-FR', ceid: 'FR:fr' },
  ES: { gl: 'ES', hl: 'es-ES', ceid: 'ES:es' },
  IT: { gl: 'IT', hl: 'it-IT', ceid: 'IT:it' },
  JP: { gl: 'JP', hl: 'ja-JP', ceid: 'JP:ja' },
  KR: { gl: 'KR', hl: 'ko-KR', ceid: 'KR:ko' },
  CN: { gl: 'CN', hl: 'zh-CN', ceid: 'CN:zh-Hans' },
  BR: { gl: 'BR', hl: 'pt-BR', ceid: 'BR:pt-419' },
  MX: { gl: 'MX', hl: 'es-MX', ceid: 'MX:es-419' },
  RU: { gl: 'RU', hl: 'ru-RU', ceid: 'RU:ru' },
  NL: { gl: 'NL', hl: 'nl-NL', ceid: 'NL:nl' },
  SE: { gl: 'SE', hl: 'sv-SE', ceid: 'SE:sv' },
  NO: { gl: 'NO', hl: 'no-NO', ceid: 'NO:no' },
  DK: { gl: 'DK', hl: 'da-DK', ceid: 'DK:da' },
  FI: { gl: 'FI', hl: 'fi-FI', ceid: 'FI:fi' },
  BE: { gl: 'BE', hl: 'nl-BE', ceid: 'BE:nl' },
  CH: { gl: 'CH', hl: 'de-CH', ceid: 'CH:de' },
  AT: { gl: 'AT', hl: 'de-AT', ceid: 'AT:de' },
  IE: { gl: 'IE', hl: 'en-IE', ceid: 'IE:en' },
  NZ: { gl: 'NZ', hl: 'en-NZ', ceid: 'NZ:en' },
  ZA: { gl: 'ZA', hl: 'en-ZA', ceid: 'ZA:en' },
  SG: { gl: 'SG', hl: 'en-SG', ceid: 'SG:en' },
  HK: { gl: 'HK', hl: 'zh-HK', ceid: 'HK:zh-Hant' },
  TW: { gl: 'TW', hl: 'zh-TW', ceid: 'TW:zh-Hant' },
};

// Google News topic IDs for different categories
const GOOGLE_NEWS_TOPICS: Record<string, string> = {
  LOCAL: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB', // Top stories/Local
  COUNTRY: 'CAAqJQgKIh9DQkFTRVFvSUwyMHZNRE55YXpBU0JXVnVMVWRDS0FBUAE', // India country-specific
  WORLD: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB', // World/International
  BUSINESS: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB', // Business
  TECHNOLOGY: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB', // Technology
  ENTERTAINMENT: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB', // Entertainment
  SCIENCE: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB', // Science
  SPORTS: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB', // Sports
  HEALTH: 'CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ', // Health
};

// Default RSS feeds for each category
const DEFAULT_RSS_FEEDS: Record<string, string> = {
  LOCAL:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
  COUNTRY:
    'https://news.google.com/rss/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNRE55YXpBU0JXVnVMVWRDS0FBUAE?hl=en-US&gl=US&ceid=US:en',
  WORLD:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
  BUSINESS:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
  TECHNOLOGY:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
  ENTERTAINMENT:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
  SCIENCE:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
  SPORTS:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
  HEALTH:
    'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en',
};

// Cache for headlines (1 hour cache)
const headlinesCache = new Map<
  string,
  { headlines: any[]; timestamp: number }
>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface HeadlineType {
  heading: string;
  message: string;
  pubDate: string;
  link: string;
}

// Function to log RSS feed info
function logRSSFeedInfo(category: string, countryCode: string, rssUrl: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📡 RSS FEED INFO`);
  console.log(`   Category: ${category}`);
  console.log(`   Country: ${countryCode}`);
  console.log(`   RSS URL: ${rssUrl}`);
  console.log('='.repeat(80));
}

// Function to build city-specific RSS URL
function buildCityRSSUrl(city: string, countryCode: string): string {
  const regionConfig = COUNTRY_REGION_MAP[countryCode] || COUNTRY_REGION_MAP.US;

  // Use Google News geo location RSS endpoint for city-specific news
  const cityParam = encodeURIComponent(city);
  const rssUrl = `https://news.google.com/rss/headlines/section/geo/${cityParam}?hl=${regionConfig.hl}&gl=${regionConfig.gl}&ceid=${regionConfig.ceid}`;

  console.log(`🏙️ Built city-specific RSS URL for ${city}, ${countryCode}:`);
  console.log(`   City: ${city}`);
  console.log(
    `   Region: hl=${regionConfig.hl}, gl=${regionConfig.gl}, ceid=${regionConfig.ceid}`,
  );
  console.log(`   RSS URL: ${rssUrl}`);

  return rssUrl;
}

// Function to build country-specific RSS URL (different from city-specific and world)
function buildCountryRSSUrl(countryCode: string): string {
  const regionConfig = COUNTRY_REGION_MAP[countryCode] || COUNTRY_REGION_MAP.US;

  // Use country-specific RSS URL format for top stories in that country
  const rssUrl = `https://news.google.com/rss?hl=${regionConfig.hl}&gl=${regionConfig.gl}&ceid=${regionConfig.ceid}`;

  console.log(`🏳️ Built country-specific RSS URL for ${countryCode}:`);
  console.log(
    `   Region: hl=${regionConfig.hl}, gl=${regionConfig.gl}, ceid=${regionConfig.ceid}`,
  );
  console.log(`   RSS URL: ${rssUrl}`);

  return rssUrl;
}

// Function to get RSS URL for a category and location
function getRSSUrl(
  category: string,
  countryCode = 'US',
  city?: string,
): string {
  const envVar = `RSS_URL_${category}`;
  const envUrl = process.env[envVar];

  if (envUrl) {
    console.log(`📰 Using ENV RSS URL for ${category}: ${envUrl}`);
    return envUrl;
  }

  // For LOCAL category, try to use city-specific feed if city is available
  if (category === 'LOCAL' && city) {
    return buildCityRSSUrl(city, countryCode);
  }

  // For COUNTRY category, use country-specific RSS feed (not topic-based)
  if (category === 'COUNTRY') {
    return buildCountryRSSUrl(countryCode);
  }

  // For all other categories, use country-level topic feeds
  return buildLocationRSSUrl(category, countryCode);
}

// Function to build location-specific RSS URL
function buildLocationRSSUrl(category: string, countryCode: string): string {
  const topicId = GOOGLE_NEWS_TOPICS[category];
  const regionConfig = COUNTRY_REGION_MAP[countryCode] || COUNTRY_REGION_MAP.US;

  if (!topicId) {
    return DEFAULT_RSS_FEEDS[category] || DEFAULT_RSS_FEEDS.LOCAL;
  }

  const rssUrl = `https://news.google.com/rss/topics/${topicId}?hl=${regionConfig.hl}&gl=${regionConfig.gl}&ceid=${regionConfig.ceid}`;

  console.log(
    `🔗 Built location-specific RSS URL for ${category} in ${countryCode}:`,
  );
  console.log(`   Topic ID: ${topicId}`);
  console.log(
    `   Region: hl=${regionConfig.hl}, gl=${regionConfig.gl}, ceid=${regionConfig.ceid}`,
  );

  return rssUrl;
}

// Function to get country code from various inputs
function getCountryCode(country?: string | null): string {
  if (!country) return 'US';

  // Convert country name to country code
  const countryNameMap: Record<string, string> = {
    'united states': 'US',
    'united kingdom': 'GB',
    'great britain': 'GB',
    canada: 'CA',
    australia: 'AU',
    india: 'IN',
    germany: 'DE',
    france: 'FR',
    spain: 'ES',
    italy: 'IT',
    japan: 'JP',
    'south korea': 'KR',
    china: 'CN',
    brazil: 'BR',
    mexico: 'MX',
    russia: 'RU',
    netherlands: 'NL',
    sweden: 'SE',
    norway: 'NO',
    denmark: 'DK',
    finland: 'FI',
    belgium: 'BE',
    switzerland: 'CH',
    austria: 'AT',
    ireland: 'IE',
    'new zealand': 'NZ',
    'south africa': 'ZA',
    singapore: 'SG',
    'hong kong': 'HK',
    taiwan: 'TW',
  };

  const normalizedCountry = country.toLowerCase().trim();

  // First check if it's already a country code
  if (country.length === 2 && COUNTRY_REGION_MAP[country.toUpperCase()]) {
    return country.toUpperCase();
  }

  // Then check country name mapping
  if (countryNameMap[normalizedCountry]) {
    return countryNameMap[normalizedCountry];
  }

  // Fallback to US
  return 'US';
}

// Function to clean up headlines by removing source names
function cleanHeadline(title: string): string {
  if (!title) return 'No title';

  // Remove common source patterns at the end of headlines
  const cleaned = title
    // Remove " - Source Name" patterns
    .replace(/\s*-\s*[A-Za-z\s&\.]+$/g, '')
    // Remove " | Source Name" patterns
    .replace(/\s*\|\s*[A-Za-z\s&\.]+$/g, '')
    // Remove " (Source)" patterns
    .replace(/\s*\([A-Za-z\s&\.]+\)$/g, '')
    // Remove common news source suffixes
    .replace(
      /\s*-\s*(CNN|BBC|Reuters|AP|Associated Press|Fox News|NBC|CBS|ABC|The Guardian|The Times|USA Today|Yahoo|MSN|Google News).*$/gi,
      '',
    )
    .trim();

  return cleaned || title; // Return original if cleaning resulted in empty string
}

// Function to parse RSS feed and extract headlines
async function fetchRSSHeadlines(
  category: string,
  countryCode = 'US',
  city?: string,
): Promise<HeadlineType[]> {
  try {
    const rssUrl = getRSSUrl(category, countryCode, city);

    // Enhanced RSS feed logging
    logRSSFeedInfo(category, countryCode, rssUrl);

    const feed = await rssParser.parseURL(rssUrl);
    console.log(
      `✅ Feed for ${category} (${countryCode}) - Title: ${feed.title}, Items count: ${feed.items?.length || 0}`,
    );

    if (!feed.items || feed.items.length === 0) {
      console.log(
        `❌ No items found in RSS feed for ${category} in ${countryCode}`,
      );
      return [];
    }

    const headlines = feed.items.slice(0, 6).map((item: any, index: number) => {
      const originalTitle = item.title || 'No title';
      const cleanedTitle = cleanHeadline(originalTitle);

      console.log(`📰 ${category} (${countryCode}) Item ${index + 1}:`, {
        original: `${originalTitle.substring(0, 50)}...`,
        cleaned: `${cleanedTitle.substring(0, 50)}...`,
        hasTitle: !!item.title,
        hasLink: !!item.link,
        hasPubDate: !!item.pubDate,
      });

      return {
        heading: cleanedTitle,
        message: cleanedTitle,
        pubDate: item.pubDate || new Date().toISOString(),
        link: item.link || '#',
      };
    });

    console.log(
      `✅ Successfully processed ${headlines.length} headlines for ${category} in ${countryCode}`,
    );
    console.log(`${'='.repeat(80)}\n`);
    return headlines;
  } catch (error) {
    console.error(
      `❌ Error fetching RSS for ${category} in ${countryCode}:`,
      error,
    );
    console.log(`${'='.repeat(80)}\n`);
    return [];
  }
}

// Function to enhance headlines with AI (if enabled)
async function enhanceHeadlines(
  headlines: HeadlineType[],
): Promise<HeadlineType[]> {
  const enhanceEnabled = process.env.ENHANCE_HEADLINES === 'true';

  if (!enhanceEnabled || !process.env.OPENAI_API_KEY) {
    console.log('AI headline enhancement disabled or no API key');
    return headlines;
  }

  try {
    console.log(`Enhancing ${headlines.length} headlines with AI...`);

    // Process headlines in batches of 5 to avoid token limits
    const batchSize = 5;
    const enhancedHeadlines: HeadlineType[] = [];

    for (let i = 0; i < headlines.length; i += batchSize) {
      const batch = headlines.slice(i, i + batchSize);
      const originalHeadlines = batch.map((h) => h.heading);

      const headlinesList = originalHeadlines
        .map((h, idx) => `${idx + 1}. ${h}`)
        .join('\n');

      const prompt = `You are an expert news headline writer. Your task is to rewrite these news headlines to be more engaging and clickable while preserving their original meaning and factual accuracy. Make them more compelling but not sensationalized.

Original headlines:
${headlinesList}

Please provide enhanced versions that are:
- More engaging and interesting
- Factually accurate to the original
- Not misleading or sensationalized
- Similar length to the original
- Professional and news-appropriate

Return only the enhanced headlines, numbered 1-${originalHeadlines.length}, one per line.`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are a professional news headline editor. Enhance headlines to be more engaging while maintaining accuracy.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        },
      );

      if (!response.ok) {
        console.error(
          'OpenAI API error:',
          response.status,
          response.statusText,
        );
        enhancedHeadlines.push(...batch); // Fall back to original headlines
        continue;
      }

      const data = await response.json();
      const enhancedText = data.choices[0]?.message?.content;

      if (enhancedText) {
        const enhancedLines = enhancedText
          .split('\n')
          .filter((line: string) => line.trim());

        batch.forEach((headline, idx) => {
          const enhancedLine = enhancedLines[idx];
          if (enhancedLine) {
            // Remove numbering (e.g., "1. ", "2. ") from the response
            const enhancedHeading = enhancedLine
              .replace(/^\d+\.\s*/, '')
              .trim();
            enhancedHeadlines.push({
              ...headline,
              heading: enhancedHeading || headline.heading,
            });
          } else {
            enhancedHeadlines.push(headline); // Fall back to original
          }
        });

        console.log(
          `Enhanced batch ${Math.floor(i / batchSize) + 1} successfully`,
        );
      } else {
        enhancedHeadlines.push(...batch); // Fall back to original headlines
      }

      // Small delay between API calls to respect rate limits
      if (i + batchSize < headlines.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`Successfully enhanced ${enhancedHeadlines.length} headlines`);
    return enhancedHeadlines;
  } catch (error) {
    console.error('Error enhancing headlines:', error);
    return headlines; // Fall back to original headlines on any error
  }
}

// Function to list all RSS feeds for all categories
function logAllRSSFeeds() {
  console.log(`\n${'='.repeat(100)}`);
  console.log('🌍 ALL RSS FEEDS CURRENTLY CONFIGURED 🌍');
  console.log(`${'='.repeat(100)}`);

  console.log('\n📂 DEFAULT RSS FEEDS BY CATEGORY:');
  Object.entries(DEFAULT_RSS_FEEDS).forEach(([category, url]) => {
    console.log(`\n🔗 ${category}:`);
    console.log(`   ${url}`);
  });

  console.log('\n📋 ENVIRONMENT VARIABLE OVERRIDES:');
  Object.keys(DEFAULT_RSS_FEEDS).forEach((category) => {
    const envVar = `RSS_URL_${category}`;
    const envUrl = process.env[envVar];
    if (envUrl) {
      console.log(`🌟 ${envVar}: ${envUrl}`);
    }
  });

  console.log(`\n${'='.repeat(100)}\n`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'LOCAL';
  const country = searchParams.get('country');
  const city = searchParams.get('city'); // Add city parameter support
  const showAllFeeds = searchParams.get('showAllFeeds') === 'true';
  const clearCache = searchParams.get('clearCache') === 'true';
  const showFeeds = searchParams.get('showFeeds') === 'true';

  console.log(
    `🌍 Request for ${category} headlines in country: ${country || 'US'}${city ? `, city: ${city}` : ''} (code: ${getCountryCode(country)})`,
  );

  // Clear cache if requested
  if (clearCache) {
    headlinesCache.clear();
    console.log('🗑️ Cache cleared');
  }

  // Show all RSS feeds if requested
  if (showAllFeeds) {
    logAllRSSFeeds();
  }

  try {
    const countryCode = getCountryCode(country);
    const cacheKey = `${category}-${countryCode}${city ? `-${city}` : ''}`;

    // Check cache first
    const cached = headlinesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(
        `Serving cached headlines for ${category} in ${countryCode}${city ? ` (${city})` : ''} (${cached.headlines.length} items)`,
      );
      return NextResponse.json({ headlines: cached.headlines });
    }

    console.log(
      `🔄 Fetching fresh headlines for ${category} in ${countryCode}${city ? ` (${city})` : ''}...`,
    );

    // Fetch headlines with city support
    let headlines = await fetchRSSHeadlines(
      category,
      countryCode,
      city || undefined,
    );

    // Enhance headlines if enabled
    const enhanceHeadlinesParam = process.env.ENHANCE_HEADLINES;
    const shouldEnhanceHeadlines = enhanceHeadlinesParam === 'true';

    if (shouldEnhanceHeadlines && headlines.length > 0) {
      console.log(`🔄 Enhancing ${headlines.length} headlines using AI...`);
      try {
        headlines = await enhanceHeadlines(headlines);
        console.log('✅ Headlines enhanced successfully');
      } catch (enhanceError) {
        console.error('❌ Error enhancing headlines:', enhanceError);
        // Continue with original headlines if enhancement fails
      }
    }

    // Cache the results with location info
    headlinesCache.set(cacheKey, {
      headlines,
      timestamp: Date.now(),
    });

    console.log(
      `Returning ${headlines.length} headlines for ${category} in ${countryCode}${city ? ` (${city})` : ''}`,
    );
    return NextResponse.json({ headlines });
  } catch (error) {
    console.error(`Error fetching headlines for ${category}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch headlines' },
      { status: 500 },
    );
  }
}
