import { motion } from 'framer-motion';
import { WeatherSnippet } from './weather-snippet';

export const Greeting = () => {
  return (
    <div key="overview" className="max-w-4xl mx-auto px-8 flex flex-col">
      {/* Simple Main Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center mb-4"
      >
        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Welcome to InfoxAI
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Your intelligent assistant for information, weather, and news
        </p>
      </motion.div>

      {/* Simple Weather Section */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="flex justify-center"
      >
        <WeatherSnippet />
      </motion.div>
    </div>
  );
};
