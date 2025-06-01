import { NextResponse } from 'next/server';

interface HeadlineType {
  heading: string;
  message: string;
  pubDate: string;
  link: string;
}

// Function to enhance headlines with AI (same as in news-headlines API)
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
        enhancedHeadlines.push(...batch);
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
            const enhancedHeading = enhancedLine
              .replace(/^\d+\.\s*/, '')
              .trim();
            enhancedHeadlines.push({
              ...headline,
              heading: enhancedHeading || headline.heading,
            });
          } else {
            enhancedHeadlines.push(headline);
          }
        });

        console.log(
          `Enhanced batch ${Math.floor(i / batchSize) + 1} successfully`,
        );
      } else {
        enhancedHeadlines.push(...batch);
      }

      if (i + batchSize < headlines.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`Successfully enhanced ${enhancedHeadlines.length} headlines`);
    return enhancedHeadlines;
  } catch (error) {
    console.error('Error enhancing headlines:', error);
    return headlines;
  }
}

export async function GET() {
  try {
    // Sample headlines for testing
    const sampleHeadlines: HeadlineType[] = [
      {
        heading:
          'Study finds correlation between exercise and cognitive function',
        message: 'Tell me more about this study',
        pubDate: new Date().toISOString(),
        link: '#',
      },
      {
        heading: 'New AI model shows improved performance in language tasks',
        message: 'Tell me about this AI model',
        pubDate: new Date().toISOString(),
        link: '#',
      },
      {
        heading: 'Climate change report shows rising global temperatures',
        message: 'Tell me about climate change',
        pubDate: new Date().toISOString(),
        link: '#',
      },
    ];

    const originalHeadlines = sampleHeadlines.map((h) => h.heading);
    const enhancedHeadlines = await enhanceHeadlines(sampleHeadlines);

    const results = sampleHeadlines.map((original, index) => ({
      original: original.heading,
      enhanced: enhancedHeadlines[index]?.heading || original.heading,
    }));

    return NextResponse.json({
      results,
      enabled: process.env.ENHANCE_HEADLINES === 'true',
      apiKeySet: !!process.env.OPENAI_API_KEY,
      message: 'Headline enhancement test completed',
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 },
    );
  }
}
