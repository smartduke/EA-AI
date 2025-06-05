'use client';

import React from 'react';
import { Search, CheckCircle, Circle } from 'lucide-react';

interface ResearchPhase {
  id: string;
  status: 'pending' | 'active' | 'completed';
  title: string;
  queries?: string[];
  sources?: Array<{
    name: string;
    domain: string;
    url: string;
  }>;
}

interface ResearchPipelineProps {
  isVisible: boolean;
  phases: ResearchPhase[];
  currentPhase?: string;
}

export function ResearchPipeline({ isVisible, phases, currentPhase }: ResearchPipelineProps) {
  if (!isVisible) return null;

  const getPhaseIcon = (status: ResearchPhase['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'active':
        return <Search size={16} className="text-blue-500 animate-spin" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Search size={18} className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-medium text-blue-900 dark:text-blue-100">Research</h3>
      </div>
      
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        It takes a few minutes to gather sources, analyze data, and create your report.
      </p>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="space-y-2">
            <div className="flex items-center gap-2">
              {getPhaseIcon(phase.status)}
              <span className={`text-sm font-medium ${
                phase.status === 'active' 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : phase.status === 'completed'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {phase.title}
              </span>
            </div>

            {/* Show search queries for searching phase */}
            {phase.queries && phase.queries.length > 0 && (
              <div className="ml-6 space-y-1">
                {phase.queries.map((query, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Search size={12} className="text-gray-500" />
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      {query}
                    </code>
                  </div>
                ))}
              </div>
            )}

            {/* Show sources for reading phase */}
            {phase.sources && phase.sources.length > 0 && (
              <div className="ml-6 flex flex-wrap gap-2">
                {phase.sources.map((source, index) => (
                  <div key={index} className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {source.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 