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

const initialScanState: FormState<OrphanedImageScanResult> = { error: undefined, data: undefined, message: undefined };
const initialCleanupState: FormState<{ success: boolean; deletedCount: number }> = { error: undefined, data: undefined, message: undefined };

export default function AdminCleanupPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [scanResults, setScanResults] = useState<OrphanedImageScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

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
            const totalOrphans = scanState.data.orphanedBrandImages.length + scanState.data.orphanedLibraryImages.length;
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
            toast({ 
                title: "Cleanup Complete", 
                description: `Successfully deleted ${cleanupState.data.deletedCount} orphaned image references.`,
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

        const totalOrphans = scanResults.orphanedBrandImages.length + scanResults.orphanedLibraryImages.length;
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
        scanResults.orphanedBrandImages.length + scanResults.orphanedLibraryImages.length : 0;

    return (
        <div className="max-w-6xl mx-auto py-6 px-4">
            <CardHeader className="px-0 mb-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <strong>What does the scan do?</strong> The scan checks all user brand profiles and 
                        AI-generated image libraries to identify references to non-existent storage files.
                    </p>
                    <p>
                        <strong>What does cleanup do?</strong> Cleanup removes the orphaned references from 
                        Firestore, ensuring the database only contains valid image references. This improves 
                        app performance and user experience.
                    </p>
                    <p>
                        <strong>Is it safe?</strong> Yes, cleanup only removes database references to files 
                        that don't exist. No actual image files are deleted during this process.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}