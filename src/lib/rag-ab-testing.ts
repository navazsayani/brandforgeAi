/**
 * Simple A/B Testing Framework for RAG System
 * 
 * This provides a lightweight A/B testing system to validate that RAG
 * actually improves content quality for early-stage validation.
 */

/**
 * Determines if a user should receive RAG-enhanced content
 * Uses a simple hash-based approach for consistent user assignment
 * 
 * @param userId - The user's unique identifier
 * @param ragPercentage - Percentage of users to receive RAG (0-100)
 * @returns true if user should get RAG, false for baseline
 */
export function shouldUseRAGForUser(userId: string, ragPercentage: number = 80): boolean {
  // Simple hash function to convert userId to a number
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Use modulo to get a consistent percentage assignment
  const userBucket = hash % 100;
  
  // Return true if user falls within the RAG percentage
  return userBucket < ragPercentage;
}

/**
 * A/B Test Configuration
 */
export interface ABTestConfig {
  testName: string;
  ragPercentage: number; // 0-100
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

/**
 * Default A/B test configuration for RAG system
 */
export const DEFAULT_RAG_AB_TEST: ABTestConfig = {
  testName: 'rag_effectiveness_test',
  ragPercentage: 80, // 80% get RAG, 20% get baseline
  isActive: true,
  startDate: new Date('2024-01-01'), // Adjust as needed
  // No end date - runs indefinitely until manually stopped
};

/**
 * Get the current A/B test configuration
 * In a production system, this would fetch from a database or config service
 */
export function getABTestConfig(): ABTestConfig {
  // For early stage, use environment variable or default
  const ragPercentage = process.env.RAG_AB_TEST_PERCENTAGE 
    ? parseInt(process.env.RAG_AB_TEST_PERCENTAGE, 10) 
    : DEFAULT_RAG_AB_TEST.ragPercentage;
    
  const isActive = process.env.RAG_AB_TEST_ACTIVE !== 'false'; // Default to active
  
  return {
    ...DEFAULT_RAG_AB_TEST,
    ragPercentage: Math.max(0, Math.min(100, ragPercentage)), // Clamp to 0-100
    isActive,
  };
}

/**
 * Determine if RAG should be used for a specific user and content type
 * This is the main function to use in AI flows
 */
export function shouldEnhanceWithRAG(
  userId: string, 
  contentType: 'social_media' | 'blog_post' | 'ad_campaign' | 'image' = 'social_media'
): { useRAG: boolean; testGroup: 'rag' | 'baseline'; reason: string } {
  const config = getABTestConfig();
  
  // If A/B testing is disabled, always use RAG
  if (!config.isActive) {
    return {
      useRAG: true,
      testGroup: 'rag',
      reason: 'A/B testing disabled - RAG always enabled'
    };
  }
  
  // Check if test is within date range
  const now = new Date();
  if (now < config.startDate) {
    return {
      useRAG: false,
      testGroup: 'baseline',
      reason: 'A/B test not started yet'
    };
  }
  
  if (config.endDate && now > config.endDate) {
    return {
      useRAG: true,
      testGroup: 'rag',
      reason: 'A/B test ended - RAG enabled for all'
    };
  }
  
  // Determine user's test group
  const useRAG = shouldUseRAGForUser(userId, config.ragPercentage);
  
  return {
    useRAG,
    testGroup: useRAG ? 'rag' : 'baseline',
    reason: `A/B test assignment: ${config.ragPercentage}% RAG, ${100 - config.ragPercentage}% baseline`
  };
}

/**
 * Log A/B test assignment for analytics
 * In production, this would send to your analytics service
 */
export function logABTestAssignment(
  userId: string,
  contentType: string,
  testGroup: 'rag' | 'baseline',
  contentId?: string
): void {
  console.log(`[A/B Test] User ${userId} assigned to ${testGroup} group for ${contentType}`, {
    userId,
    contentType,
    testGroup,
    contentId,
    timestamp: new Date().toISOString(),
    testName: DEFAULT_RAG_AB_TEST.testName
  });
  
  // In production, you might send this to your analytics service:
  // analytics.track('rag_ab_test_assignment', { userId, contentType, testGroup, contentId });
}

/**
 * Simple metrics collection for A/B test results
 * This would typically be handled by your analytics service
 */
export interface ABTestMetrics {
  testGroup: 'rag' | 'baseline';
  contentType: string;
  averageRating: number;
  totalFeedback: number;
  helpfulPercentage: number;
  lastUpdated: Date;
}

/**
 * Calculate A/B test performance metrics
 * This is a simplified version - in production you'd use proper analytics
 */
export function calculateABTestMetrics(
  feedbackData: Array<{
    testGroup: 'rag' | 'baseline';
    contentType: string;
    rating: number;
    wasHelpful?: boolean;
  }>
): ABTestMetrics[] {
  const grouped = feedbackData.reduce((acc, feedback) => {
    const key = `${feedback.testGroup}_${feedback.contentType}`;
    if (!acc[key]) {
      acc[key] = {
        testGroup: feedback.testGroup,
        contentType: feedback.contentType,
        ratings: [],
        helpfulCount: 0,
        totalCount: 0
      };
    }
    
    acc[key].ratings.push(feedback.rating);
    acc[key].totalCount++;
    if (feedback.wasHelpful) {
      acc[key].helpfulCount++;
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  return Object.values(grouped).map((group: any) => ({
    testGroup: group.testGroup,
    contentType: group.contentType,
    averageRating: group.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / group.ratings.length,
    totalFeedback: group.totalCount,
    helpfulPercentage: (group.helpfulCount / group.totalCount) * 100,
    lastUpdated: new Date()
  }));
}