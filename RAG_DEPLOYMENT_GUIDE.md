# RAG System Deployment Guide

## Prerequisites

1. **Firebase Project Setup**
   - Firebase project with Firestore enabled
   - Firebase Functions enabled
   - Firebase Storage enabled

2. **API Keys Required**
   - OpenAI API key (for embeddings)
   - Google AI API key (existing)
   - Fireworks AI API key (existing, optional)
   - Freepik API key (existing, optional)

## Step-by-Step Deployment

### Phase 1: Core RAG Infrastructure (Week 1-2)

#### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Add your API keys
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here
ENABLE_RAG=true
```

#### 2. Install Dependencies

```bash
# Install OpenAI SDK for embeddings
npm install openai

# Install Firebase Functions dependencies
cd functions
npm install firebase-admin firebase-functions
```

#### 3. Deploy Cloud Functions

```bash
# Deploy RAG trigger functions
firebase deploy --only functions:autoVectorizeBrandProfile
firebase deploy --only functions:autoVectorizeSocialMediaPost
firebase deploy --only functions:autoVectorizeBlogPost
firebase deploy --only functions:autoVectorizeAdCampaign
firebase deploy --only functions:autoVectorizeSavedImage
firebase deploy --only functions:autoVectorizeBrandLogo
firebase deploy --only functions:cleanupOldVectors
firebase deploy --only functions:updateUserBrandContext
```

#### 4. Initialize Firestore Security Rules

```javascript
// Add to firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // RAG vectors - user can only access their own
    match /users/{userId}/ragVectors/{vectorId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // RAG context cache
    match /users/{userId}/ragContext/{contextId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 5. Test Basic RAG Functionality

```bash
# Test embedding generation
node -e "
const { EmbeddingService } = require('./src/lib/rag-engine.ts');
const service = new EmbeddingService();
service.generateEmbedding('test content').then(console.log);
"
```

### Phase 2: Content Integration (Week 3-4)

#### 1. Enable RAG for Existing Users

Create a migration script to vectorize existing content:

```typescript
// scripts/migrate-existing-content.ts
import { batchVectorizeUserContent } from '../src/lib/rag-auto-vectorizer';

async function migrateExistingContent() {
  const users = await getAllUsers(); // Implement this
  
  for (const user of users) {
    try {
      await batchVectorizeUserContent(user.id);
      console.log(`Migrated content for user: ${user.id}`);
    } catch (error) {
      console.error(`Failed to migrate user ${user.id}:`, error);
    }
  }
}
```

#### 2. Monitor RAG Performance

Set up monitoring for:
- Vector storage usage
- Embedding generation costs
- Context retrieval latency
- User satisfaction metrics

#### 3. A/B Testing Setup

```typescript
// Feature flag for gradual rollout
const useRAG = process.env.ENABLE_RAG === 'true' && 
               Math.random() < 0.5; // 50% rollout

if (useRAG) {
  // Use RAG-enhanced generation
} else {
  // Use original generation
}
```

### Phase 3: Advanced Features (Month 2)

#### 1. Industry Intelligence

Implement cross-user pattern analysis:

```typescript
// Weekly industry analysis
export const analyzeIndustryTrends = onSchedule(
  '0 3 * * 1', // Every Monday at 3 AM
  async () => {
    const industries = await getActiveIndustries();
    
    for (const industry of industries) {
      await analyzeIndustryPatterns(industry);
      await updateIndustryIntelligence(industry);
    }
  }
);
```

#### 2. Performance Optimization

- Implement vector compression
- Add caching layers
- Optimize similarity search
- Batch processing for large datasets

#### 3. Advanced Analytics

```typescript
// RAG performance metrics
interface RAGMetrics {
  vectorCount: number;
  averageRetrievalTime: number;
  contextRelevanceScore: number;
  userSatisfactionRating: number;
  costPerGeneration: number;
}
```

## Monitoring & Maintenance

### 1. Cost Monitoring

```bash
# Monitor OpenAI API usage
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage

# Monitor Firebase usage
firebase projects:list
```

### 2. Performance Monitoring

Key metrics to track:
- **Vector Storage**: Monitor Firestore document count and size
- **Embedding Costs**: Track OpenAI API usage and costs
- **Retrieval Latency**: Monitor context retrieval times
- **User Engagement**: Track content performance improvements

### 3. Regular Maintenance

```bash
# Weekly vector cleanup (automated via Cloud Function)
# Manual cleanup if needed:
firebase functions:shell
> cleanupOldVectors()

# Monitor storage usage
firebase firestore:usage
```

## Troubleshooting

### Common Issues

1. **High Embedding Costs**
   ```typescript
   // Reduce embedding frequency
   const shouldReVectorize = (oldContent, newContent) => {
     const similarity = calculateSimilarity(oldContent, newContent);
     return similarity < 0.90; // Increase threshold
   };
   ```

2. **Slow Context Retrieval**
   ```typescript
   // Reduce context limit
   const ragContext = await ragEngine.retrieveRelevantContext(query, {
     limit: 5, // Reduce from 10
     minPerformance: 0.8 // Increase threshold
   });
   ```

3. **Storage Limits**
   ```typescript
   // More aggressive cleanup
   await ragEngine.cleanupOldVectors(userId, 60); // Keep 60 days instead of 90
   ```

### Error Handling

```typescript
// Graceful degradation
try {
  const enhancedPrompt = await enhancePromptWithRAG(basePrompt, userId);
  return enhancedPrompt;
} catch (error) {
  console.warn('RAG enhancement failed, using base prompt:', error);
  return basePrompt; // Fallback to original functionality
}
```

## Security Considerations

1. **Data Privacy**
   - User vectors are isolated per user
   - No cross-user data access
   - Industry patterns are anonymized

2. **API Key Security**
   ```bash
   # Use Firebase Functions config
   firebase functions:config:set openai.key="your-key-here"
   ```

3. **Rate Limiting**
   ```typescript
   // Implement rate limiting for embedding generation
   const rateLimiter = new RateLimiter({
     tokensPerInterval: 100,
     interval: 'minute'
   });
   ```

## Success Metrics

### Week 1-2 Targets
- [ ] RAG infrastructure deployed
- [ ] Basic vectorization working
- [ ] Cloud Functions operational

### Month 1 Targets
- [ ] 50% of users using RAG-enhanced generation
- [ ] 20% improvement in content consistency scores
- [ ] <500ms average context retrieval time

### Month 3 Targets
- [ ] 90% user adoption
- [ ] 40% improvement in content performance
- [ ] Industry intelligence patterns identified
- [ ] Cost per generation optimized

## Rollback Plan

If issues arise:

1. **Immediate Rollback**
   ```bash
   # Disable RAG via environment variable
   firebase functions:config:set rag.enabled=false
   firebase deploy --only functions
   ```

2. **Partial Rollback**
   ```typescript
   // Disable for specific content types
   const ragEnabled = {
     images: false,
     social: true,
     blog: true,
     ads: true
   };
   ```

3. **Data Cleanup**
   ```bash
   # Remove RAG vectors if needed
   firebase firestore:delete --recursive users/{userId}/ragVectors
   ```

This deployment guide ensures a smooth, phased rollout of the RAG system with proper monitoring, fallbacks, and optimization strategies.