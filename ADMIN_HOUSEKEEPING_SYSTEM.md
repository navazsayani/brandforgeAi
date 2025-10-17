# Admin Housekeeping & Cleanup System

## Overview

A comprehensive admin system for managing system resources, cleaning up orphaned data, and performing regular housekeeping tasks. The system includes extensive safety controls and provides both orphaned images cleanup and general housekeeping functionality.

## Components

### 1. Orphaned Images Cleanup (`/admin/cleanup`)
**Purpose**: Clean up database references to non-existent storage files and vice versa

**Features**:
- **Phase 1**: Remove database references pointing to missing storage files
- **Phase 2**: Find and delete storage files without database references (reverse orphans)
- **Phase 3**: Remove dormant/inactive brand logos (older than configurable threshold)

**Safety Controls**:
- Admin-only access (`admin@brandforge.ai`)
- 7-day minimum age for storage orphan deletion
- Skips active brand logos
- Optional storage file deletion
- Comprehensive error handling

**Files**:
- UI: `/src/app/(authenticated)/admin/cleanup/page.tsx`
- Logic: `/src/lib/cleanup-orphaned-images.ts`
- Actions: `handleAdminScanOrphanedImagesAction`, `handleAdminCleanupOrphanedImagesAction`

---

### 2. Comprehensive Housekeeping (`/admin/housekeeping`)
**Purpose**: Clean up old content, library images, and manage system resources

**Features**:
- **Old Deployed Content Cleanup**: Remove deployed posts/blogs/ads older than threshold (default: 180 days)
- **Old Draft Content Cleanup**: Remove draft posts/blogs/ads never deployed (default: 90 days)
- **Old Library Images Cleanup**: Remove generated images from library (default: 90 days)
- **RAG Vectors Cleanup**: Remove orphaned vector embeddings (coming soon)

**Safety Controls**:
- Admin-only access (`admin@brandforge.ai`)
- Dry run mode (preview without deleting)
- Protected users (admin accounts never cleaned)
- Configurable minimum age thresholds (30+ days minimum)
- Selective cleanup (choose what to clean)
- Confirmation required
- At least one option must be selected

**Files**:
- UI: `/src/app/(authenticated)/admin/housekeeping/page.tsx`
- Logic: `/src/lib/housekeeping.ts`
- Actions: `handleAdminScanHousekeepingAction`, `handleAdminCleanupHousekeepingAction`
- Types: `/src/types/index.ts` (HousekeepingScanResult, HousekeepingCleanupResult)

---

## Safety Features Summary

### 🛡️ Multi-Layer Protection

1. **Authentication Layer**:
   - Only `admin@brandforge.ai` can access
   - All actions verify admin email
   - Unauthorized access is immediately rejected

2. **Protected Users**:
   - Admin accounts are never cleaned up
   - Protected user list maintained in constants
   - Checked before any cleanup operation

3. **Age Thresholds**:
   - Deployed Content: Minimum 30 days, default 180 days
   - Draft Content: Minimum 30 days, default 90 days
   - Library Images: Minimum 30 days, default 90 days
   - Storage Orphans: Minimum 7 days (hardcoded for safety)

4. **Dry Run Mode**:
   - Preview cleanup without deleting
   - Enabled by default
   - Must be explicitly disabled to perform actual cleanup

5. **Selective Cleanup**:
   - Choose exactly what to clean
   - At least one option must be selected
   - Each category can be independently controlled

6. **Scan Before Cleanup**:
   - Must run scan first to see what will be affected
   - Results are displayed before cleanup
   - Cleanup button disabled without scan results

7. **Error Handling**:
   - Comprehensive try-catch blocks
   - Failed operations are logged but don't stop the entire cleanup
   - Error count reported to admin

8. **Audit Trail**:
   - All operations logged to console
   - Success/failure status tracked
   - Detailed metrics provided (items deleted, space saved)

---

## Usage Workflow

### Orphaned Images Cleanup

1. **Access**: Navigate to `/admin/cleanup`
2. **Scan**: Click "Scan for Orphaned Images"
3. **Review**: Check scan results (brand images, library images, logos)
4. **Configure**: Choose whether to delete actual storage files
5. **Cleanup**: Click "Clean Up Orphaned Images"
6. **Verify**: Review cleanup results and storage space saved

### Housekeeping Cleanup

1. **Access**: Navigate to `/admin/housekeeping`
2. **Configure**: Set minimum age thresholds for each content type
3. **Select**: Choose what to clean (deployed, drafts, library images)
4. **Dry Run**: Keep dry run enabled for first run
5. **Scan**: Click "Scan Housekeeping Items"
6. **Review**: Check scan results for each category
7. **Preview**: Click "Preview Cleanup (Dry Run)" to see what would be deleted
8. **Execute**: Disable dry run and click "Execute Cleanup"
9. **Verify**: Review cleanup results

---

## Technical Details

### Database Structure

**Content Collections**:
```
users/{userId}/brandProfiles/{userId}/
  ├── socialMediaPosts/
  ├── blogPosts/
  ├── adCampaigns/
  ├── generatedImages/
  └── brandLogos/
```

### Cleanup Logic

**Deployed Content**:
- Query: `status == 'deployed' AND createdAt < cutoffDate`
- Deletes: Firestore document only
- Impact: Users cannot access deleted content in deployment hub

**Draft Content**:
- Query: `status == 'draft' AND createdAt < cutoffDate`
- Deletes: Firestore document only
- Impact: Users lose draft, but safe as never deployed

