'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Code,
  Landmark,
  BookOpen,
  Scale,
  Briefcase,
  Sun,
  Shield,
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
    label: 'Citizenship',
    color: 'from-blue-500 to-indigo-500',
    prompts: [
      'What are the best countries to get a second passport in 2025?',
      'Which countries offer citizenship by investment?',
      'How fast can I get citizenship in Portugal?',
      'What are the benefits of dual citizenship?',
      'What are the easiest countries to get citizenship?',
    ],
  },
  {
    id: 'realestate',
    icon: Code,
    label: 'Real Estate',
    color: 'from-emerald-500 to-teal-500',
    prompts: [
      'Best countries to buy beachfront property?',
      'Is it safe to invest in real estate in Panama?',
      'How to buy property in Portugal as a foreigner?',
      'What are property taxes like for expats in Spain?',
      'Most affordable places to buy property abroad?',
    ],
  },
  {
    id: 'banking',
    icon: Landmark,
    label: 'Banking',
    color: 'from-violet-500 to-purple-500',
    prompts: [
      'How to legally open an offshore bank account?',
      'Best countries for privacy-friendly banking?',
      'Safest offshore banking jurisdictions?',
      'How to move money internationally legally?',
      'Most reputable offshore banks in 2025?',
    ],
  },
  {
    id: 'taxes',
    icon: Scale,
    label: 'Taxes',
    color: 'from-rose-500 to-pink-500',
    prompts: [
      'Do US citizens need to file taxes if living abroad?',
      'What is FATCA compliance?',
      'How to legally reduce taxes when moving offshore?',
      'Tax implications of having multiple residencies?',
      'Countries with no income tax for expats?',
    ],
  },
  {
    id: 'residency',
    icon: BookOpen,
    label: 'Residency',
    color: 'from-amber-500 to-orange-500',
    prompts: [
      'Best golden visa programs in 2025?',
      'How to get residency in Portugal?',
      'Digital nomad visa requirements in Europe?',
      'Fastest residency by investment programs?',
      'Most affordable residency options abroad?',
    ],
  },
  {
    id: 'business',
    icon: Briefcase,
    label: 'Business',
    color: 'from-cyan-500 to-sky-500',
    prompts: [
      'Best countries to start an offshore company?',
      'How to open a business in Dubai?',
      'Most business-friendly jurisdictions?',
      'Tax benefits of offshore companies?',
      'Setting up an international business structure?',
    ],
  },
  {
    id: 'lifestyle',
    icon: Sun,
    label: 'Lifestyle',
    color: 'from-yellow-500 to-amber-500',
    prompts: [
      'Best places to retire abroad in 2025?',
      'Cost of living in Portugal vs Spain?',
      'Most expat-friendly cities in Europe?',
      'Healthcare quality in popular expat destinations?',
      'International schools in expat-friendly countries?',
    ],
  },
  {
    id: 'compliance',
    icon: Shield,
    label: 'Compliance',
    color: 'from-green-500 to-emerald-500',
    prompts: [
      'What is CRS reporting?',
      'How to stay compliant with international laws?',
      'Due diligence requirements for offshore accounts?',
      'Legal requirements for offshore trusts?',
      'Anti-money laundering regulations to know?',
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
                <h2 className="text-[15px] [@media(max-width:640px)]:text-[13px] font-medium text-gray-700 dark:text-gray-200">
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
                  <span className="text-sm [@media(max-width:640px)]:text-[13px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200 line-clamp-1">
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
                  className="group relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[15px] [@media(max-width:640px)]:text-[13px] font-medium bg-white hover:bg-gray-50 dark:bg-white/5 dark:hover:bg-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-200 border border-gray-100 dark:border-white/10 whitespace-nowrap overflow-hidden"
                >
                  {/* Gradient background for icon */}
                  <div
                    className={`absolute inset-0 opacity-[0.08] bg-gradient-to-r ${category.color} group-hover:opacity-[0.12] transition-opacity duration-200`}
                  />

                  {/* Icon container with gradient */}
                  <div
                    className={`relative flex items-center justify-center size-5 rounded-full bg-gradient-to-r ${category.color}`}
                  >
                    <Icon className="size-3 text-white" />
                  </div>

                  <span className="text-gray-700 dark:text-gray-200 relative text-[15px] [@media(max-width:640px)]:text-[13px]">
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
