'use client';

import React, { useState } from 'react';
import { Brain, CheckCircle, TrendingUp, Hash, Palette, MessageCircle } from 'lucide-react';
import type { RAGInsight } from '@/types/feedback';

interface RAGInsightsBadgeProps {
  insights: RAGInsight[];
  isVisible?: boolean;
  className?: string;
}

export const RAGInsightsBadge: React.FC<RAGInsightsBadgeProps> = ({
  insights,
  isVisible = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !insights || insights.length === 0) {
    return null;
  }

  const getInsightIcon = (type: RAGInsight['type']) => {
    switch (type) {
      case 'brand_patterns':
        return <Palette className="w-4 h-4" />;
      case 'voice_patterns':
        return <MessageCircle className="w-4 h-4" />;
      case 'hashtags':
        return <Hash className="w-4 h-4" />;
      case 'styles':
        return <Palette className="w-4 h-4" />;
      case 'performance':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const activeInsights = insights.filter(insight => insight.isActive);

  if (activeInsights.length === 0) {
    return null;
  }

  return (
    <div className={`mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full text-left hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded p-1 -m-1 transition-colors"
      >
        <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            AI Learning Applied
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
            ({activeInsights.length} insight{activeInsights.length !== 1 ? 's' : ''})
          </span>
        </div>
        <span className="text-blue-600 dark:text-blue-400 ml-2">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {activeInsights.map((insight, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {insight.description}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 This content uses patterns from your most successful posts to improve engagement
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to create RAG insights from context
export const createRAGInsights = (ragContext: {
  brandPatterns?: string;
  voicePatterns?: string;
  effectiveHashtags?: string;
  successfulStyles?: string;
  performanceInsights?: string;
}): RAGInsight[] => {
  const insights: RAGInsight[] = [];

  if (ragContext.brandPatterns) {
    insights.push({
      type: 'brand_patterns',
      description: 'Using your established brand voice and messaging patterns',
      confidence: 0.85,
      isActive: true
    });
  }

  if (ragContext.voicePatterns) {
    insights.push({
      type: 'voice_patterns',
      description: 'Applying your most engaging communication style',
      confidence: 0.78,
      isActive: true
    });
  }

  if (ragContext.effectiveHashtags) {
    const hashtagCount = ragContext.effectiveHashtags.split('#').length - 1;
    insights.push({
      type: 'hashtags',
      description: `Suggesting ${hashtagCount} of your best-performing hashtags`,
      confidence: 0.82,
      isActive: true
    });
  }

  if (ragContext.successfulStyles) {
    insights.push({
      type: 'styles',
      description: 'Using visual and content styles from your top posts',
      confidence: 0.75,
      isActive: true
    });
  }

  if (ragContext.performanceInsights) {
    insights.push({
      type: 'performance',
      description: 'Optimized based on your content performance data',
      confidence: 0.88,
      isActive: true
    });
  }

  return insights;
};