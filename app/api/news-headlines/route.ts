import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import RSS from 'rss-parser';

const rssParser = new RSS();

// Default RSS feeds for each category
const DEFAULT_RSS_FEEDS: Record<string, string> = {
  LOCAL:
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
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

// Function to get RSS URL for a category
function getRSSUrl(category: string): string {
  const envVar = `RSS_URL_${category}`;
  return (
    process.env[envVar] ||
    DEFAULT_RSS_FEEDS[category] ||
    DEFAULT_RSS_FEEDS.LOCAL
  );
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
async function fetchRSSHeadlines(category: string): Promise<HeadlineType[]> {
  try {
    const rssUrl = getRSSUrl(category);
    console.log(`Fetching RSS for ${category}: ${rssUrl}`);

    const feed = await rssParser.parseURL(rssUrl);
    console.log(
      `Feed for ${category} - Title: ${feed.title}, Items count: ${feed.items?.length || 0}`,
    );

    if (!feed.items || feed.items.length === 0) {
      console.log(`No items found in RSS feed for ${category}`);
      return [];
    }

    const headlines = feed.items.slice(0, 6).map((item: any, index: number) => {
      const originalTitle = item.title || 'No title';
      const cleanedTitle = cleanHeadline(originalTitle);

      console.log(`${category} Item ${index}:`, {
        original: `${originalTitle.substring(0, 50)}...`,
        cleaned: `${cleanedTitle.substring(0, 50)}...`,
        hasTitle: !!item.title,
        hasLink: !!item.link,
        hasPubDate: !!item.pubDate,
      });

      return {
        heading: cleanedTitle,
        message: `Tell me more about: ${cleanedTitle}`,
        pubDate: item.pubDate || new Date().toISOString(),
        link: item.link || '#',
      };
    });

    console.log(
      `Successfully processed ${headlines.length} headlines for ${category}`,
    );
    return headlines;
  } catch (error) {
    console.error(`Error fetching RSS for ${category}:`, error);
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

      const prompt = `You are an expert news headline writer. Your task is to rewrite these news headlines to be more engaging and clickable while preserving their original meaning and factual accuracy. Make them more compelling but not sensationalized.

Original headlines:
${originalHeadlines.map((h, idx) => `${idx + 1}. ${h}`).join('\n')}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.toUpperCase() || 'LOCAL';
    const clearCache = searchParams.get('clearCache') === 'true';

    // Clear all cache to show cleaned headlines immediately
    if (clearCache) {
      headlinesCache.clear();
      console.log('Cleared all headlines cache');
    }

    // Check cache first (unless clearCache is requested)
    const cacheKey = category;
    const cachedData = headlinesCache.get(cacheKey);

    if (
      !clearCache &&
      cachedData &&
      Date.now() - cachedData.timestamp < CACHE_DURATION
    ) {
      console.log(
        `Serving cached headlines for ${category} (${cachedData.headlines.length} items)`,
      );
      return NextResponse.json({ headlines: cachedData.headlines });
    }

    // Force clear cache for Entertainment and Science if they have empty results
    if (
      (category === 'ENTERTAINMENT' || category === 'SCIENCE') &&
      cachedData?.headlines?.length === 0
    ) {
      console.log(`Clearing empty cache for ${category}`);
      headlinesCache.delete(cacheKey);
    }

    // Fetch fresh headlines
    console.log(`Fetching fresh headlines for ${category}`);
    let headlines = await fetchRSSHeadlines(category);

    // Enhance headlines if enabled
    headlines = await enhanceHeadlines(headlines);

    // Cache the results
    headlinesCache.set(cacheKey, {
      headlines,
      timestamp: Date.now(),
    });

    console.log(`Returning ${headlines.length} headlines for ${category}`);
    return NextResponse.json({ headlines });
  } catch (error) {
    console.error('Error in news-headlines API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch headlines' },
      { status: 500 },
    );
  }
}
