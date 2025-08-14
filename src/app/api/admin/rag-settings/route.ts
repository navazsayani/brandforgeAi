import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface RAGSystemConfig {
  rateLimiting: {
    enabled: boolean;
    globalMaxPerHour: number;
    globalMaxPerDay: number;
    userMaxPerHour: number;
    userMaxPerDay: number;
  };
  vectorCleanup: {
    enabled: boolean;
    retentionDays: number;
    minPerformanceThreshold: number;
  };
  embedding: {
    model: string;
    dimensions: number;
    costPer1K: number;
  };
  performance: {
    similarityThreshold: number;
    maxContextLength: number;
    cacheEnabled: boolean;
    cacheTTL: number;
  };
}

const DEFAULT_CONFIG: RAGSystemConfig = {
  rateLimiting: {
    enabled: false,
    globalMaxPerHour: 1000,
    globalMaxPerDay: 10000,
    userMaxPerHour: 50,
    userMaxPerDay: 500
  },
  vectorCleanup: {
    enabled: true,
    retentionDays: 90,
    minPerformanceThreshold: 0.3
  },
  embedding: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    costPer1K: 0.02
  },
  performance: {
    similarityThreshold: 0.7,
    maxContextLength: 8000,
    cacheEnabled: true,
    cacheTTL: 3600
  }
};

// GET - Fetch RAG system settings
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const adminEmail = request.headers.get('x-admin-email');
    if (adminEmail !== 'admin@brandforge.ai') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    console.log('[RAG Settings API] Fetching system configuration...');

    // Get settings from Firestore
    const settingsDoc = await getDoc(doc(db, 'adminSettings', 'ragSystemConfig'));
    
    let config = DEFAULT_CONFIG;
    if (settingsDoc.exists()) {
      const savedConfig = settingsDoc.data();
      // Merge with defaults to ensure all fields are present
      config = {
        rateLimiting: { ...DEFAULT_CONFIG.rateLimiting, ...savedConfig.rateLimiting },
        vectorCleanup: { ...DEFAULT_CONFIG.vectorCleanup, ...savedConfig.vectorCleanup },
        embedding: { ...DEFAULT_CONFIG.embedding, ...savedConfig.embedding },
        performance: { ...DEFAULT_CONFIG.performance, ...savedConfig.performance }
      };
    }

    return NextResponse.json({ config });

  } catch (error) {
    console.error('[RAG Settings API] Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RAG settings' },
      { status: 500 }
    );
  }
}

// POST - Update RAG system settings
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const adminEmail = request.headers.get('x-admin-email');
    if (adminEmail !== 'admin@brandforge.ai') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration data is required' },
        { status: 400 }
      );
    }

    console.log('[RAG Settings API] Updating system configuration...');

    // Validate configuration
    const validationError = validateConfig(config);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Save configuration with metadata
    const configWithMetadata = {
      ...config,
      lastUpdated: new Date(),
      updatedBy: adminEmail,
      version: Date.now()
    };

    await setDoc(doc(db, 'adminSettings', 'ragSystemConfig'), configWithMetadata);

    // Also update the legacy rate limiting document for backward compatibility
    if (config.rateLimiting) {
      await setDoc(doc(db, 'adminSettings', 'ragRateLimiting'), {
        enabled: config.rateLimiting.enabled,
        maxEmbeddingsPerHour: config.rateLimiting.userMaxPerHour,
        maxEmbeddingsPerDay: config.rateLimiting.userMaxPerDay,
        globalMaxPerHour: config.rateLimiting.globalMaxPerHour,
        globalMaxPerDay: config.rateLimiting.globalMaxPerDay,
        updatedAt: new Date(),
        updatedBy: adminEmail
      });
    }

    console.log('[RAG Settings API] Configuration updated successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'RAG system settings updated successfully' 
    });

  } catch (error) {
    console.error('[RAG Settings API] Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update RAG settings' },
      { status: 500 }
    );
  }
}

function validateConfig(config: any): string | null {
  try {
    // Validate rate limiting settings
    if (config.rateLimiting) {
      const rl = config.rateLimiting;
      if (typeof rl.enabled !== 'boolean') {
        return 'Rate limiting enabled must be a boolean';
      }
      if (rl.enabled) {
        if (!Number.isInteger(rl.globalMaxPerHour) || rl.globalMaxPerHour < 1) {
          return 'Global max per hour must be a positive integer';
        }
        if (!Number.isInteger(rl.globalMaxPerDay) || rl.globalMaxPerDay < 1) {
          return 'Global max per day must be a positive integer';
        }
        if (!Number.isInteger(rl.userMaxPerHour) || rl.userMaxPerHour < 1) {
          return 'User max per hour must be a positive integer';
        }
        if (!Number.isInteger(rl.userMaxPerDay) || rl.userMaxPerDay < 1) {
          return 'User max per day must be a positive integer';
        }
        if (rl.userMaxPerHour > rl.globalMaxPerHour) {
          return 'User max per hour cannot exceed global max per hour';
        }
        if (rl.userMaxPerDay > rl.globalMaxPerDay) {
          return 'User max per day cannot exceed global max per day';
        }
      }
    }

    // Validate vector cleanup settings
    if (config.vectorCleanup) {
      const vc = config.vectorCleanup;
      if (typeof vc.enabled !== 'boolean') {
        return 'Vector cleanup enabled must be a boolean';
      }
      if (vc.enabled) {
        if (!Number.isInteger(vc.retentionDays) || vc.retentionDays < 1) {
          return 'Retention days must be a positive integer';
        }
        if (typeof vc.minPerformanceThreshold !== 'number' || vc.minPerformanceThreshold < 0 || vc.minPerformanceThreshold > 1) {
          return 'Min performance threshold must be a number between 0 and 1';
        }
      }
    }

    // Validate embedding settings
    if (config.embedding) {
      const emb = config.embedding;
      if (typeof emb.model !== 'string' || emb.model.trim() === '') {
        return 'Embedding model must be a non-empty string';
      }
      if (!Number.isInteger(emb.dimensions) || emb.dimensions < 1) {
        return 'Embedding dimensions must be a positive integer';
      }
      if (typeof emb.costPer1K !== 'number' || emb.costPer1K < 0) {
        return 'Cost per 1K must be a non-negative number';
      }
    }

    // Validate performance settings
    if (config.performance) {
      const perf = config.performance;
      if (typeof perf.similarityThreshold !== 'number' || perf.similarityThreshold < 0 || perf.similarityThreshold > 1) {
        return 'Similarity threshold must be a number between 0 and 1';
      }
      if (!Number.isInteger(perf.maxContextLength) || perf.maxContextLength < 1) {
        return 'Max context length must be a positive integer';
      }
      if (typeof perf.cacheEnabled !== 'boolean') {
        return 'Cache enabled must be a boolean';
      }
      if (perf.cacheEnabled) {
        if (!Number.isInteger(perf.cacheTTL) || perf.cacheTTL < 1) {
          return 'Cache TTL must be a positive integer';
        }
      }
    }

    return null; // No validation errors
  } catch (error) {
    return 'Invalid configuration format';
  }
}