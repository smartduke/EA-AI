import React from 'react';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@/components/icons';

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

  return (
    <div className={`flex flex-col space-y-3 my-4 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <SparklesIcon size={12} />
        <span>Follow-up questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {formattedQuestions.map((question, index) => (
          <Button
            key={`question-${index}-${question.substring(0, 10)}`}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left border-muted-foreground/30 hover:bg-muted/80 hover:text-primary transition-colors"
            onClick={() => onSelectQuestion(question)}
          >
            {question}
          </Button>
        ))}
      </div>
      <div className="border-border pt-2 mt-2">
        <div className="text-xs text-muted-foreground/70">
          Click on a question to continue the conversation
        </div>
      </div>
    </div>
  );
}
