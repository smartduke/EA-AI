'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PipelineLoaderProps {
  onComplete?: () => void;
}

export const PipelineLoader: React.FC<PipelineLoaderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const loadingTexts = [
    'Searching the web...',
    'Reading from sources...',
    'Analyzing information...',
    'Synthesizing response...',
    'Finalizing results...'
  ];

  const stepDurations = [2000, 3000, 2000, 1500, 500];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < loadingTexts.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        onComplete?.();
      }
    }, stepDurations[currentStep] || 2000);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  const progressPercentage = ((currentStep + 1) / loadingTexts.length) * 100;

  return (
    <div className="w-full mx-auto max-w-3xl px-4">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="space-y-6"
      >
        {/* Left-aligned Loading Text with Circle Icon */}
        <div className="flex items-center gap-3">
          {/* Circle Loader Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full flex-shrink-0"
          />
          
          {/* Text with Shimmer */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.23, 1, 0.32, 1] 
              }}
              className="relative overflow-hidden"
            >
              {/* Shimmer Wave Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ width: '50%' }}
              />
              <span className="text-base font-medium text-gray-700 dark:text-gray-300 relative z-10">
                {loadingTexts[currentStep]}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden"
        >
          <motion.div
            className="h-full bg-gray-600 dark:bg-gray-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ 
              width: `${progressPercentage}%`
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.23, 1, 0.32, 1]
            }}
          />
        </motion.div>

        {/* Status Text */}
        <motion.div
          className="text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm text-gray-500 dark:text-gray-500">
            {Math.round(progressPercentage)}% complete
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}; 