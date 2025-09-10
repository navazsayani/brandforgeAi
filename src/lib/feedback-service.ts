import { db } from '@/lib/firebaseConfig';
import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import type { 
  ContentFeedback, 
  RAGPerformanceMetrics, 
  RAGPatternStats, 
  FeedbackSubmission,
  RAGInsight 
} from '@/types/feedback';

export class FeedbackService {
  // Rate limiting: 10 feedback submissions per user per hour
  private static readonly FEEDBACK_RATE_LIMIT = 10;
  private static readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
  /**
   * Submit user feedback for generated content
   */
  async submitContentFeedback(
    userId: string,
    contentId: string,
    contentType: ContentFeedback['contentType'],
    feedback: FeedbackSubmission,
    ragContext?: {
      wasRAGEnhanced: boolean;
      ragContextUsed?: string[];
      ragInsights?: ContentFeedback['ragInsights'];
      platform?: string;
      language?: string;
    }
  ): Promise<void> {
    try {
      // 🔥 RATE LIMITING: Check recent feedback count
      await this.checkRateLimit(userId);
      const feedbackData: Omit<ContentFeedback, 'id'> & { [key: string]: any } = {
        contentId,
        userId,
        contentType,
        rating: (feedback.rating as 1 | 2 | 3 | 4 | 5) || 3,
        wasHelpful: feedback.wasHelpful,
        wasRAGEnhanced: ragContext?.wasRAGEnhanced || false,
        ragContextUsed: ragContext?.ragContextUsed || [],
        userComment: feedback.comment,
        platform: ragContext?.platform || 'unknown',
        language: ragContext?.language || 'english',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Only include ragInsights if it's defined and not empty
      if (ragContext?.ragInsights) {
        feedbackData.ragInsights = ragContext.ragInsights;
      }

      // Store feedback
      const feedbackRef = collection(db, `users/${userId}/contentFeedback`);
      await addDoc(feedbackRef, {
        ...feedbackData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update performance metrics
      await this.updatePerformanceMetrics(userId, feedbackData as Omit<ContentFeedback, 'id'>);

      // Update pattern stats if RAG was used
      if (ragContext?.wasRAGEnhanced && ragContext.ragContextUsed?.length) {
        await this.updatePatternStats(userId, ragContext.ragContextUsed, feedback.rating || 3);
      }

      console.log(`[Feedback] Submitted feedback for content ${contentId}`);
    } catch (error) {
      console.error(`[Feedback] Error submitting feedback:`, error);
      // Don't throw - feedback failures shouldn't break user experience
    }
  }

  /**
   * Update user's RAG performance metrics
   */
  private async updatePerformanceMetrics(
    userId: string, 
    feedback: Omit<ContentFeedback, 'id'>
  ): Promise<void> {
    try {
      const metricsRef = doc(db, `users/${userId}/ragMetrics/performance`);
      const metricsDoc = await getDoc(metricsRef);

      if (!metricsDoc.exists()) {
        // Create initial metrics
        const initialMetrics: RAGPerformanceMetrics = {
          userId,
          totalFeedback: 1,
          ragEnhancedFeedback: feedback.wasRAGEnhanced ? 1 : 0,
          nonRAGFeedback: feedback.wasRAGEnhanced ? 0 : 1,
          avgRatingRAG: feedback.wasRAGEnhanced ? feedback.rating : 0,
          avgRatingNonRAG: feedback.wasRAGEnhanced ? 0 : feedback.rating,
          helpfulnessRateRAG: feedback.wasRAGEnhanced && feedback.wasHelpful ? 100 : 0,
          helpfulnessRateNonRAG: !feedback.wasRAGEnhanced && feedback.wasHelpful ? 100 : 0,
          lastUpdated: new Date()
        };

        await setDoc(metricsRef, {
          ...initialMetrics,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Update existing metrics
        const currentMetrics = metricsDoc.data() as RAGPerformanceMetrics;
        
        const newTotalFeedback = currentMetrics.totalFeedback + 1;
        let newRAGCount = currentMetrics.ragEnhancedFeedback;
        let newNonRAGCount = currentMetrics.nonRAGFeedback;
        let newAvgRAG = currentMetrics.avgRatingRAG;
        let newAvgNonRAG = currentMetrics.avgRatingNonRAG;

        if (feedback.wasRAGEnhanced) {
          newRAGCount += 1;
          // Calculate new average for RAG-enhanced content
          newAvgRAG = ((currentMetrics.avgRatingRAG * currentMetrics.ragEnhancedFeedback) + feedback.rating) / newRAGCount;
        } else {
          newNonRAGCount += 1;
          // Calculate new average for non-RAG content
          newAvgNonRAG = ((currentMetrics.avgRatingNonRAG * currentMetrics.nonRAGFeedback) + feedback.rating) / newNonRAGCount;
        }

        await updateDoc(metricsRef, {
          totalFeedback: newTotalFeedback,
          ragEnhancedFeedback: newRAGCount,
          nonRAGFeedback: newNonRAGCount,
          avgRatingRAG: newAvgRAG,
          avgRatingNonRAG: newAvgNonRAG,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error(`[Feedback] Error updating performance metrics:`, error);
    }
  }

  /**
   * Update pattern success statistics
   */
  private async updatePatternStats(
    userId: string, 
    patterns: string[], 
    rating: number
  ): Promise<void> {
    try {
      const statsRef = doc(db, `users/${userId}/ragMetrics/patterns`);
      const statsDoc = await getDoc(statsRef);

      const patternUpdates: Record<string, any> = {};
      
      for (const pattern of patterns) {
        if (statsDoc.exists()) {
          const currentStats = statsDoc.data() as RAGPatternStats;
          const currentPattern = currentStats.patterns?.[pattern];
          
          if (currentPattern) {
            const newTotalCount = currentPattern.totalCount + 1;
            const newSuccessCount = rating >= 4 ? currentPattern.successCount + 1 : currentPattern.successCount;
            const newAvgRating = ((currentPattern.avgRating * currentPattern.totalCount) + rating) / newTotalCount;
            
            patternUpdates[`patterns.${pattern}`] = {
              successCount: newSuccessCount,
              totalCount: newTotalCount,
              avgRating: newAvgRating,
              lastUsed: serverTimestamp()
            };
          } else {
            patternUpdates[`patterns.${pattern}`] = {
              successCount: rating >= 4 ? 1 : 0,
              totalCount: 1,
              avgRating: rating,
              lastUsed: serverTimestamp()
            };
          }
        } else {
          patternUpdates[`patterns.${pattern}`] = {
            successCount: rating >= 4 ? 1 : 0,
            totalCount: 1,
            avgRating: rating,
            lastUsed: serverTimestamp()
          };
        }
      }

      if (Object.keys(patternUpdates).length > 0) {
        await setDoc(statsRef, {
          userId,
          ...patternUpdates,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error(`[Feedback] Error updating pattern stats:`, error);
    }
  }

  /**
   * Get user's RAG performance metrics
   */
  async getPerformanceMetrics(userId: string): Promise<RAGPerformanceMetrics | null> {
    try {
      const metricsRef = doc(db, `users/${userId}/ragMetrics/performance`);
      const metricsDoc = await getDoc(metricsRef);
      
      if (metricsDoc.exists()) {
        return metricsDoc.data() as RAGPerformanceMetrics;
      }
      return null;
    } catch (error) {
      console.error(`[Feedback] Error getting performance metrics:`, error);
      return null;
    }
  }

  /**
   * Get user's pattern statistics
   */
  async getPatternStats(userId: string): Promise<RAGPatternStats | null> {
    try {
      const statsRef = doc(db, `users/${userId}/ragMetrics/patterns`);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data() as RAGPatternStats;
      }
      return null;
    } catch (error) {
      console.error(`[Feedback] Error getting pattern stats:`, error);
      return null;
    }
  }

  /**
   * Get recent feedback for a user
   */
  async getRecentFeedback(userId: string, limit: number = 10): Promise<ContentFeedback[]> {
    try {
      const feedbackRef = collection(db, `users/${userId}/contentFeedback`);
      const feedbackQuery = query(
        feedbackRef,
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const feedbackDocs = await getDocs(feedbackQuery);
      return feedbackDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContentFeedback));
    } catch (error) {
      console.error(`[Feedback] Error getting recent feedback:`, error);
      return [];
    }
  }

  /**
   * Check if RAG is performing better than non-RAG content
   */
  async isRAGPerformingWell(userId: string): Promise<{
    isPerforming: boolean;
    ragAvg: number;
    nonRAGAvg: number;
    confidence: 'low' | 'medium' | 'high';
  }> {
    try {
      const metrics = await this.getPerformanceMetrics(userId);
      
      if (!metrics || metrics.totalFeedback < 5) {
        return {
          isPerforming: true, // Default to true for new users
          ragAvg: 0,
          nonRAGAvg: 0,
          confidence: 'low'
        };
      }

      const ragAvg = metrics.avgRatingRAG;
      const nonRAGAvg = metrics.avgRatingNonRAG;
      const isPerforming = ragAvg >= nonRAGAvg;
      
      // Determine confidence based on sample size
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (metrics.totalFeedback >= 20) confidence = 'high';
      else if (metrics.totalFeedback >= 10) confidence = 'medium';

      return {
        isPerforming,
        ragAvg,
        nonRAGAvg,
        confidence
      };
    } catch (error) {
      console.error(`[Feedback] Error checking RAG performance:`, error);
      return {
        isPerforming: true,
        ragAvg: 0,
        nonRAGAvg: 0,
        confidence: 'low'
      };
    }
  }

  /**
   * Check if user has exceeded feedback rate limit
   */
  private async checkRateLimit(userId: string): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - FeedbackService.RATE_LIMIT_WINDOW);
      const feedbackRef = collection(db, `users/${userId}/contentFeedback`);
      const recentFeedbackQuery = query(
        feedbackRef,
        where('timestamp', '>', oneHourAgo),
        firestoreLimit(FeedbackService.FEEDBACK_RATE_LIMIT + 1)
      );
      
      const recentFeedback = await getDocs(recentFeedbackQuery);
      const recentCount = recentFeedback.docs.length;
      
      if (recentCount >= FeedbackService.FEEDBACK_RATE_LIMIT) {
        throw new Error(`Rate limit exceeded. You can only submit ${FeedbackService.FEEDBACK_RATE_LIMIT} feedback items per hour. Please wait before submitting more feedback.`);
      }
      
      console.log(`[Feedback Rate Limit] User ${userId}: ${recentCount}/${FeedbackService.FEEDBACK_RATE_LIMIT} submissions in the last hour`);
    } catch (error: any) {
      if (error.message.includes('Rate limit exceeded')) {
        throw error; // Re-throw rate limit errors
      }
      console.warn(`[Feedback Rate Limit] Failed to check rate limit for user ${userId}:`, error);
      // Don't throw other errors - allow feedback submission to continue
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();
