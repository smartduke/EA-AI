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
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg max-w-sm mx-auto">
        <div className="animate-pulse">
          <div className="size-8 bg-muted rounded-full" />
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-1" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return null; // Don't show anything if there's an error
  }

  const WeatherIcon = getWeatherIcon(weather.temperature);

  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-sky-950/50 rounded-lg max-w-sm mx-auto border border-blue-100 dark:border-blue-800">
      <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 dark:bg-blue-800">
        <WeatherIcon className="size-4 text-blue-600 dark:text-blue-300" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          <span>{weather.temperature}°C</span>
          <span className="text-gray-500 dark:text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-300">
            {weather.condition}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          <MapPin className="size-3" />
          <span className="truncate">{weather.location}</span>
        </div>
      </div>
    </div>
  );
}
