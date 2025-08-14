import { NextRequest, NextResponse } from 'next/server';
import { cleanupOrphanedImagesForUser, cleanupStorageOrphansForUser } from '@/lib/cleanup-orphaned-images';

export async function POST(request: NextRequest) {
  try {
    const { userId, adminEmail, dryRun = true, deleteStorageFiles = true } = await request.json();

    // Verify admin access
    if (adminEmail !== 'admin@brandforge.ai') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Admin Cleanup User] Starting cleanup for user ${userId}`);
    console.log(`[Admin Cleanup User] Dry run: ${dryRun}, Delete storage files: ${deleteStorageFiles}`);

    // Phase 1: Clean up database orphans (and their storage files)
    const dbCleanupResult = await cleanupOrphanedImagesForUser(userId, dryRun, deleteStorageFiles);
    
    // Phase 2: Clean up storage orphans (files without DB references)
    const storageCleanupResult = await cleanupStorageOrphansForUser(userId, dryRun);

    const result = {
      userId,
      dryRun,
      phase1: {
        totalOrphanedCount: dbCleanupResult.totalOrphanedCount,
        exampleImagesOrphaned: dbCleanupResult.exampleImages.orphanedCount,
        libraryImagesOrphaned: dbCleanupResult.libraryImages.orphanedCount,
        storageFilesDeleted: dbCleanupResult.storageFilesDeleted || 0
      },
      phase2: {
        totalFiles: storageCleanupResult.totalFiles,
        orphanedFiles: storageCleanupResult.orphanedFiles,
        deletedFiles: storageCleanupResult.deletedFiles,
        savedSpace: storageCleanupResult.savedSpace,
        errors: storageCleanupResult.errors
      },
      summary: {
        totalDbReferencesProcessed: dbCleanupResult.totalOrphanedCount,
        totalStorageFilesDeleted: (dbCleanupResult.storageFilesDeleted || 0) + storageCleanupResult.deletedFiles,
        totalSpaceSaved: storageCleanupResult.savedSpace,
        hasErrors: storageCleanupResult.errors.length > 0
      }
    };

    console.log(`[Admin Cleanup User] Completed cleanup for user ${userId}:`, result.summary);

    return NextResponse.json({
      success: true,
      data: result,
      message: dryRun 
        ? `Dry run completed for user ${userId}. Would process ${result.summary.totalDbReferencesProcessed} DB orphans and delete ${result.summary.totalStorageFilesDeleted} storage files.`
        : `Cleanup completed for user ${userId}. Processed ${result.summary.totalDbReferencesProcessed} DB orphans and deleted ${result.summary.totalStorageFilesDeleted} storage files.`
    });

  } catch (error: any) {
    console.error('[Admin Cleanup User] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Cleanup failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Admin User Cleanup API',
    usage: 'POST with { userId, adminEmail, dryRun?, deleteStorageFiles? }',
    description: 'Test cleanup functionality for individual users'
  });
}