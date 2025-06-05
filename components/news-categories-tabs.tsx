'use client';

import { cn } from '@/lib/utils';
import {
  Loader2,
  MapPin,
  Globe,
  Briefcase,
  Smartphone,
  Clapperboard,
  Atom,
  Trophy,
  Heart,
  Search,
  Flag,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

// Country code to country name mapping
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  BR: 'Brazil',
  MX: 'Mexico',
  RU: 'Russia',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  IE: 'Ireland',
  NZ: 'New Zealand',
  ZA: 'South Africa',
  SG: 'Singapore',
  HK: 'Hong Kong',
  TW: 'Taiwan',
};

// Function to get country name from country code or return as-is if already a name
const getCountryName = (countryCodeOrName?: string): string => {
  if (!countryCodeOrName) return '';

  // If it's a 2-letter code, try to convert it
  if (countryCodeOrName.length === 2) {
    return COUNTRY_NAMES[countryCodeOrName.toUpperCase()] || countryCodeOrName;
  }

  // If it's already a country name, return as-is
  return countryCodeOrName;
};

// Define the props for the component
interface NewsCategoryTabsProps {
  onSelectMessageAction: (message: string) => void;
  className?: string;
}

// Define news category type
interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Define headline type
type HeadlineType = {
  heading: string;
  message: string;
  pubDate: string;
  link: string;
};

// Define user location type
type UserLocation = {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

// Define news categories with icons
const CATEGORIES: Category[] = [
  { id: 'LOCAL', label: 'Local', icon: MapPin },
  { id: 'COUNTRY', label: 'Country', icon: Flag },
  { id: 'WORLD', label: 'World', icon: Globe },
  { id: 'BUSINESS', label: 'Business', icon: Briefcase },
  { id: 'TECHNOLOGY', label: 'Technology', icon: Smartphone },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: Clapperboard },
  { id: 'SCIENCE', label: 'Science', icon: Atom },
  { id: 'SPORTS', label: 'Sports', icon: Trophy },
  { id: 'HEALTH', label: 'Health', icon: Heart },
];

