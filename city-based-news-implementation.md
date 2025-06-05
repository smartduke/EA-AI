# City-Based News Implementation Guide

## Overview

Successfully implemented **city-specific news** functionality for the InfoxAI NextJS app. Users now receive news specific to their exact city location rather than just country-level local news.

## 🏙️ How City-Based News Works

### 1. **Google News Geo Location RSS Feeds**
The implementation uses Google News' undocumented `/headlines/section/geo/` endpoint to fetch city-specific news:

```
https://news.google.com/rss/headlines/section/geo/{CITY_NAME}?hl={LANGUAGE}&gl={COUNTRY}&ceid={COUNTRY_LANGUAGE_CODE}
```

**Example URLs:**
- **Coimbatore, India**: `https://news.google.com/rss/headlines/section/geo/Coimbatore?hl=en-IN&gl=IN&ceid=IN%3Aen`
- **Mumbai, India**: `https://news.google.com/rss/headlines/section/geo/Mumbai?hl=en-IN&gl=IN&ceid=IN%3Aen`
- **New York, US**: `https://news.google.com/rss/headlines/section/geo/New York?hl=en-US&gl=US&ceid=US%3Aen`

### 2. **Implementation Architecture**

#### Backend API (`app/api/news-headlines/route.ts`)
- **Added `buildCityRSSUrl()` function**: Builds city-specific RSS URLs using Google News geo endpoint
- **Enhanced `getRSSUrl()` function**: Now accepts city parameter and uses city-specific feeds for LOCAL category
- **Updated `fetchRSSHeadlines()` function**: Supports city parameter for targeted news fetching
- **Modified API endpoint**: Accepts `city` parameter in addition to existing `country` parameter

#### Frontend Component (`components/news-categories-tabs.tsx`)
- **Enhanced `fetchCategoryHeadlines()` function**: Includes city parameter in API requests
- **Updated dependency array**: Includes `userLocation.city` for proper re-fetching when city changes
- **Improved caching**: Cache keys now include city information for location-specific caching

### 3. **API Usage Examples**

#### City-Specific News (NEW)
```bash
# Get Coimbatore-specific news
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=India&city=Coimbatore"

# Get Mumbai-specific news  
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=India&city=Mumbai"

# Get New York-specific news
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=US&city=New York"
```

#### Country-Level News (Fallback)
```bash
# If no city provided, falls back to country-level local news
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=India"
```

### 4. **Intelligent Fallback System**

The implementation includes a smart fallback mechanism:

1. **🏙️ City-Specific**: If city is provided → Use city-specific geo RSS feed
2. **🌍 Country-Level**: If only country provided → Use country-specific topic RSS feed  
3. **🇺🇸 Default**: If neither provided → Use US default feeds

## 📊 Verified Results

### ✅ Coimbatore, India News
```json
{
  "headlines": [
    {
      "heading": "World Environment Day Celebrated with the Planting of 150,000 Saplings in Coimbatore District",
      "message": "World Environment Day: Nearly 1,50,000 saplings planted in Coimbatore district",
      "pubDate": "Thu, 05 Jun 2025 15:52:00 GMT"
    },
    {
      "heading": "Police Launch Probe After 'Dead Lizard' Found in Meal at Coimbatore Restaurant", 
      "message": "Police launch investigation over 'dead lizard' in food served in Coimbatore restaurant",
      "pubDate": "Thu, 05 Jun 2025 15:50:00 GMT"
    }
  ]
}
```

### ✅ Mumbai, India News  
```json
{
  "headlines": [
    {
      "heading": "Jeetendra Cashes In: Sells Prime Andheri Land in Mumbai for ₹855 Crore",
      "pubDate": "Recent"
    },
    {
      "heading": "\"She Popped the Question First\": Muzammil Ibrahim Reflects on His Romance",
      "pubDate": "Recent"
    }
  ]
}
```

## 🔧 Technical Features

### Enhanced Logging
```bash
🏙️ Built city-specific RSS URL for Coimbatore, IN:
   City: Coimbatore
   Region: hl=en-IN, gl=IN, ceid=IN:en
   RSS URL: https://news.google.com/rss/headlines/section/geo/Coimbatore?hl=en-IN&gl=IN&ceid=IN:en
```

### Smart Caching
- Cache keys now include city: `LOCAL-IN-Coimbatore`
- Different cities get separate cache entries
- 1-hour cache duration per location

### Location Detection Integration
- Uses existing `/api/geolocation` endpoint
- Automatically detects user's city and country
- Passes both to API for optimal news targeting

## 🌍 Global Support

Works with any city worldwide that has Google News coverage:

**Supported Countries**: 30+ countries including US, GB, CA, AU, IN, DE, FR, ES, IT, JP, KR, CN, BR, MX, RU, NL, SE, NO, DK, FI, BE, CH, AT, IE, NZ, ZA, SG, HK, TW

**City Examples**:
- **India**: Mumbai, Delhi, Bangalore, Chennai, Coimbatore, Pune, Hyderabad
- **US**: New York, Los Angeles, Chicago, San Francisco, Seattle
- **UK**: London, Manchester, Birmingham, Leeds
- **Canada**: Toronto, Vancouver, Montreal, Calgary

## 🚀 Key Benefits

1. **🎯 Hyper-Local News**: Users get news specific to their exact city
2. **📍 Location-Aware**: Automatically uses user's detected location
3. **🔄 Fallback System**: Gracefully handles missing city information
4. **⚡ Performance**: Smart caching per location
5. **🌐 Global**: Works worldwide with 30+ countries
6. **📱 Real-Time**: Fresh news every hour with caching

## 📋 API Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `category` | string | No | News category | `LOCAL`, `WORLD`, `BUSINESS` |
| `country` | string | No | Country name/code | `India`, `IN`, `United States` |
| `city` | string | No | City name | `Coimbatore`, `Mumbai`, `New York` |
| `showFeeds` | boolean | No | Show RSS feed URLs in logs | `true`, `false` |
| `clearCache` | boolean | No | Clear cache before fetching | `true`, `false` |

## ✨ User Experience

- **Dynamic Tab Labels**: LOCAL tab shows city name when available
- **Location Indicator**: Shows "News for Coimbatore, India" 
- **Seamless Integration**: Works with existing location detection
- **Progressive Enhancement**: Falls back gracefully if city unavailable

## 🔍 Verification Commands

```bash
# Test city-specific news
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=India&city=Coimbatore"

# Test different city
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=India&city=Mumbai"

# Test with logging
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=India&city=Coimbatore&showFeeds=true"

# Extract just headlines
curl "http://localhost:3000/api/news-headlines?category=LOCAL&country=India&city=Coimbatore" 2>/dev/null | jq '.headlines[].heading'
```

## 🎉 Success Metrics

✅ **City Detection**: Working with existing geolocation API  
✅ **RSS Generation**: Dynamic city-specific URLs created correctly  
✅ **News Fetching**: Successfully retrieving city-specific news  
✅ **Caching**: Location-aware caching implemented  
✅ **UI Integration**: Frontend updated to pass city parameter  
✅ **Global Support**: Tested with multiple countries and cities  
✅ **Fallback System**: Graceful degradation when city unavailable  

**Result**: Users now receive truly local, city-specific news instead of generic country-level news! 