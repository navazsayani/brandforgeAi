/**
 * Feedback system types for RAG performance tracking
 */

export interface ContentFeedback {
  id?: string;
  contentId: string;
  userId: string;
  contentType: 'social_media' | 'blog_post' | 'ad_campaign' | 'image' | 'brand_logo';
  rating: 1 | 2 | 3 | 4 | 5; // Star rating
  wasHelpful?: boolean; // Simple yes/no feedback
  wasRAGEnhanced: boolean;
  ragContextUsed?: string[]; // Which RAG patterns were applied
  ragInsights?: {
    brandPatterns?: boolean;
    voicePatterns?: boolean;
    effectiveHashtags?: boolean;
    successfulStyles?: boolean;
    performanceInsights?: boolean;
  };
  userComment?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGPerformanceMetrics {
  userId: string;
  totalFeedback: number;
  ragEnhancedFeedback: number;
  nonRAGFeedback: number;
  avgRatingRAG: number;
  avgRatingNonRAG: number;
  helpfulnessRateRAG: number; // Percentage of "helpful" responses for RAG content
  helpfulnessRateNonRAG: number;
  lastUpdated: Date;
}

export interface RAGPatternStats {
  userId: string;
  patterns: Record<string, {
    successCount: number;
    totalCount: number;
    avgRating: number;
    lastUsed: Date;
  }>;
  lastUpdated: Date;
}

export interface RAGInsight {
  type: 'brand_patterns' | 'voice_patterns' | 'hashtags' | 'styles' | 'performance';
  description: string;
  confidence: number; // 0-1 score
  isActive: boolean;
}

export interface FeedbackSubmission {
  contentId: string;
  rating?: number;
  wasHelpful?: boolean;
  comment?: string;
}