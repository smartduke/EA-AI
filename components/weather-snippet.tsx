'use client';

import { useEffect, useState } from 'react';
import { MapPin, Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

interface GeoLocation {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefaultLocation?: boolean;
}

// Weather condition icons mapping
const getWeatherIcon = (temperature: number) => {
  if (temperature >= 25) return Sun;
  if (temperature >= 15) return Cloud;
  if (temperature >= 0) return CloudRain;
  return Snowflake;
};

export function WeatherSnippet() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchLocationAndWeather() {
      try {
        // First get user's location
        console.log('Fetching user location...');
        const geoResponse = await fetch('/api/geolocation');

        if (!geoResponse.ok) {
          throw new Error('Failed to get location');
        }

        const geoData: GeoLocation = await geoResponse.json();
        console.log('Location data received:', geoData);

        // Use coordinates if available, otherwise default to approximate coordinates
        let lat = geoData.latitude;
        let lon = geoData.longitude;

        // If no coordinates, use approximate coordinates for major cities
        if (!lat || !lon) {
          // Default coordinates for major cities
          const cityCoords: Record<string, { lat: number; lon: number }> = {
            'New Delhi': { lat: 28.6139, lon: 77.209 },
            Mumbai: { lat: 19.076, lon: 72.8777 },
            Bangalore: { lat: 12.9716, lon: 77.5946 },
            Chennai: { lat: 13.0827, lon: 80.2707 },
            Hyderabad: { lat: 17.385, lon: 78.4867 },
            Kolkata: { lat: 22.5726, lon: 88.3639 },
            Pune: { lat: 18.5204, lon: 73.8567 },
            Ahmedabad: { lat: 23.0225, lon: 72.5714 },
          };

          const cityName = geoData.city || 'Mumbai';
          const coords = cityCoords[cityName] || cityCoords.Mumbai;
          lat = coords.lat;
          lon = coords.lon;
        }

        // Fetch weather data using Open-Meteo API
        console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`,
        );

        if (!weatherResponse.ok) {
          throw new Error('Failed to get weather data');
        }

        const weatherData = await weatherResponse.json();
        console.log('Weather data received:', weatherData);

        // Format location name
        const locationParts = [
          geoData.city,
          geoData.region,
          geoData.country,
        ].filter(Boolean);
        const locationName = locationParts.slice(0, 2).join(', '); // City, Region or City, Country

        // Map weather codes to simple conditions
        const getWeatherCondition = (code: number): string => {
          if (code === 0) return 'Clear';
          if (code <= 3) return 'Partly Cloudy';
          if (code <= 48) return 'Cloudy';
          if (code <= 67) return 'Rainy';
          if (code <= 77) return 'Snowy';
          if (code <= 82) return 'Rainy';
          if (code <= 86) return 'Snowy';
          return 'Stormy';
        };

        setWeather({
          temperature: Math.round(weatherData.current.temperature_2m),
          condition: getWeatherCondition(weatherData.current.weather_code || 0),
          location: locationName,
          latitude: lat,
          longitude: lon,
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather');
      } finally {
        setLoading(false);
      }
    }

    fetchLocationAndWeather();
  }, []);

  if (loading) {
    return (
      <div className="min-w-36">
        <div className="p-2 rounded-xl bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-800/90 backdrop-blur-md border border-white/50 dark:border-gray-700/50 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-4 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600 rounded-full animate-pulse" />
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full w-20 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 rounded-full animate-pulse" />
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return null; // Don't show anything if there's an error
  }

  const WeatherIcon = getWeatherIcon(weather.temperature);

  // Get current date only
  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Get temperature color based on value
  const getTempColor = (temp: number) => {
    if (temp >= 30) return 'text-red-600 dark:text-red-400';
    if (temp >= 20) return 'text-orange-600 dark:text-orange-400';
    if (temp >= 10) return 'text-blue-600 dark:text-blue-400';
    return 'text-cyan-600 dark:text-cyan-400';
  };

  // Get condition color
  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-700/50';
      case 'partly cloudy':
        return 'bg-gradient-to-r from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50';
      case 'cloudy':
        return 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/40 dark:to-slate-800/40 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/50';
      case 'rainy':
        return 'bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-700/50';
      case 'snowy':
        return 'bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800/40 dark:to-gray-800/40 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-600/50';
      default:
        return 'bg-gradient-to-r from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50';
    }
  };

  return (
    <div className="min-w-36">
      <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-md border border-white/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-white dark:hover:from-gray-900 hover:border-white/80 dark:hover:border-gray-600/80 group">
        {/* Line 1: Weather Icon + Temperature + Condition */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative">
            <WeatherIcon className="size-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200" />
            <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </div>
          <span
            className={`text-sm font-bold tracking-wide ${getTempColor(weather.temperature)} group-hover:scale-105 transition-transform duration-200`}
          >
            {weather.temperature}°
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium border backdrop-blur-sm ${getConditionColor(weather.condition)} group-hover:scale-105 transition-transform duration-200 shadow-sm`}
          >
            {weather.condition}
          </span>
        </div>

        {/* Line 2: Location + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 group/location">
            <div className="relative">
              <MapPin className="size-2.5 text-emerald-600 dark:text-emerald-400 group-hover/location:text-emerald-700 dark:group-hover/location:text-emerald-300 transition-colors duration-200" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 scale-0 group-hover/location:scale-150 transition-transform duration-300" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover/location:text-gray-800 dark:group-hover/location:text-gray-200 transition-colors duration-200">
              {weather.location.split(',')[0]}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100/60 dark:bg-gray-800/60 px-2 py-0.5 rounded-full group-hover:bg-gray-200/60 dark:group-hover:bg-gray-700/60 transition-colors duration-200 shadow-sm">
            {dateString}
          </span>
        </div>
      </div>
    </div>
  );
}
