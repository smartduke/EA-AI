'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Code,
  Landmark,
  BookOpen,
  Scale,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface StarterPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

const CATEGORIES = [
  {
    id: 'citizenship',
    icon: FileText,
    label: 'Citizenship & Second Passports',
    prompts: [
      'What are the best countries to get a second passport in 2025?',
      'Which countries offer citizenship by investment?',
      'How fast can I get citizenship in Portugal?',
      'What are the benefits of dual citizenship?',
      'How can Americans legally renounce US citizenship?',
    ],
  },
  {
    id: 'realestate',
    icon: Code,
    label: 'Offshore Real Estate & Investing',
    prompts: [
      'Can foreigners own land in Belize?',
      'Is it safe to invest in real estate in Panama?',
      'What are the top countries to buy beachfront property?',
      'What are property taxes like for expats in Portugal?',
      'How can I finance real estate abroad?',
    ],
  },
  {
    id: 'banking',
    icon: Landmark,
    label: 'Offshore Banking & Asset Protection',
    prompts: [
      'How to legally open an offshore bank account?',
      'What is an offshore trust and how does it work?',
      'Best countries for privacy-friendly banking?',
      'How to move money internationally while staying compliant?',
      'What are the risks of using offshore bank accounts?',
    ],
  },
  {
    id: 'lifestyle',
    icon: BookOpen,
    label: 'Expat Lifestyle & Moving Overseas',
    prompts: [
      'What is the cost of living in Costa Rica?',
      'Best countries for digital nomads in 2025?',
      'How to choose an international school for my kids?',
      "What's it like to retire in Panama?",
      'Top healthcare options for expats in Europe?',
    ],
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'Legal & Tax Compliance',
    prompts: [
      'Do US citizens need to file taxes if living abroad?',
      'What is FATCA and how does it affect offshore investments?',
      'What is the FBAR filing requirement?',
      'How to legally reduce taxes when moving offshore?',
      'How can I ensure my offshore structures are fully legal?',
    ],
  },
];

export function StarterPrompts({
  onSelectPrompt,
  className,
}: StarterPromptsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const selectedCategoryData = CATEGORIES.find(
    (cat) => cat.id === selectedCategory,
  );

  return (
    <div className={cn('w-full max-w-[1000px] mx-auto relative', className)}>
      <AnimatePresence mode="wait">
        {selectedCategory && selectedCategoryData ? (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {selectedCategoryData.icon && (
                  <selectedCategoryData.icon className="w-4 h-4 text-gray-500" />
                )}
                <h2 className="text-[15px] font-medium text-gray-700 dark:text-gray-200">
                  {selectedCategoryData.label}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div>
              {selectedCategoryData.prompts.map((prompt) => (
                <button
                  type="button"
                  key={`${selectedCategoryData.id}-${prompt}`}
                  onClick={() => {
                    onSelectPrompt(prompt);
                    setSelectedCategory(null);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <span className="text-[15px] text-gray-600 dark:text-gray-300 pr-4">
                    {prompt}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 dark:text-gray-600 dark:group-hover:text-gray-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-wrap justify-center gap-3 p-4"
          >
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[15px] font-medium bg-white hover:bg-gray-50 dark:bg-white/5 dark:hover:bg-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-200 border border-gray-100 dark:border-white/10 whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