export function NewsCategoryTabs({
  onSelectMessageAction,
  className,
}: NewsCategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('LOCAL');
  const [headlines, setHeadlines] = useState<Record<string, HeadlineType[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>(() => {
    const loadingState: Record<string, boolean> = {};
    CATEGORIES.forEach((category) => {
      loadingState[category.id] = true;
    });
    return loadingState;
  });
  const [userLocation, setUserLocation] = useState<UserLocation>({});

  // Function to get user's location from the app's existing geolocation
  const getUserLocation = useCallback(async () => {
    try {
      // Use the app's existing geolocation API
      const response = await fetch('/api/geolocation');
      if (response.ok) {
        const locationData = await response.json();

        setUserLocation({
          country: locationData.country || 'US',
          city: locationData.city,
        });

        console.log('📍 User location from app:', {
          country: locationData.country,
          city: locationData.city,
        });
      } else {
        // Fallback to US if geolocation fails
        setUserLocation({ country: 'US' });
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      // Default to US if location detection fails
      setUserLocation({ country: 'US' });
    }
  }, []);

  // Function to fetch headlines for a specific category
  const fetchCategoryHeadlines = useCallback(
    async (category: string) => {
      if (headlines[category]?.length > 0) {
        return; // Already loaded
      }

      setIsLoading((prev) => ({ ...prev, [category]: true }));
      try {
        const baseUrl = window.location.origin;
        const countryParam = userLocation.country
          ? `&country=${userLocation.country}`
          : '';
        const cityParam = userLocation.city ? `&city=${userLocation.city}` : '';
        const response = await fetch(
          `${baseUrl}/api/news-headlines?category=${category}${countryParam}${cityParam}`,
          {
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (data.headlines?.length > 0) {
          setHeadlines((prev) => ({
            ...prev,
            [category]: data.headlines.slice(0, 6), // Limit to 6 headlines per category
          }));
        }
      } catch (error) {
        console.error(`Error fetching headlines for ${category}:`, error);
      } finally {
        setIsLoading((prev) => ({ ...prev, [category]: false }));
      }
    },
    [headlines, userLocation.country, userLocation.city],
  );

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Initial fetch for the first active category when location is available
  useEffect(() => {
    if (userLocation.country) {
      fetchCategoryHeadlines(activeCategory);
    }
  }, [activeCategory, fetchCategoryHeadlines, userLocation.country]);

  // Load headlines for all categories when location is available
  useEffect(() => {
    if (userLocation.country) {
      CATEGORIES.forEach((category) => {
        fetchCategoryHeadlines(category.id);
      });
    }
  }, [fetchCategoryHeadlines, userLocation.country]);

  return (
    <div className={cn('w-full', className)}>
      {/* Modern iOS-style pill tabs */}
      <div className="relative mb-3">
        {/* Background container for pill effect */}
        <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isActive = activeCategory === category.id;

                // Dynamic label for Local category
                const getLabel = () => {
                  if (category.id === 'LOCAL' && userLocation.city) {
                    return userLocation.city;
                  } else if (
                    category.id === 'LOCAL' &&
                    userLocation.country &&
                    userLocation.country !== 'US'
                  ) {
                    return getCountryName(userLocation.country);
                  } else if (
                    category.id === 'COUNTRY' &&
                    userLocation.country &&
                    userLocation.country !== 'US'
                  ) {
                    return getCountryName(userLocation.country);
                  }
                  return category.label;
                };

                return (
                  <button
                    key={category.id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap relative overflow-hidden',
                      isActive
                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-lg shadow-black/10 dark:shadow-black/20 scale-100'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 scale-95 hover:scale-100',
                    )}
                    onClick={() => {
                      setActiveCategory(category.id);
                      if (userLocation.country) {
                        fetchCategoryHeadlines(category.id);
                      }
                    }}
                  >
                    {/* Active background animation */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-xl"
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Icon with animation */}
                    <IconComponent
                      className={cn(
                        'size-4 transition-all duration-300 relative z-10',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400 scale-110'
                          : 'scale-100',
                      )}
                    />

                    {/* Label */}
                    <span className="font-medium relative z-10">
                      {getLabel()}
                    </span>

                    {/* Country indicator for Local */}
                    {category.id === 'LOCAL' &&
                      userLocation.country &&
                      userLocation.country !== 'US' && (
                        <span className="text-xs opacity-60 relative z-10">
                          ({getCountryName(userLocation.country)})
                        </span>
                      )}

                    {/* Loading indicator */}
                    {isLoading[category.id] && isActive && (
                      <Loader2 className="size-3 animate-spin ml-1 relative z-10" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Headlines Section */}
      <div className="relative min-h-[200px]">
        {CATEGORIES.map((category) => (
          <div
            key={category.id}
            className={cn(
              'absolute inset-0 transition-all duration-300',
              activeCategory === category.id
                ? 'opacity-100 pointer-events-auto translate-y-0'
                : 'opacity-0 pointer-events-none translate-y-2',
            )}
          >
            {isLoading[category.id] ? (
              // Compact Loading State
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={`loading-${category.id}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="py-2 px-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-200/30 dark:border-gray-700/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-2/3" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : headlines[category.id]?.length > 0 ? (
              // Compact Headlines
              <div className="space-y-1">
                {headlines[category.id].map(
                  (headline: HeadlineType, i: number) => (
                    <motion.button
                      key={`${category.id}-${headline.link}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      type="button"
                      className="w-full text-left py-2 px-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-200/30 dark:border-gray-700/30 hover:border-blue-200 dark:hover:border-blue-700/40 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-200 group"
                      onClick={async () => {
                        onSelectMessageAction(headline.message);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200 line-clamp-1">
                          {headline.heading}
                        </span>
                      </div>
                    </motion.button>
                  ),
                )}
              </div>
            ) : (
              // Compact Empty State
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="py-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded animate-pulse" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No headlines available
                </p>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
