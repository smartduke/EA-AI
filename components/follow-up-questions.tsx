import React from 'react';
import { Button } from '@/components/ui/button';
import { SparklesIcon, ChevronDownIcon } from '@/components/icons';
import { motion } from 'framer-motion';

interface FollowUpQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  className?: string;
}

export function FollowUpQuestions({
  questions,
  onSelectQuestion,
  className = '',
}: FollowUpQuestionsProps) {
  if (!questions || questions.length === 0) {
    return null;
  }

  // Extract questions from the numbered format [1] Question text
  const formattedQuestions = questions.map((q) => {
    const match = q.match(/\[\d+\]\s*(.+)/);
    return match ? match[1].trim() : q;
  });

  // Animation variants for staggered appearance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className={`flex flex-col space-y-2 my-6 ${className}`}
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Left-aligned header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">
          <SparklesIcon size={14} />
        </div>
        <span className="text-sm font-medium text-primary/80">Follow-up questions</span>
      </div>

      {/* Single column questions layout */}
      <div className="flex flex-col space-y-1.5 w-full">
        {formattedQuestions.map((question, index) => (
          <motion.div key={`question-${index}`} variants={itemVariants}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-auto py-1.5 px-3 rounded-lg text-left justify-between border-none hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-150 flex items-center"
              onClick={() => onSelectQuestion(question)}
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate mr-2">
                {question}
              </span>
              <ChevronDownIcon size={10} />
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
