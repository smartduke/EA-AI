import { motion } from 'framer-motion';
import { QuickPromptSnippets } from './quick-prompt-snippets';
import { Search, BarChart3, Compass } from 'lucide-react';

interface GreetingProps {
  onPromptSelect?: (prompt: string) => void;
}

export const Greeting = ({ onPromptSelect }: GreetingProps) => {
  return (
    <div key="overview" className="max-w-4xl mx-auto px-8 flex flex-col">
      {/* Action-Oriented Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center mb-4"
      >
        {/* Brand Name */}
        <h1 className="text-2xl md:text-3xl font-medium mb-6 text-gray-900 dark:text-gray-100">
          Info × AI
        </h1>

        {/* Action-Oriented Core Message */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <Search className="size-5 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Search
            </span>
          </motion.div>

          <span className="text-gray-400">•</span>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <BarChart3 className="size-5 text-green-600 dark:text-green-400" />
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Analyze
            </span>
          </motion.div>

          <span className="text-gray-400">•</span>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <Compass className="size-5 text-purple-600 dark:text-purple-400" />
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Discover
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Prompt Snippets */}
      {onPromptSelect && (
        <QuickPromptSnippets onPromptSelect={onPromptSelect} />
      )}
    </div>
  );
};
