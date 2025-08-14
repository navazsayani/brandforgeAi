'use client';

import React from 'react';
import { ContentFeedbackWidget, RAGInsightsBadge, FeedbackErrorBoundary } from '@/components/feedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import type { ContentFeedback, RAGInsight } from '@/types/feedback';

interface ContentWithFeedbackProps {
  userId: string;
  contentId: string;
  contentType: ContentFeedback['contentType'];
  title: string;
  content: React.ReactNode;
  ragMetadata?: {
    wasRAGEnhanced: boolean;
    ragInsights?: RAGInsight[];
    ragContextUsed?: string[];
  };
  onFeedbackSubmitted?: (feedback: any) => void;
  className?: string;
}

/**
 * Wrapper component that adds feedback functionality to any generated content
 * This can be used to wrap social media posts, blog content, images, etc.
 */
export const ContentWithFeedback: React.FC<ContentWithFeedbackProps> = ({
  userId,
  contentId,
  contentType,
  title,
  content,
  ragMetadata,
  onFeedbackSubmitted,
  className = ''
}) => {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {title}
            {ragMetadata?.wasRAGEnhanced && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* RAG Insights Badge */}
        {ragMetadata?.wasRAGEnhanced && ragMetadata.ragInsights && (
          <RAGInsightsBadge 
            insights={ragMetadata.ragInsights}
            isVisible={true}
          />
        )}
        
        {/* Main Content */}
        <div>
          {content}
        </div>
        
        {/* Feedback Widget with Error Boundary */}
        <FeedbackErrorBoundary>
          <ContentFeedbackWidget
            userId={userId}
            contentId={contentId}
            contentType={contentType}
            ragContext={{
              wasRAGEnhanced: ragMetadata?.wasRAGEnhanced || false,
              ragContextUsed: ragMetadata?.ragContextUsed,
              ragInsights: ragMetadata?.ragInsights ? {
                brandPatterns: ragMetadata.ragInsights.some(i => i.type === 'brand_patterns'),
                voicePatterns: ragMetadata.ragInsights.some(i => i.type === 'voice_patterns'),
                effectiveHashtags: ragMetadata.ragInsights.some(i => i.type === 'hashtags'),
                successfulStyles: ragMetadata.ragInsights.some(i => i.type === 'styles'),
                performanceInsights: ragMetadata.ragInsights.some(i => i.type === 'performance'),
              } : undefined,
              insights: ragMetadata?.ragInsights
            }}
            onFeedbackSubmitted={onFeedbackSubmitted}
          />
        </FeedbackErrorBoundary>
      </CardContent>
    </Card>
  );
};

// Example usage components for different content types

export const SocialPostWithFeedback: React.FC<{
  userId: string;
  post: {
    id: string;
    caption: string;
    hashtags: string;
    imageSrc?: string | null;
  };
  ragMetadata?: ContentWithFeedbackProps['ragMetadata'];
}> = ({ userId, post, ragMetadata }) => {
  const content = (
    <div className="space-y-3">
      {post.imageSrc && (
        <div className="relative w-32 h-32 border rounded-md overflow-hidden">
          <img
            src={post.imageSrc}
            alt="Social post"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Caption:</p>
        <div className="p-3 border border-border rounded-md bg-muted/50">
          <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Hashtags:</p>
        <div className="p-3 border border-border rounded-md bg-muted/50">
          <p className="text-sm break-words">{post.hashtags}</p>
        </div>
      </div>
    </div>
  );

  return (
    <ContentWithFeedback
      userId={userId}
      contentId={post.id}
      contentType="social_media"
      title="Generated Social Post"
      content={content}
      ragMetadata={ragMetadata}
    />
  );
};

export const BlogPostWithFeedback: React.FC<{
  userId: string;
  post: {
    id: string;
    title: string;
    content: string;
    tags: string;
  };
  ragMetadata?: ContentWithFeedbackProps['ragMetadata'];
}> = ({ userId, post, ragMetadata }) => {
  const content = (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Title:</p>
        <div className="p-3 border border-border rounded-md bg-muted/50">
          <p className="text-lg font-medium">{post.title}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Content:</p>
        <div className="p-4 border border-border rounded-md bg-muted/50 max-h-60 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            {post.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-2">{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Tags:</p>
        <div className="p-3 border border-border rounded-md bg-muted/50">
          <p className="text-sm">{post.tags}</p>
        </div>
      </div>
    </div>
  );

  return (
    <ContentWithFeedback
      userId={userId}
      contentId={post.id}
      contentType="blog_post"
      title="Generated Blog Post"
      content={content}
      ragMetadata={ragMetadata}
    />
  );
};