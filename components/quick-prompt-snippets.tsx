'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Newspaper,
  TrendingUp,
  Globe,
  Search,
  Zap,
  BookOpen,
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptSnippet {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

const promptSnippets: PromptSnippet[] = [
  {
    id: 'local-news',
    title: "What's happening near me?",
    subtitle: 'Local news and events',
    prompt:
      'What are the top local news stories and events happening in my area today?',
    icon: Newspaper,
  },
  {
    id: 'world-updates',
    title: 'Catch me up on world news',
    subtitle: 'Global headlines today',
    prompt:
      'Give me a quick summary of the most important world news stories today',
    icon: Globe,
  },
  {
    id: 'trending-now',
    title: "What's trending right now?",
    subtitle: 'Popular topics and discussions',
    prompt:
      'What are the trending topics and viral stories everyone is talking about today?',
    icon: TrendingUp,
  },
  {
    id: 'market-update',
    title: 'How are markets doing?',
    subtitle: 'Business and finance news',
    prompt:
      "Give me an update on today's stock market performance and major business news",
    icon: Search,
  },
  {
    id: 'tech-news',
    title: 'Any tech breakthroughs?',
    subtitle: 'Latest in technology',
    prompt:
      'What are the latest technology news and innovations announced today?',
    icon: Zap,
  },
  {
    id: 'explained',
    title: "Explain today's big story",
    subtitle: 'Deep dive analysis',
    prompt:
      'Pick the biggest news story today and explain it to me in simple terms with context',
    icon: BookOpen,
  },
];

interface QuickPromptSnippetsProps {
  onPromptSelect: (prompt: string) => void;
}

export function QuickPromptSnippets({
  onPromptSelect,
}: QuickPromptSnippetsProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemWidth, setItemWidth] = useState(240); // Default width per item - smaller

  // Calculate responsive item width
  useEffect(() => {
    const updateItemWidth = () => {
      if (window.innerWidth >= 1024) {
        setItemWidth(240); // lg screens - compact width
      } else if (window.innerWidth >= 768) {
        setItemWidth(220); // md screens
      } else {
        setItemWidth(200); // sm screens - narrower items
      }
    };

    updateItemWidth();
    window.addEventListener('resize', updateItemWidth);
    return () => window.removeEventListener('resize', updateItemWidth);
  }, []);

  // Smooth continuous sliding animation
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTranslateX((prev) => {
        const totalWidth = promptSnippets.length * (itemWidth + 12); // 12px gap - smaller
        const newTranslate = prev - 0.8; // Slower movement for elegance

        // Reset when fully scrolled through all items
        if (Math.abs(newTranslate) >= totalWidth) {
          return 0;
        }
        return newTranslate;
      });
    }, 50); // 50ms interval for smooth motion

    return () => clearInterval(interval);
  }, [isPaused, itemWidth]);

  // Duplicate snippets for seamless loop
  const duplicatedSnippets = [...promptSnippets, ...promptSnippets];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="w-full md:max-w-3xl mx-auto px-4"
    >
      <div
        className="overflow-hidden pt-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          className="flex gap-3"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isPaused ? 'transform 0.3s ease-out' : 'none',
          }}
        >
          {duplicatedSnippets.map((snippet, index) => {
            const IconComponent = snippet.icon;
            return (
              <div
                key={`${snippet.id}-${index}`}
                className="flex-shrink-0"
                style={{ width: `${itemWidth}px` }}
              >
                <button
                  type="button"
                  onClick={() => onPromptSelect(snippet.prompt)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-700/50 group text-left relative overflow-hidden"
                >
                  {/* Active tab background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-xl" />

                  {/* Line 1: Icon + Title */}
                  <div className="flex items-center gap-2.5 mb-1 relative z-10">
                    <div className="relative flex-shrink-0">
                      <IconComponent className="size-4 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200 line-clamp-1">
                      {snippet.title}
                    </span>
                  </div>

                  {/* Line 2: Subtitle */}
                  <div className="flex items-center relative z-10">
                    <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200 line-clamp-1">
                      {snippet.subtitle}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
