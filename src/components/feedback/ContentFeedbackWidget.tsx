'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles, CheckCircle } from 'lucide-react';
import { StarRating } from './StarRating';
import { feedbackService } from '@/lib/feedback-service';
import type { ContentFeedback, RAGInsight } from '@/types/feedback';

interface ContentFeedbackWidgetProps {
  contentId: string;
  contentType: ContentFeedback['contentType'];
  userId: string;
  ragContext?: {
    wasRAGEnhanced: boolean;
    ragContextUsed?: string[];
    ragInsights?: ContentFeedback['ragInsights'];
    insights?: RAGInsight[];
  };
  onFeedbackSubmitted?: (feedback: any) => void;
  className?: string;
}

export const ContentFeedbackWidget: React.FC<ContentFeedbackWidgetProps> = ({
  contentId,
  contentType,
  userId,
  ragContext,
  onFeedbackSubmitted,
  className = ''
}) => {
  const [rating, setRating] = useState<number>(0);
  const [wasHelpful, setWasHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showRAGInsights, setShowRAGInsights] = useState(false);

  const handleSubmitFeedback = async () => {
    if (isSubmitting || isSubmitted) return;
    
    // Require either rating or helpful feedback
    if (rating === 0 && wasHelpful === null) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await feedbackService.submitContentFeedback(
        userId,
        contentId,
        contentType,
        {
          contentId,
          rating: rating > 0 ? rating : undefined,
          wasHelpful: wasHelpful ?? undefined,
          comment: comment.trim() || undefined
        },
        ragContext
      );

      // Only set submitted to true if the submission was successful
      setIsSubmitted(true);
      onFeedbackSubmitted?.({
        rating,
        wasHelpful,
        comment,
        ragContext
      });

      // Keep submitted state - don't reset automatically
      // The component will stay in submitted state until unmounted/remounted

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.');
      // Don't set isSubmitted to true if there was an error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpfulClick = (helpful: boolean) => {
    setWasHelpful(helpful);
    // Auto-submit for simple helpful/not helpful feedback
    if (rating === 0 && !showComment) {
      setTimeout(() => handleSubmitFeedback(), 100);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg ${className}`}>
        <div className="flex items-center text-green-700 dark:text-green-400">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Thanks for your feedback!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-muted/50 border border-border rounded-lg ${className}`}>
      {/* Error Message */}
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center text-red-700 dark:text-red-400">
            <span className="text-sm font-medium">{submitError}</span>
          </div>
        </div>
      )}
      {/* RAG Insights Indicator */}
      {ragContext?.wasRAGEnhanced && ragContext.insights && ragContext.insights.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <button
            onClick={() => setShowRAGInsights(!showRAGInsights)}
            className="flex items-center w-full text-left"
          >
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              AI Learning Applied ({ragContext.insights.length} insights)
            </span>
            <span className="ml-auto text-blue-600 dark:text-blue-400">
              {showRAGInsights ? '−' : '+'}
            </span>
          </button>
          
          {showRAGInsights && (
            <div className="mt-2 space-y-1">
              {ragContext.insights.map((insight, idx) => (
                <div key={idx} className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                  <CheckCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span>{insight.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Feedback Section */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground mb-2">How's this content?</p>
          
          {/* Quick Helpful/Not Helpful Buttons */}
          <div className="flex items-center space-x-3 mb-3">
            <button
              onClick={() => handleHelpfulClick(true)}
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                wasHelpful === true
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted/50'
              }`}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Helpful
            </button>
            
            <button
              onClick={() => handleHelpfulClick(false)}
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                wasHelpful === false
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted/50'
              }`}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Not helpful
            </button>
          </div>

          {/* Star Rating */}
          <div className="mb-3">
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="md"
            />
          </div>
        </div>

        {/* Comment Section */}
        {(rating > 0 || wasHelpful !== null) && (
          <div>
            <button
              onClick={() => setShowComment(!showComment)}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {showComment ? 'Hide comment' : 'Add comment (optional)'}
            </button>
            
            {showComment && (
              <div className="mt-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any specific feedback to help us improve?"
                  className="w-full p-2 text-sm border border-input rounded-md resize-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {comment.length}/500 characters
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {(rating > 0 || wasHelpful !== null) && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmitFeedback}
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};