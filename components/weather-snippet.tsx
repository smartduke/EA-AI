'use client';

import { useEffect, useState } from 'react';
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
} from 'lucide-react';

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
      <div className="max-w-sm mx-auto">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 animate-pulse" />
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

  return (
    <div className="max-w-xs mx-auto">
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-blue-900/20 dark:via-sky-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          {/* Colorful Weather Icon */}
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-sky-500 shadow-md">
            <WeatherIcon className="size-4 text-white drop-shadow-sm" />
          </div>

          {/* Weather Info */}
          <div className="flex-1 min-w-0">
            {/* Temperature and Condition */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-sky-600 dark:from-blue-400 dark:to-sky-400 bg-clip-text text-transparent">
                {weather.temperature}°C
              </span>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                {weather.condition}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1">
              <MapPin className="size-2.5 text-blue-500 dark:text-blue-400" />
              <span className="text-xs text-blue-600 dark:text-blue-300 truncate font-medium">
                {weather.location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
