"use client";

import React, { useActionState, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { handleAdminScanOrphanedImagesAction, handleAdminCleanupOrphanedImagesAction, type FormState } from '@/lib/actions';
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle, Trash2, Search, Database, FileX } from 'lucide-react';
import type { OrphanedImageScanResult } from '@/types';
import Link from 'next/link';

const initialScanState: FormState<OrphanedImageScanResult> = { error: undefined, data: undefined, message: undefined };
const initialCleanupState: FormState<{
  success: boolean;
  deletedDbReferences: number;
  deletedStorageFiles: number;
  storageOrphansDeleted: number;
  deletedDormantLogos: number;
  totalSavedSpace: number;
}> = { error: undefined, data: undefined, message: undefined };

export default function AdminCleanupPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [scanResults, setScanResults] = useState<OrphanedImageScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [deleteStorageFiles, setDeleteStorageFiles] = useState(true);

    const [scanState, scanAction] = useActionState(handleAdminScanOrphanedImagesAction, initialScanState);
    const [cleanupState, cleanupAction] = useActionState(handleAdminCleanupOrphanedImagesAction, initialCleanupState);

    // Handle scan results
    useEffect(() => {
        setIsScanning(false);
        if (scanState.error) {
            toast({ 
                title: "Scan Failed", 
                description: scanState.error, 
                variant: "destructive" 
            });
        }
        if (scanState.data) {
            setScanResults(scanState.data);
            const totalOrphans = scanState.data.orphanedBrandImages.length + scanState.data.orphanedLibraryImages.length + (scanState.data.orphanedLogoImages?.length || 0);
            toast({ 
                title: "Scan Complete", 
                description: `Found ${totalOrphans} orphaned image references across all users.`,
                variant: totalOrphans > 0 ? "default" : "default"
            });
        }
    }, [scanState, toast]);

    // Handle cleanup results
    useEffect(() => {
        setIsCleaning(false);
        if (cleanupState.error) {
            toast({ 
                title: "Cleanup Failed", 
                description: cleanupState.error, 
                variant: "destructive" 
            });
        }
        if (cleanupState.data?.success) {
            const totalDeleted = (cleanupState.data.deletedDbReferences || 0) +
                               (cleanupState.data.deletedStorageFiles || 0) +
                               (cleanupState.data.storageOrphansDeleted || 0);
            
            const formatBytes = (bytes: number): string => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };
            
            toast({
                title: "Comprehensive Cleanup Complete",
                description: `Deleted ${totalDeleted} total items: ${cleanupState.data.deletedDbReferences} DB refs, ${(cleanupState.data.deletedStorageFiles || 0) + (cleanupState.data.storageOrphansDeleted || 0)} storage files. Saved ${formatBytes(cleanupState.data.totalSavedSpace || 0)} of storage space.`,
                variant: "default"
            });
            // Clear scan results to force a new scan
            setScanResults(null);
        }
    }, [cleanupState, toast]);

    const handleScanOrphans = () => {
        if (!currentUser?.email || currentUser.email !== 'admin@brandforge.ai') {
            toast({ 
                title: "Access Denied", 
                description: "Admin access required.", 
                variant: "destructive" 
            });
            return;
        }

        setIsScanning(true);
        const formData = new FormData();
        formData.append('adminRequesterEmail', currentUser.email);
        startTransition(() => {
            scanAction(formData);
        });
    };

    const handleCleanupOrphans = () => {
        if (!currentUser?.email || currentUser.email !== 'admin@brandforge.ai') {
            toast({ 
                title: "Access Denied", 
                description: "Admin access required.", 
                variant: "destructive" 
            });
            return;
        }

        if (!scanResults) {
            toast({ 
                title: "No Scan Results", 
                description: "Please run a scan first to identify orphaned images.", 
                variant: "destructive" 
            });
            return;
        }

        const totalOrphans = scanResults.orphanedBrandImages.length + scanResults.orphanedLibraryImages.length + (scanResults.orphanedLogoImages?.length || 0);
        if (totalOrphans === 0) {
            toast({ 
                title: "No Orphans Found", 
                description: "No orphaned images to clean up.", 
                variant: "default" 
            });
            return;
        }

        setIsCleaning(true);
        const formData = new FormData();
        formData.append('adminRequesterEmail', currentUser.email);
        formData.append('deleteStorageFiles', deleteStorageFiles.toString());
        startTransition(() => {
            cleanupAction(formData);
        });
    };

    // Check admin access
    if (!currentUser || currentUser.email !== 'admin@brandforge.ai') {
        return (
            <div className="max-w-4xl mx-auto py-6 px-4">
                <Alert variant="destructive">
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        This page is restricted to administrators only.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const totalOrphans = scanResults ?
        scanResults.orphanedBrandImages.length + scanResults.orphanedLibraryImages.length + (scanResults.orphanedLogoImages?.length || 0) : 0;

    return (
        <div className="max-w-6xl mx-auto py-6 px-4">
            <CardHeader className="px-0 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Database className="w-10 h-10 text-primary" />
                        <div>
                            <CardTitle className="text-3xl font-bold flex items-center gap-2">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                                Admin: Orphaned Images Cleanup
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Scan and clean up orphaned image references across all users.
                            </CardDescription>
                        </div>
                    </div>
                    <Link href="/admin/housekeeping">
                        <Button variant="outline" size="sm">
                            <Database className="w-4 h-4 mr-2" />
                            Housekeeping
                        </Button>
                    </Link>
                </div>
            </CardHeader>

            {/* Control Panel */}
            <Card className="mb-6 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">Cleanup Controls</CardTitle>
                    <CardDescription>
                        Scan for orphaned image references and clean them up system-wide.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button 
                            onClick={handleScanOrphans}
                            disabled={isScanning || isCleaning}
                            className="flex items-center gap-2"
                        >
                            {isScanning ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            {isScanning ? 'Scanning...' : 'Scan for Orphaned Images'}
                        </Button>

                        <Button 
                            onClick={handleCleanupOrphans}
                            disabled={!scanResults || totalOrphans === 0 || isScanning || isCleaning}
                            variant="destructive"
                            className="flex items-center gap-2"
                        >
                            {isCleaning ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            {isCleaning ? 'Cleaning...' : 'Clean Up Orphaned Images'}
                        </Button>
                    </div>

                    {/* Storage File Deletion Option */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <input
                            type="checkbox"
                            id="deleteStorageFiles"
                            checked={deleteStorageFiles}
                            onChange={(e) => setDeleteStorageFiles(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="deleteStorageFiles" className="text-sm font-medium text-blue-800">
                            Also delete actual storage files (recommended)
                        </label>
                        <div className="text-xs text-blue-600 ml-2">
                            ⚠️ This will permanently delete orphaned files from Firebase Storage and clean up storage orphans (files without DB references)
                        </div>
                    </div>

                    {scanResults && (
                        <Alert className={totalOrphans > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
                            {totalOrphans > 0 ? (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                            ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <AlertTitle className={totalOrphans > 0 ? "text-orange-800" : "text-green-800"}>
                                Scan Results
                            </AlertTitle>
                            <AlertDescription className={totalOrphans > 0 ? "text-orange-700" : "text-green-700"}>
                                {totalOrphans > 0 ? (
                                    `Found ${totalOrphans} orphaned image references that can be cleaned up.`
                                ) : (
                                    "No orphaned image references found. All image references are valid."
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Scan Results Details */}
            {scanResults && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Brand Profile Orphaned Images */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileX className="w-5 h-5 text-orange-500" />
                                Orphaned Brand Profile Images
                                <Badge variant={scanResults.orphanedBrandImages.length > 0 ? "destructive" : "secondary"}>
                                    {scanResults.orphanedBrandImages.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Brand profile example images with broken storage references.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {scanResults.orphanedBrandImages.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    No orphaned brand profile images found.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {scanResults.orphanedBrandImages.map((orphan: any, index: number) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/50">
                                            <div className="text-sm font-medium truncate">
                                                User: {orphan.userEmail || orphan.userId.substring(0, 8) + '...'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 break-all">
                                                URL: {orphan.imageUrl.substring(0, 60)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Library Orphaned Images */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileX className="w-5 h-5 text-orange-500" />
                                Orphaned Library Images
                                <Badge variant={scanResults.orphanedLibraryImages.length > 0 ? "destructive" : "secondary"}>
                                    {scanResults.orphanedLibraryImages.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                AI-generated library images with broken storage references.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {scanResults.orphanedLibraryImages.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    No orphaned library images found.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {scanResults.orphanedLibraryImages.map((orphan: any, index: number) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/50">
                                            <div className="text-sm font-medium truncate">
                                                User: {orphan.userEmail || orphan.userId.substring(0, 8) + '...'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Image ID: {orphan.imageId}
                                            </div>
                                            <div className="text-xs text-muted-foreground break-all">
                                                URL: {orphan.imageUrl.substring(0, 60)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Logo Orphaned Images */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileX className="w-5 h-5 text-orange-500" />
                                Orphaned Logo Images
                                <Badge variant={(scanResults.orphanedLogoImages?.length || 0) > 0 ? "destructive" : "secondary"}>
                                    {scanResults.orphanedLogoImages?.length || 0}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                AI-generated brand logos with broken storage references.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(scanResults.orphanedLogoImages?.length || 0) === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    No orphaned logo images found.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {scanResults.orphanedLogoImages?.map((orphan: any, index: number) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/50">
                                            <div className="text-sm font-medium truncate">
                                                User: {orphan.userEmail || orphan.userId.substring(0, 8) + '...'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Logo ID: {orphan.logoId}
                                            </div>
                                            <div className="text-xs text-muted-foreground break-all">
                                                URL: {orphan.imageUrl.substring(0, 60)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Information Panel */}
            <Card className="mt-6 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">About Orphaned Images Cleanup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        <strong>What are orphaned images?</strong> These are image references stored in Firestore 
                        that point to files that no longer exist in Firebase Storage. This can happen when files 
                        are manually deleted from storage or due to synchronization issues.
                    </p>
                    <p>
                        <strong>What does the scan do?</strong> The scan checks all user brand profiles,
                        AI-generated image libraries, and brand logos to identify references to non-existent storage files.
                    </p>
                    <p>
                        <strong>What does cleanup do?</strong> Cleanup removes orphaned references from
                        Firestore and optionally deletes the actual storage files. It also finds and removes
                        storage files that have no database references (reverse orphans). This improves
                        app performance, user experience, and reduces storage costs.
                    </p>
                    <p>
                        <strong>Two-Phase Cleanup:</strong>
                        <br />• <strong>Phase 1:</strong> Removes database references to missing files + deletes those files if they exist
                        <br />• <strong>Phase 2:</strong> Finds and deletes storage files that have no database references (storage orphans)
                    </p>
                    <p>
                        <strong>Is it safe?</strong> Yes, the system includes multiple safety checks:
                        <br />• Files must be older than 7 days to be deleted as storage orphans
                        <br />• Thorough verification before any deletion
                        <br />• Only files in user directories are processed
                        <br />• Comprehensive error handling and logging
                    </p>
                    <p>
                        <strong>Storage Benefits:</strong> This comprehensive cleanup can significantly reduce
                        Firebase Storage costs by removing both database orphans and storage orphans,
                        potentially saving substantial storage space.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}