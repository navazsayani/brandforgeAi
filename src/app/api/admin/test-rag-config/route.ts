import { NextRequest, NextResponse } from 'next/server';
import { ragEngine, EmbeddingService } from '@/lib/rag-engine';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test RAG Config] Testing RAG system configuration integration...');
    
    // Test 1: Load system configuration
    const config = await ragEngine.loadSystemConfig();
    console.log('[Test RAG Config] Loaded configuration:', JSON.stringify(config, null, 2));
    
    // Test 2: Test embedding generation with configuration
    const testUserId = 'test-user-123';
    const testText = "This is a test for RAG configuration integration";
    const embeddingService = new EmbeddingService(ragEngine);
    const embedding = await embeddingService.generateEmbedding(testText);
    console.log('[Test RAG Config] Generated embedding dimensions:', embedding.length);
    
    // Test 3: Test context retrieval with configuration
    const contextOptions = {
      userId: testUserId,
      contentType: 'blog_post' as const,
      limit: 5
    };
    
    const context = await ragEngine.retrieveRelevantContext(testText, contextOptions);
    console.log('[Test RAG Config] Retrieved context structure:', Object.keys(context));
    
    return NextResponse.json({
      success: true,
      message: 'RAG configuration integration test completed successfully',
      results: {
        configLoaded: !!config,
        rateLimitingEnabled: config.rateLimiting?.enabled || false,
        embeddingModel: config.embedding?.model || 'default',
        embeddingDimensions: config.embedding?.dimensions || 1536,
        similarityThreshold: config.performance?.similarityThreshold || 0.7,
        maxContextLength: config.performance?.maxContextLength || 8000,
        vectorCleanupEnabled: config.vectorCleanup?.enabled || false,
        retentionDays: config.vectorCleanup?.retentionDays || 90,
        generatedEmbeddingDimensions: embedding.length,
        contextFields: Object.keys(context)
      }
    });
    
  } catch (error: any) {
    console.error('[Test RAG Config] Error testing RAG configuration:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to test RAG configuration integration'
    }, { status: 500 });
  }
}