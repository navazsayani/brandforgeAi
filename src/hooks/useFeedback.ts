'use client';

import { useState, useCallback } from 'react';
import { feedbackService } from '@/lib/feedback-service';
import { updateRAGPerformanceFromFeedback } from '@/lib/rag-integration';
import type { ContentFeedback, FeedbackSubmission, RAGPerformanceMetrics } from '@/types/feedback';

interface UseFeedbackProps {
  userId: string;
  contentId: string;
  contentType: ContentFeedback['contentType'];
  ragContext?: {
    wasRAGEnhanced: boolean;
    ragContextUsed?: string[];
    ragInsights?: ContentFeedback['ragInsights'];
  };
}

interface UseFeedbackReturn {
  submitFeedback: (feedback: FeedbackSubmission) => Promise<void>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
  performanceMetrics: RAGPerformanceMetrics | null;
  loadPerformanceMetrics: () => Promise<void>;
}

export const useFeedback = ({
  userId,
  contentId,
  contentType,
  ragContext
}: UseFeedbackProps): UseFeedbackReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<RAGPerformanceMetrics | null>(null);

  const submitFeedback = useCallback(async (feedback: FeedbackSubmission) => {
    if (isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit feedback to service
      await feedbackService.submitContentFeedback(
        userId,
        contentId,
        contentType,
        feedback,
        ragContext
      );

      // Update RAG performance if applicable
      if (ragContext?.wasRAGEnhanced && feedback.rating) {
        await updateRAGPerformanceFromFeedback(
          userId,
          contentId,
          feedback.rating,
          ragContext.wasRAGEnhanced,
          ragContext.ragContextUsed
        );
      }

      setIsSubmitted(true);

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, contentId, contentType, ragContext, isSubmitting, isSubmitted]);

  const loadPerformanceMetrics = useCallback(async () => {
    try {
      const metrics = await feedbackService.getPerformanceMetrics(userId);
      setPerformanceMetrics(metrics);
    } catch (err) {
      console.error('Error loading performance metrics:', err);
    }
  }, [userId]);

  return {
    submitFeedback,
    isSubmitting,
    isSubmitted,
    error,
    performanceMetrics,
    loadPerformanceMetrics
  };
};

// Hook for checking RAG performance
export const useRAGPerformance = (userId: string) => {
  const [performance, setPerformance] = useState<{
    isPerforming: boolean;
    ragAvg: number;
    nonRAGAvg: number;
    confidence: 'low' | 'medium' | 'high';
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const result = await feedbackService.isRAGPerformingWell(userId);
      setPerformance(result);
    } catch (error) {
      console.error('Error checking RAG performance:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    performance,
    loading,
    checkPerformance
  };
};