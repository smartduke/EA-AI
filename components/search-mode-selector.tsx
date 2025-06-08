'use client';

import React from 'react';
import { Search, SearchX } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export type SearchMode = 'search' | 'deep-search';

interface SearchModeOption {
  id: SearchMode;
  name: string;
  description: string;
  icon: React.ComponentType<LucideProps>;
}

const searchModes: SearchModeOption[] = [
  {
    id: 'search',
    name: 'Search',
    description: 'Fast search with concise results',
    icon: Search,
  },
  {
    id: 'deep-search',
    name: 'Deep Search',
    description: 'Comprehensive research with 20-25 paragraphs',
    icon: SearchX,
  },
];

interface SearchModeSelectorProps {
  selectedSearchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  className?: string;
  compact?: boolean;
}

export function SearchModeSelector({
  selectedSearchMode,
  onSearchModeChange,
  className = '',
  compact = false,
}: SearchModeSelectorProps) {
  const currentMode = searchModes.find(
    (mode) => mode.id === selectedSearchMode,
  );
  const IconComponent = currentMode?.icon || Search;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 ${className} ${
            compact ? 'text-xs h-8 px-2' : 'text-sm h-10 px-3'
          } bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
        >
          <IconComponent size={compact ? 14 : 16} />
          <span className="truncate">
            {compact ? currentMode?.name : currentMode?.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {searchModes.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <DropdownMenuItem
              key={mode.id}
              onClick={() => onSearchModeChange(mode.id)}
              className={`flex items-start gap-3 p-3 cursor-pointer ${
                selectedSearchMode === mode.id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : ''
              }`}
            >
              <ModeIcon
                size={18}
                className={`mt-0.5 flex-shrink-0 ${
                  selectedSearchMode === mode.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500'
                }`}
              />
              <div className="flex flex-col">
                <span
                  className={`font-medium ${
                    selectedSearchMode === mode.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {mode.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {mode.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
