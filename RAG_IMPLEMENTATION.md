# RAG Implementation for BrandForge AI

## Overview

This document describes the complete RAG (Retrieval-Augmented Generation) implementation for BrandForge AI using Firebase Vector Search. The system provides context-aware content generation, brand consistency, and intelligent recommendations that evolve dynamically with user content.

## Architecture

### Core Components

1. **RAG Engine** (`src/lib/rag-engine.ts`)
   - Vector storage and retrieval using Firebase Firestore
   - Cosine similarity search (Firebase Vector Search alternative)
   - Context processing and formatting
   - Performance-based content filtering

2. **Auto-Vectorization System** (`src/lib/rag-auto-vectorizer.ts`)
   - Automatic content vectorization for all content types
   - Dynamic updates when content changes
   - Performance tracking and optimization

3. **Cloud Functions Triggers** (`functions/src/rag-triggers.ts`)
   - Real-time vectorization on content creation/updates
   - Automatic cleanup of old vectors
   - Brand context maintenance

4. **RAG Integration Layer** (`src/lib/rag-integration.ts`)
   - Prompt enhancement for AI flows
   - Smart form suggestions
   - Content storage for future RAG

## Data Structure

### Firestore Collections

```
users/{userId}/
├── brandProfiles/{userId}                    # Brand profile data
├── ragVectors/                              # Vector embeddings
│   ├── {vectorId}                          # Individual vector documents
│   └── ...
├── ragContext/
│   └── summary                             # Cached brand context summary
└── brandProfiles/{userId}/
    ├── socialMediaPosts/{postId}           # Social media content
    ├── blogPosts/{postId}                  # Blog content
    ├── adCampaigns/{campaignId}            # Ad campaigns
    ├── savedLibraryImages/{imageId}        # Saved images
    └── brandLogos/{logoId}                 # Brand logos
```

### Vector Document Structure

```typescript
interface RAGVector {
  userId: string;
  contentType: 'brand_profile' | 'social_media' | 'blog_post' | 'ad_campaign' | 'saved_image' | 'brand_logo';
  contentId: string;
  embedding: number[];                      // 1536-dimensional vector
  metadata: {
    industry?: string;
    style?: string;
    performance?: number;                   // 0-1 performance score
    engagement?: number;
    platform?: string;
    tags?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: number;
  };
  textContent: string;                      // Original text for reference
  sourceCollection: string;
  sourceDocId: string;
}
```

## Implementation Details

### 1. Enhanced AI Flows

#### Image Generation (`src/ai/flows/generate-images.ts`)
- **RAG Enhancement**: Retrieves successful image styles and brand patterns
- **Context Integration**: Enhances prompts with proven visual approaches
- **Performance Tracking**: Stores generated images for future context

```typescript
// Enhanced prompt example
const enhancedPrompt = await enhanceImageGenerationPrompt(userId, basePrompt, {
  brandDescription,
  industry,
  imageStyle,
  exampleImage
});
```

#### Social Media Captions (`src/ai/flows/generate-social-media-caption.ts`)
- **Voice Consistency**: Retrieves successful brand voice patterns
- **Hashtag Intelligence**: Suggests effective hashtags based on past performance
- **Platform Optimization**: Tailors content for specific social platforms

#### Blog Content & Ad Campaigns
- **Content Patterns**: Learns from successful content structures
- **SEO Optimization**: Suggests keywords based on past performance
- **Campaign Intelligence**: Optimizes messaging based on conversion data

### 2. Auto-Vectorization System

#### Real-Time Triggers
All content creation/updates automatically trigger vectorization:

```typescript
// Cloud Function example
export const autoVectorizeSocialMediaPost = onDocumentWritten(
  'users/{userId}/brandProfiles/{profileId}/socialMediaPosts/{postId}',
  async (event) => {
    const { userId, postId } = event.params;
    const postData = event.data?.after?.data();
    
    if (postData) {
      await vectorizeSocialMediaPost(userId, postData, postId);
    }
  }
);
```

#### Dynamic Updates
- **Change Detection**: Only re-vectorizes on significant content changes (>15% difference)
- **Version Control**: Tracks content evolution over time
- **Performance Updates**: Updates vector metadata based on engagement metrics

### 3. Context Retrieval & Enhancement

#### Smart Context Retrieval
```typescript
const ragContext = await ragEngine.retrieveRelevantContext(queryText, {
  userId,
  contentType: 'social_media',
  industry: 'Technology',
  minPerformance: 0.7,
  limit: 10,
  includeIndustryPatterns: true,
  timeframe: '30days'
});
```

#### Context Processing
- **Brand Patterns**: Extracts consistent brand elements
- **Successful Styles**: Identifies high-performing approaches
- **Avoid Patterns**: Learns from low-performing content
- **Seasonal Trends**: Adapts to current time periods
- **Performance Insights**: Provides actionable recommendations

## Usage Examples

### 1. Enhanced Image