import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const INTRO_MESSAGES = [
  {
    title: 'Ask your Escape & Offshore Living questions',
    subtitle:
      'Planning to move abroad? Invest overseas? Get a second passport?',
    highlight: 'Explore your options',
  },
  {
    title: 'Dreaming of life abroad?',
    subtitle:
      'Second passports, offshore real estate, moving tips, banking, taxes —',
    highlight: 'Get quick answers',
  },
  {
    title: 'Navigate offshore living legally & smartly',
    subtitle:
      'From second passports to banking, real estate, and tax compliance —',
    highlight: 'Get clear insights',
  },
  {
    title: 'Planning your life abroad?',
    subtitle:
      'Wondering about second passports, best places to retire, moving money?',
    highlight: "Let's explore together",
  },
];

export function IntroText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % INTRO_MESSAGES.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const currentMessage = INTRO_MESSAGES[currentIndex];

  return (
    <div
      className="w-full max-w-4xl mx-auto px-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative py-8">
        {/* Subtle gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 -z-10 rounded-3xl opacity-50"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(59, 130, 246, 0.03), transparent 50%), radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.03), transparent 50%)',
          }}
        />

        {/* Fixed height container for transitions */}
        <div className="h-[120px] sm:h-[100px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {/* Title with highlight effect */}
              <div className="space-y-4">
                <motion.h2
                  className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 dark:text-white truncate"
                  style={{ lineHeight: 1.2 }}
                >
                  {currentMessage.title}
                </motion.h2>

                {/* Subtitle with highlight */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-gray-600 dark:text-gray-300">
                  <p className="text-base sm:text-lg">
                    {currentMessage.subtitle}
                  </p>
                  <div className="h-5 w-[1px] bg-gray-300 dark:bg-gray-700 hidden sm:block" />
                  <div className="flex items-center gap-2 text-base sm:text-lg font-medium text-blue-600 dark:text-blue-400">
                    {currentMessage.highlight}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-4">
          {INTRO_MESSAGES.map((message, index) => (
            <div
              key={`progress-${message.title.slice(0, 10)}-${index}`}
              className={`
                h-1 rounded-full transition-all duration-500 ease-out
                ${index === currentIndex ? 'w-8 bg-blue-600 dark:bg-blue-400' : 'w-2 bg-gray-200 dark:bg-gray-800'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
