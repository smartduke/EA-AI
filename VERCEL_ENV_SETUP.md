# Vercel Environment Variables Setup

## Required Environment Variables for Consistent Search Behavior

To ensure your InfoxAI application works consistently between local development and Vercel production, you need to set the following environment variables in your Vercel dashboard.

### Core Search Configuration

```bash
# SearXNG Configuration - Optimized for Vercel Hobby Plan (60s timeout)
SEARXNG_URL=https://searx.be
SEARXNG_HOST=searx.be
SEARXNG_TIMEOUT=8000
SEARXNG_ENGINES=google,bing,brave,duckduckgo,wikipedia
SEARXNG_IMAGE_ENGINES=google_images,bing_images
SEARXNG_VIDEO_ENGINES=youtube,google_videos
SEARXNG_CATEGORIES=general,science,news
SEARXNG_LANGUAGE=all

# Regular Search Limits (Search Mode)
SEARXNG_RESULTS_COUNT=8
SEARXNG_IMAGE_RESULTS_COUNT=10
SEARXNG_VIDEO_RESULTS_COUNT=10

# Deep Search Limits (Deep Search Mode) - Optimized for 60s timeout
SEARXNG_DEEP_TEXT_COUNT=15
SEARXNG_DEEP_IMAGE_COUNT=15
SEARXNG_DEEP_VIDEO_COUNT=15

# Retry and Performance - Aggressive settings for fast response
SEARXNG_RETRY_COUNT=2
SEARXNG_RETRY_DELAY=1000
SEARXNG_TOTAL_RESULTS_LIMIT=45
```

### Vercel Plan Limitations

**⚠️ IMPORTANT: Vercel Hobby Plan Limits**
- **Serverless Function Timeout**: 60 seconds maximum
- **Deep Search**: May need to be optimized to fit within this limit
- **Recommendation**: Consider upgrading to Pro plan ($20/month) for 300-second timeouts if you need full deep search capabilities

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
- **Timeout**: Well within 60 seconds

#### Deep Search Mode (Hobby Plan Optimized)
- **AI Response**: 15-20 paragraphs (reduced from 20-25 for speed)
- **Web Sources**: 15 sources maximum (reduced from 20)
- **Images**: 15 images maximum (reduced from 20)
- **Videos**: 15 videos maximum (reduced from 20)
- **Timeout**: Optimized to complete within 60 seconds

### Upgrading for Full Deep Search

To get the full deep search experience (20-25 paragraphs, 20 sources each):

1. **Upgrade to Vercel Pro Plan** ($20/month)
2. **Update Environment Variables** to full values:
   ```bash
   SEARXNG_TIMEOUT=15000
   SEARXNG_DEEP_TEXT_COUNT=20
   SEARXNG_DEEP_IMAGE_COUNT=20
   SEARXNG_DEEP_VIDEO_COUNT=20
   SEARXNG_RETRY_COUNT=3
   ```
3. **Update Chat API Timeout** in your code:
   ```typescript
   export const maxDuration = 120; // Only available on Pro plan
   ```

### Troubleshooting

If you're still experiencing inconsistent behavior:

1. **Check Vercel Function Logs**: Look for timeout or error messages
2. **Verify SearXNG Instance**: Ensure `https://searx.be` is accessible
3. **Monitor Function Duration**: Deep search operations now optimized for 60 seconds
4. **Check Network Issues**: Vercel's serverless functions may have different network characteristics

### Testing the Configuration

After setting these variables, redeploy your application and test:

1. Try a regular search - should return ~3-4 paragraphs with 8 sources
2. Try a deep search - should return ~15-20 paragraphs with 15 sources each (hobby plan) or 20-25 paragraphs with 20 sources each (pro plan)

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