**Library Images**:
- Query: `createdAt < cutoffDate`
- Deletes: Both Firestore document AND storage file
- Impact: Frees storage space, users lose old generated images

**Orphaned Images**:
- Phase 1: Find DB refs with missing storage files → delete DB refs
- Phase 2: Find storage files with missing DB refs → delete storage files
- Phase 3: Find dormant logos → delete both DB and storage

### Performance Considerations

- Batch processing: Processes all users sequentially
- Error isolation: Failed users don't stop cleanup
- Large datasets: May take several minutes for scan/cleanup
- Firebase quotas: Be mindful of Firestore read/write limits
- Storage operations: Deletion may take time to reflect

---

## Monitoring & Verification

### Success Metrics

After cleanup, you should see:
- Reduced Firestore document count
- Reduced Firebase Storage usage
- Fewer orphaned references
- Cleaner database

### Verification Steps

1. **Run scan again** after cleanup to verify items were removed
2. **Check Firebase Console** for storage and Firestore usage trends
3. **Review console logs** for detailed operation results
4. **Test user functionality** to ensure nothing broke
5. **Monitor error logs** for any unexpected issues

---

## Troubleshooting

### Common Issues

**Issue**: Cleanup takes too long
- **Solution**: This is normal for large datasets. Be patient.

**Issue**: Some items not cleaned up
- **Solution**: Check console logs for specific errors. Protected users are skipped.

**Issue**: Storage usage not reduced immediately
- **Solution**: Firebase Storage updates can take time to reflect. Check after 24 hours.

**Issue**: Users report missing content
- **Solution**: This is expected if deployed content was cleaned. Adjust thresholds.

---

## Best Practices

1. **Always run dry run first**: Preview changes before executing
2. **Start with conservative thresholds**: 180+ days for deployed, 90+ days for drafts
3. **Monitor after first cleanup**: Check for any issues or user complaints
4. **Run regularly**: Monthly or quarterly housekeeping prevents buildup
5. **Communicate with users**: If cleaning deployed content, notify users first
6. **Backup important data**: Consider backing up before major cleanups
7. **Test in development first**: Try the process in a test environment

---

## Future Enhancements

### Planned Features

1. **RAG Vector Cleanup**:
   - Scan Pinecone for orphaned vectors
   - Remove vectors for deleted content
   - Requires server-side implementation

2. **Scheduled Cleanup**:
   - Automatic monthly housekeeping
   - Email reports to admin
   - Configurable schedules

3. **User Data Exports**:
   - Generate complete user data export
   - For compliance (GDPR, etc.)
   - ZIP file download

4. **Analytics Cleanup**:
   - Remove old usage statistics
   - Clean up audit logs
   - Archive old metrics

5. **Bulk User Operations**:
   - Clean multiple users at once
   - User-specific cleanup
   - Selective user migration

---

## API Reference

### Housekeeping Actions

#### `handleAdminScanHousekeepingAction`
Scans for items eligible for cleanup.

**Parameters**:
- `adminRequesterEmail`: Admin email (must be admin@brandforge.ai)
- `deployedContentMinAge`: Minimum age in days for deployed content (default: 180)
- `draftContentMinAge`: Minimum age in days for draft content (default: 90)
- `libraryImagesMinAge`: Minimum age in days for library images (default: 90)
- `scanRAGVectors`: Whether to scan RAG vectors (default: false)

**Returns**: `HousekeepingScanResult`
```typescript
{
  oldDeployedContent: { socialPosts, blogPosts, adCampaigns },
  oldDraftContent: { socialPosts, blogPosts, adCampaigns },
  oldLibraryImages: { count, estimatedSize },
  orphanedRAGVectors: { count },
  totalUsers: number,
  scanTimestamp: string
}
```

#### `handleAdminCleanupHousekeepingAction`
Performs the actual cleanup.

**Parameters**:
- `adminRequesterEmail`: Admin email (must be admin@brandforge.ai)
- `cleanDeployedContent`: Whether to clean deployed content (boolean)
- `cleanDraftContent`: Whether to clean draft content (boolean)
- `cleanLibraryImages`: Whether to clean library images (boolean)
- `cleanRAGVectors`: Whether to clean RAG vectors (boolean)
- `deployedContentMinAge`: Minimum age for deployed content
- `draftContentMinAge`: Minimum age for draft content
- `libraryImagesMinAge`: Minimum age for library images
- `dryRun`: Whether to simulate without deleting (boolean)

**Returns**: `HousekeepingCleanupResult`
```typescript
{
  deletedDeployedContent: number,
  deletedDraftContent: number,
  deletedLibraryImages: number,
  deletedRAGVectors: number,
  savedStorageSpace: number,
  errors: string[]
}
```

---

## Security Considerations

### Access Control
- Only admin email can access
- No way to bypass admin check
- Frontend and backend validation

### Data Safety
- Dry run mode as default
- Protected users list
- Minimum age thresholds enforced
- Selective cleanup only

### Audit Trail
- All operations logged
- Success/failure tracked
- Detailed metrics provided
- Errors reported

### Recovery
- No built-in recovery (deletions are permanent)
- Consider Firebase backups
- Test in development first
- Use dry run mode extensively

---

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review this documentation
3. Test in development environment
4. Contact system administrator

---

## Changelog

### Version 1.0.0 (2025-10-13)
- Initial implementation of comprehensive housekeeping system
- Orphaned images cleanup (3 phases)
- Content cleanup (deployed, drafts, library images)
- Dry run mode
- Protected users
- Configurable thresholds
- Comprehensive safety controls
- Admin UI with real-time feedback
