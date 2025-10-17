"use client";

import React, { useActionState, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  handleAdminScanHousekeepingAction,
  handleAdminCleanupHousekeepingAction,
  type FormState
} from '@/lib/actions';
import {
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Search,
  Database,
  FileText,
  Image as ImageIcon,
  Zap,
  Archive,
  Settings
} from 'lucide-react';
import type { HousekeepingScanResult, HousekeepingCleanupResult } from '@/types';
import Link from 'next/link';

const initialScanState: FormState<HousekeepingScanResult> = { error: undefined, data: undefined, message: undefined };
const initialCleanupState: FormState<HousekeepingCleanupResult> = { error: undefined, data: undefined, message: undefined };

export default function AdminHousekeepingPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [scanResults, setScanResults] = useState<HousekeepingScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // Cleanup options
  const [cleanDeployedContent, setCleanDeployedContent] = useState(false);
  const [cleanDraftContent, setCleanDraftContent] = useState(true);
  const [cleanLibraryImages, setCleanLibraryImages] = useState(true);
  const [cleanRAGVectors, setCleanRAGVectors] = useState(false);

  // Min age thresholds
  const [deployedMinAge, setDeployedMinAge] = useState(180); // 6 months
  const [draftMinAge, setDraftMinAge] = useState(90); // 3 months
  const [libraryMinAge, setLibraryMinAge] = useState(90); // 3 months

  // Dry run mode
  const [dryRun, setDryRun] = useState(true);

  const [scanState, scanAction] = useActionState(handleAdminScanHousekeepingAction, initialScanState);
  const [cleanupState, cleanupAction] = useActionState(handleAdminCleanupHousekeepingAction, initialCleanupState);

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
      const totalItems =
        scanState.data.oldDeployedContent.socialPosts +
        scanState.data.oldDeployedContent.blogPosts +
        scanState.data.oldDeployedContent.adCampaigns +
        scanState.data.oldDraftContent.socialPosts +
        scanState.data.oldDraftContent.blogPosts +
        scanState.data.oldDraftContent.adCampaigns +
        scanState.data.oldLibraryImages.count;

      toast({
        title: "Scan Complete",
        description: `Found ${totalItems} items that can be cleaned up.`,
        variant: totalItems > 0 ? "default" : "default"
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
    if (cleanupState.data) {
      const totalDeleted =
        cleanupState.data.deletedDeployedContent +
        cleanupState.data.deletedDraftContent +
        cleanupState.data.deletedLibraryImages;

      toast({
        title: dryRun ? "Dry Run Complete" : "Cleanup Complete",
        description: dryRun
          ? `Would have deleted ${totalDeleted} items.`
          : `Successfully cleaned up ${totalDeleted} items.`,
        variant: "default"
      });

      // Clear scan results to force a new scan
      if (!dryRun) {
        setScanResults(null);
      }
    }
  }, [cleanupState, toast, dryRun]);

  const handleScanHousekeeping = () => {
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
    formData.append('deployedContentMinAge', deployedMinAge.toString());
    formData.append('draftContentMinAge', draftMinAge.toString());
    formData.append('libraryImagesMinAge', libraryMinAge.toString());
    formData.append('scanRAGVectors', cleanRAGVectors.toString());

    startTransition(() => {
      scanAction(formData);
    });
  };

  const handleCleanupHousekeeping = () => {
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
        description: "Please run a scan first to identify items to clean up.",
        variant: "destructive"
      });
      return;
    }

    if (!cleanDeployedContent && !cleanDraftContent && !cleanLibraryImages && !cleanRAGVectors) {
      toast({
        title: "No Options Selected",
        description: "Please select at least one cleanup option.",
        variant: "destructive"
      });
      return;
    }

    setIsCleaning(true);
    const formData = new FormData();
    formData.append('adminRequesterEmail', currentUser.email);
    formData.append('cleanDeployedContent', cleanDeployedContent.toString());
    formData.append('cleanDraftContent', cleanDraftContent.toString());
    formData.append('cleanLibraryImages', cleanLibraryImages.toString());
    formData.append('cleanRAGVectors', cleanRAGVectors.toString());
    formData.append('deployedContentMinAge', deployedMinAge.toString());
    formData.append('draftContentMinAge', draftMinAge.toString());
    formData.append('libraryImagesMinAge', libraryMinAge.toString());
    formData.append('dryRun', dryRun.toString());

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

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalItemsToClean = scanResults ?
    scanResults.oldDeployedContent.socialPosts +
    scanResults.oldDeployedContent.blogPosts +
    scanResults.oldDeployedContent.adCampaigns +
    scanResults.oldDraftContent.socialPosts +
    scanResults.oldDraftContent.blogPosts +
    scanResults.oldDraftContent.adCampaigns +
    scanResults.oldLibraryImages.count : 0;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <CardHeader className="px-0 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                Admin: Comprehensive Housekeeping
              </CardTitle>
              <CardDescription className="text-lg">
                Clean up old content, library images, and manage system resources
              </CardDescription>
            </div>
          </div>
          <Link href="/admin/cleanup">
            <Button variant="outline" size="sm">
              <Archive className="w-4 h-4 mr-2" />
              Orphaned Images Cleanup
            </Button>
          </Link>
        </div>
      </CardHeader>

      {/* Control Panel */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Housekeeping Controls
          </CardTitle>
          <CardDescription>
            Configure scan parameters and cleanup options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scan Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deployed Content Min Age (days)</label>
              <input
                type="number"
                min="30"
                value={deployedMinAge}
                onChange={(e) => setDeployedMinAge(parseInt(e.target.value) || 180)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isScanning || isCleaning}
              />
              <p className="text-xs text-muted-foreground">Minimum: 30 days (default: 180)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Draft Content Min Age (days)</label>
              <input
                type="number"
                min="30"
                value={draftMinAge}
                onChange={(e) => setDraftMinAge(parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isScanning || isCleaning}
              />
              <p className="text-xs text-muted-foreground">Minimum: 30 days (default: 90)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Library Images Min Age (days)</label>
              <input
                type="number"
                min="30"
                value={libraryMinAge}
                onChange={(e) => setLibraryMinAge(parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isScanning || isCleaning}
              />
              <p className="text-xs text-muted-foreground">Minimum: 30 days (default: 90)</p>
            </div>
          </div>

          {/* Cleanup Options */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold text-sm">Cleanup Options (select what to clean)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanDeployedContent}
                  onChange={(e) => setCleanDeployedContent(e.target.checked)}
                  className="w-4 h-4"
                  disabled={isScanning || isCleaning}
                />
                <span className="text-sm">Clean old deployed content (⚠️ Use with caution)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanDraftContent}
                  onChange={(e) => setCleanDraftContent(e.target.checked)}
                  className="w-4 h-4"
                  disabled={isScanning || isCleaning}
                />
                <span className="text-sm">Clean old draft content (Recommended)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanLibraryImages}
                  onChange={(e) => setCleanLibraryImages(e.target.checked)}
                  className="w-4 h-4"
                  disabled={isScanning || isCleaning}
                />
                <span className="text-sm">Clean old library images (Recommended)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanRAGVectors}
                  onChange={(e) => setCleanRAGVectors(e.target.checked)}
                  className="w-4 h-4"
                  disabled={true}
                />
                <span className="text-sm text-muted-foreground">Clean orphaned RAG vectors (Coming soon)</span>
              </label>
            </div>
          </div>

          {/* Dry Run Toggle */}
          <div className="flex items-center space-x-2 p-4 border-2 rounded-lg bg-blue-50 border-blue-300">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-5 h-5 text-blue-600"
              disabled={isScanning || isCleaning}
            />
            <label htmlFor="dryRun" className="text-sm font-bold text-blue-900 cursor-pointer">
              DRY RUN MODE (Recommended for first run)
            </label>
          </div>
          {dryRun && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Dry Run Mode Enabled</AlertTitle>
              <AlertDescription className="text-blue-700">
                This will simulate the cleanup without actually deleting anything. Review the results before disabling dry run mode.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleScanHousekeeping}
              disabled={isScanning || isCleaning}
              className="flex items-center gap-2"
              size="lg"
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isScanning ? 'Scanning...' : 'Scan Housekeeping Items'}
            </Button>

            <Button
              onClick={handleCleanupHousekeeping}
              disabled={!scanResults || totalItemsToClean === 0 || isScanning || isCleaning}
              variant={dryRun ? "default" : "destructive"}
              className="flex items-center gap-2"
              size="lg"
            >
              {isCleaning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isCleaning ? 'Cleaning...' : (dryRun ? 'Preview Cleanup (Dry Run)' : 'Execute Cleanup')}
            </Button>
          </div>

          {/* Scan Results Summary */}
          {scanResults && (
            <Alert className={totalItemsToClean > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
              {totalItemsToClean > 0 ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertTitle className={totalItemsToClean > 0 ? "text-orange-800" : "text-green-800"}>
                Scan Results
              </AlertTitle>
              <AlertDescription className={totalItemsToClean > 0 ? "text-orange-700" : "text-green-700"}>
                {totalItemsToClean > 0 ? (
                  `Found ${totalItemsToClean} items that can be cleaned up.`
                ) : (
                  "No items found that need cleanup. Your system is clean!"
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Scan Results Details */}
      {scanResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Old Deployed Content */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Old Deployed Content
                <Badge variant={(scanResults.oldDeployedContent.socialPosts + scanResults.oldDeployedContent.blogPosts + scanResults.oldDeployedContent.adCampaigns) > 0 ? "default" : "secondary"}>
                  {scanResults.oldDeployedContent.socialPosts + scanResults.oldDeployedContent.blogPosts + scanResults.oldDeployedContent.adCampaigns}
                </Badge>
              </CardTitle>
              <CardDescription>
                Deployed content older than {deployedMinAge} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Social Posts:</span>
                  <Badge variant="outline">{scanResults.oldDeployedContent.socialPosts}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Blog Posts:</span>
                  <Badge variant="outline">{scanResults.oldDeployedContent.blogPosts}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ad Campaigns:</span>
                  <Badge variant="outline">{scanResults.oldDeployedContent.adCampaigns}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Old Draft Content */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Old Draft Content
                <Badge variant={(scanResults.oldDraftContent.socialPosts + scanResults.oldDraftContent.blogPosts + scanResults.oldDraftContent.adCampaigns) > 0 ? "default" : "secondary"}>
                  {scanResults.oldDraftContent.socialPosts + scanResults.oldDraftContent.blogPosts + scanResults.oldDraftContent.adCampaigns}
                </Badge>
              </CardTitle>
              <CardDescription>
                Draft content older than {draftMinAge} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Social Posts:</span>
                  <Badge variant="outline">{scanResults.oldDraftContent.socialPosts}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Blog Posts:</span>
                  <Badge variant="outline">{scanResults.oldDraftContent.blogPosts}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ad Campaigns:</span>
                  <Badge variant="outline">{scanResults.oldDraftContent.adCampaigns}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Old Library Images */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                Old Library Images
                <Badge variant={scanResults.oldLibraryImages.count > 0 ? "default" : "secondary"}>
                  {scanResults.oldLibraryImages.count}
                </Badge>
              </CardTitle>
              <CardDescription>
                Library images older than {libraryMinAge} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Images:</span>
                  <Badge variant="outline">{scanResults.oldLibraryImages.count}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Size:</span>
                  <Badge variant="outline">{formatBytes(scanResults.oldLibraryImages.estimatedSize)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Information Panel */}
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">About Housekeeping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">🧹 What is Housekeeping?</strong>
            <p>Housekeeping helps manage system resources by cleaning up old, unused content and files. This improves performance and reduces storage costs.</p>
          </div>

          <div>
            <strong className="text-foreground">🔍 What does the scan do?</strong>
            <p>The scan identifies old deployed content, draft content, and library images based on the minimum age thresholds you configure. It does not delete anything.</p>
          </div>

          <div>
            <strong className="text-foreground">🗑️ What does cleanup do?</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Deployed Content:</strong> Removes old posts/blogs/ads that were deployed (⚠️ users cannot access them after deletion)</li>
              <li><strong>Draft Content:</strong> Removes old drafts that were never deployed (safe to delete)</li>
              <li><strong>Library Images:</strong> Removes old generated images and their storage files (frees up storage)</li>
              <li><strong>RAG Vectors:</strong> Coming soon - removes orphaned vector embeddings</li>
            </ul>
          </div>

          <div>
            <strong className="text-foreground">🛡️ Safety Features:</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Dry Run Mode:</strong> Preview what would be deleted without actually deleting</li>
              <li><strong>Protected Users:</strong> Admin accounts are never cleaned up</li>
              <li><strong>Minimum Age Thresholds:</strong> Only old content is eligible for cleanup</li>
              <li><strong>Selective Cleanup:</strong> Choose exactly what to clean</li>
            </ul>
          </div>

          <div>
            <strong className="text-foreground">⚠️ Important Notes:</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Always run in <strong>Dry Run mode</strong> first to preview changes</li>
              <li>Cleaning deployed content will remove it from users' deployment hub</li>
              <li>Deleted content cannot be recovered</li>
              <li>Consider backing up important data before cleanup</li>
            </ul>
          </div>

          <div>
            <strong className="text-foreground">💰 Storage Benefits:</strong>
            <p>Regular housekeeping can significantly reduce Firebase Storage and Firestore costs by removing unnecessary data.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
