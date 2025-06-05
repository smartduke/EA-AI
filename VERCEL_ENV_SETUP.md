# Vercel Environment Variables Setup

## Required Environment Variables for Consistent Search Behavior

To ensure your InfoxAI application works consistently between local development and Vercel production, you need to set the following environment variables in your Vercel dashboard.

### Core Search Configuration

```bash
# SearXNG Configuration
SEARXNG_URL=https://searx.be
SEARXNG_HOST=searx.be
SEARXNG_TIMEOUT=20000
SEARXNG_ENGINES=google,bing,brave,duckduckgo,wikipedia
SEARXNG_IMAGE_ENGINES=google_images,bing_images
SEARXNG_VIDEO_ENGINES=youtube,google_videos
SEARXNG_CATEGORIES=general,science,news
SEARXNG_LANGUAGE=all

# Regular Search Limits (Search Mode)
SEARXNG_RESULTS_COUNT=8
SEARXNG_IMAGE_RESULTS_COUNT=10
SEARXNG_VIDEO_RESULTS_COUNT=10

# Deep Search Limits (Deep Search Mode)
SEARXNG_DEEP_TEXT_COUNT=20
SEARXNG_DEEP_IMAGE_COUNT=20
SEARXNG_DEEP_VIDEO_COUNT=20

# Retry and Performance
SEARXNG_RETRY_COUNT=3
SEARXNG_RETRY_DELAY=2000
SEARXNG_TOTAL_RESULTS_LIMIT=60
```

### How to Set These in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable listed above

### Expected Behavior

With these variables properly set:

#### Search Mode (Regular)
- **AI Response**: 3-4 paragraphs 
- **Web Sources**: 8 sources maximum
- **Images**: 10 images maximum  
- **Videos**: 10 videos maximum

#### Deep Search Mode
- **AI Response**: 20-25 paragraphs (comprehensive analysis)
- **Web Sources**: 20 sources maximum
- **Images**: 20 images maximum
- **Videos**: 20 videos maximum

### Troubleshooting

If you're still experiencing inconsistent behavior:

1. **Check Vercel Function Logs**: Look for timeout or error messages
2. **Verify SearXNG Instance**: Ensure `https://searx.be` is accessible
3. **Monitor Function Duration**: Deep search operations now have 120 seconds timeout
4. **Check Network Issues**: Vercel's serverless functions may have different network characteristics

### Testing the Configuration

After setting these variables, redeploy your application and test:

1. Try a regular search - should return ~3-4 paragraphs with 8 sources
2. Try a deep search - should return ~20-25 paragraphs with 20 sources each of text, images, and videos

### Alternative SearXNG Instances

If `searx.be` is unreliable, you can try these alternatives:

```bash
SEARXNG_URL=https://search.sapti.me
# or
SEARXNG_URL=https://searx.fmac.xyz
# or  
SEARXNG_URL=https://searx.prvcy.eu
```

Test each instance to see which provides the most consistent results in your region. 