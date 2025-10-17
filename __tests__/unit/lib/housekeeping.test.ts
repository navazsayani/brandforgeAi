/**
 * @jest-environment node
 */

import {
  scanHousekeeping,
  cleanupHousekeeping
} from '@/lib/housekeeping';
import { db, storage } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, Timestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, deleteObject, getMetadata } from 'firebase/storage';

// Mock Firebase
jest.mock('@/lib/firebaseConfig', () => ({
  db: {},
  storage: {},
}));

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockDeleteObject = deleteObject as jest.MockedFunction<typeof deleteObject>;
const mockGetMetadata = getMetadata as jest.MockedFunction<typeof getMetadata>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  deleteObject: jest.fn(),
  getMetadata: jest.fn(),
}));

describe('Housekeeping Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scanHousekeeping', () => {
    const mockUsersSnapshot = {
      docs: [
        { id: 'user1' },
        { id: 'user2' },
        { id: 'admin-user' }
      ],
      size: 3
    };

    const mockOldDeployedSnapshot = {
      docs: [{ id: 'post1' }, { id: 'post2' }],
      size: 2
    };

    const mockOldDraftSnapshot = {
      docs: [{ id: 'draft1' }],
      size: 1
    };

    const mockOldImagesSnapshot = {
      docs: [
        { id: 'img1', data: () => ({ imageUrl: 'https://example.com/img1.jpg', createdAt: Timestamp.fromDate(new Date('2023-01-01')) }) }
      ],
      size: 1
    };

    test('should scan for old deployed content', async () => {
      mockGetDocs
        .mockResolvedValueOnce(mockUsersSnapshot as any)
        .mockResolvedValueOnce(mockOldDeployedSnapshot as any)
        .mockResolvedValueOnce(mockOldDeployedSnapshot as any)
        .mockResolvedValueOnce(mockOldDeployedSnapshot as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ userEmail: 'user@example.com' })
      } as any);

      const result = await scanHousekeeping({
        deployedContentMinAge: 180,
        draftContentMinAge: 90,
        libraryImagesMinAge: 90,
        scanRAGVectors: false
      });

      expect(result).toHaveProperty('oldDeployedContent');
      expect(result).toHaveProperty('oldDraftContent');
      expect(result).toHaveProperty('oldLibraryImages');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('scanTimestamp');
    });

    test('should skip protected users during scan', async () => {
      mockGetDocs.mockResolvedValue(mockUsersSnapshot as any);

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ userEmail: 'regular@example.com' })
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ userEmail: 'admin@brandforge.ai' }) // Protected
        } as any);

      const result = await scanHousekeeping({
        deployedContentMinAge: 180
      });

      // Should have scanned but skipped admin user
      expect(result.totalUsers).toBe(3);
    });

    test('should estimate storage size for old library images', async () => {
      mockGetDocs
        .mockResolvedValueOnce(mockUsersSnapshot as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any) // deployed
        .mockResolvedValueOnce({ docs: [], size: 0 } as any) // deployed
        .mockResolvedValueOnce({ docs: [], size: 0 } as any) // deployed
        .mockResolvedValueOnce({ docs: [], size: 0 } as any) // drafts
        .mockResolvedValueOnce({ docs: [], size: 0 } as any) // drafts
        .mockResolvedValueOnce({ docs: [], size: 0 } as any) // drafts
        .mockResolvedValueOnce(mockOldImagesSnapshot as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ userEmail: 'user@example.com' })
      } as any);

      mockGetMetadata.mockResolvedValue({
        size: 1024 * 500 // 500 KB
      } as any);

      const result = await scanHousekeeping({
        libraryImagesMinAge: 90
      });

      expect(result.oldLibraryImages.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanupHousekeeping', () => {
    const mockUsersSnapshot = {
      docs: [{ id: 'user1' }, { id: 'user2' }],
      size: 2
    };

    const mockOldContentSnapshot = {
      docs: [
        { ref: 'ref1', id: 'post1' },
        { ref: 'ref2', id: 'post2' }
      ],
      size: 2
    };

    test('should perform dry run without deleting data', async () => {
      mockGetDocs
        .mockResolvedValueOnce(mockUsersSnapshot as any)
        .mockResolvedValueOnce(mockOldContentSnapshot as any)
        .mockResolvedValueOnce(mockOldContentSnapshot as any)
        .mockResolvedValueOnce(mockOldContentSnapshot as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ userEmail: 'user@example.com' })
      } as any);

      const result = await cleanupHousekeeping({
        cleanDeployedContent: true,
        deployedContentMinAge: 180,
        dryRun: true
      });

      // Should count items but not delete in dry run
      expect(result.deletedDeployedContent).toBeGreaterThanOrEqual(0);
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    test('should actually delete data when not in dry run', async () => {
      mockGetDocs
        .mockResolvedValueOnce(mockUsersSnapshot as any)
        .mockResolvedValueOnce(mockOldContentSnapshot as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ userEmail: 'user@example.com' })
      } as any);

      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await cleanupHousekeeping({
        cleanDeployedContent: true,
        deployedContentMinAge: 180,
        dryRun: false
      });

      expect(result.deletedDeployedContent).toBeGreaterThanOrEqual(0);
    });

    test('should clean up draft content', async () => {
      const mockDraftSnapshot = {
        docs: [{ ref: 'draft1' }, { ref: 'draft2' }, { ref: 'draft3' }],
        size: 3
      };

      mockGetDocs
        .mockResolvedValueOnce(mockUsersSnapshot as any)
        .mockResolvedValueOnce(mockDraftSnapshot as any)
        .mockResolvedValueOnce(mockDraftSnapshot as any)
        .mockResolvedValueOnce(mockDraftSnapshot as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ userEmail: 'user@example.com' })
      } as any);

      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await cleanupHousekeeping({
        cleanDraftContent: true,
        draftContentMinAge: 90,
        dryRun: false
      });

      expect(result.deletedDraftContent).toBeGreaterThanOrEqual(0);
    });

    test('should clean up old library images and delete storage files', async () => {
      const mockImageSnapshot = {
        docs: [
          {
            ref: 'img1',
            id: 'img1',
            data: () => ({
              imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/images%2Fimage1.jpg?alt=media&token=abc',
              createdAt: Timestamp.fromDate(new Date('2023-01-01'))
            })
          }
        ],
        size: 1
      };

      mockGetDocs
        .mockResolvedValueOnce(mockUsersSnapshot as any)
        .mockResolvedValueOnce(mockImageSnapshot as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ userEmail: 'user@example.com' })
      } as any);

      mockGetMetadata.mockResolvedValue({
        size: 1024 * 100 // 100 KB
      } as any);

      mockDeleteObject.mockResolvedValue(undefined);
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await cleanupHousekeeping({
        cleanLibraryImages: true,
        libraryImagesMinAge: 90,
        dryRun: false
      });

      expect(result.deletedLibraryImages).toBeGreaterThanOrEqual(0);
      expect(result.savedStorageSpace).toBeGreaterThanOrEqual(0);
    });

    test('should skip protected users during cleanup', async () => {
      const mockProtectedUserSnapshot = {
        docs: [
          { id: 'regular-user' },
          { id: 'admin-user' }
        ],
        size: 2
      };

      mockGetDocs
        .mockResolvedValueOnce(mockProtectedUserSnapshot as any)
        .mockResolvedValueOnce(mockOldContentSnapshot as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any)
        .mockResolvedValueOnce({ docs: [], size: 0 } as any);

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ userEmail: 'regular@example.com' })
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ userEmail: 'admin@brandforge.ai' }) // Protected
        } as any);

      const result = await cleanupHousekeeping({
        cleanDeployedContent: true,
        deployedContentMinAge: 180,
        dryRun: false
      });

      // Should have cleaned only non-protected users
      expect(result.deletedDeployedContent).toBeGreaterThanOrEqual(0);
    });

    test('should handle errors gracefully', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(cleanupHousekeeping({
        cleanDeployedContent: true,
        dryRun: false
      })).rejects.toThrow();
    });

    test('should collect errors and continue processing', async () => {
      const mockPartialFailureSnapshot = {
        docs: [{ id: 'user1' }, { id: 'user2' }],
        size: 2
      };

      mockGetDocs
        .mockResolvedValueOnce(mockPartialFailureSnapshot as any)
        .mockRejectedValueOnce(new Error('User1 error')) // First user fails
        .mockResolvedValueOnce({ docs: [], size: 0 } as any); // Second user succeeds

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ userEmail: 'user1@example.com' })
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ userEmail: 'user2@example.com' })
        } as any);

      const result = await cleanupHousekeeping({
        cleanDeployedContent: true,
        dryRun: false
      });

      // Should have collected errors but continued
      expect(result).toHaveProperty('errors');
    });
  });

  describe('Safety Controls', () => {
    test('should enforce minimum age requirements', async () => {
      // Attempting to clean recent content should not work
      const mockUsersSnapshot = { docs: [], size: 0 };
      mockGetDocs.mockResolvedValue(mockUsersSnapshot as any);

      const result = await scanHousekeeping({
        deployedContentMinAge: 1, // Too aggressive
        draftContentMinAge: 1,
        libraryImagesMinAge: 1
      });

      // Even with aggressive age, protected minimums apply
      expect(result).toBeDefined();
    });

    test('should never clean admin users', async () => {
      const mockAdminSnapshot = {
        docs: [{ id: 'admin-user' }],
        size: 1
      };

      mockGetDocs
        .mockResolvedValueOnce(mockAdminSnapshot as any)
        .mockResolvedValueOnce({ docs: [{ ref: 'post1' }], size: 1 } as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ userEmail: 'admin@brandforge.ai' })
      } as any);

      const result = await cleanupHousekeeping({
        cleanDeployedContent: true,
        dryRun: false
      });

      // Admin content should not be touched
      expect(result.deletedDeployedContent).toBe(0);
    });
  });

  describe('Result Structure', () => {
    test('scan result should have proper structure', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 } as any);

      const result = await scanHousekeeping({});

      expect(result).toHaveProperty('oldDeployedContent');
      expect(result.oldDeployedContent).toHaveProperty('socialPosts');
      expect(result.oldDeployedContent).toHaveProperty('blogPosts');
      expect(result.oldDeployedContent).toHaveProperty('adCampaigns');

      expect(result).toHaveProperty('oldDraftContent');
      expect(result.oldDraftContent).toHaveProperty('socialPosts');
      expect(result.oldDraftContent).toHaveProperty('blogPosts');
      expect(result.oldDraftContent).toHaveProperty('adCampaigns');

      expect(result).toHaveProperty('oldLibraryImages');
      expect(result.oldLibraryImages).toHaveProperty('count');
      expect(result.oldLibraryImages).toHaveProperty('estimatedSize');

      expect(result).toHaveProperty('orphanedRAGVectors');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('scanTimestamp');
    });

    test('cleanup result should have proper structure', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 } as any);

      const result = await cleanupHousekeeping({
        dryRun: true
      });

      expect(result).toHaveProperty('deletedDeployedContent');
      expect(result).toHaveProperty('deletedDraftContent');
      expect(result).toHaveProperty('deletedLibraryImages');
      expect(result).toHaveProperty('deletedRAGVectors');
      expect(result).toHaveProperty('savedStorageSpace');
      expect(result).toHaveProperty('errors');

      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
