'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Users,
  FileText
} from 'lucide-react';

interface VectorizationJob {
  id: string;
  type: 'all_users' | 'single_user' | 'content_type';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  details: {
    userId?: string;
    userEmail?: string;
    brandName?: string;
    contentType?: string;
  };
}

interface RAGVectorizationManagerProps {
  adminEmail?: string;
}

export const RAGVectorizationManager: React.FC<RAGVectorizationManagerProps> = ({ adminEmail }) => {
  const [jobs, setJobs] = useState<VectorizationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<'all_users' | 'single_user' | 'content_type'>('all_users');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, email: string, brandName: string}>>([]);

  // Admin-only access control
  if (adminEmail !== 'admin@brandforge.ai') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Access denied. Admin privileges required.
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    loadVectorizationJobs();
    loadAvailableUsers();
    
    // Poll for job updates every 5 seconds
    const interval = setInterval(loadVectorizationJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadVectorizationJobs = async () => {
    try {
      const response = await fetch('/api/admin/rag-vectorization', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        }
      });

      if (response.ok) {
        const { jobs } = await response.json();
        // Convert date strings/timestamps to Date objects
        const processedJobs = (jobs || []).map((job: any) => ({
          ...job,
          startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
          completedAt: job.completedAt ? new Date(job.completedAt) : undefined
        }));
        setJobs(processedJobs);
      }
    } catch (error) {
      console.error('Error loading vectorization jobs:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        }
      });

      if (response.ok) {
        const { users } = await response.json();
        setAvailableUsers(users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const startVectorizationJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const jobData = {
        type: selectedJobType,
        userId: selectedJobType === 'single_user' ? selectedUserId : undefined,
        contentType: selectedJobType === 'content_type' ? selectedContentType : undefined
      };

      const response = await fetch('/api/admin/rag-vectorization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        },
        body: JSON.stringify({ action: 'start', ...jobData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { message } = await response.json();
      console.log('Vectorization job started:', message);
      
      // Refresh jobs list
      await loadVectorizationJobs();
      
    } catch (error: any) {
      console.error('Error starting vectorization job:', error);
      setError(`Failed to start vectorization: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const controlJob = async (jobId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      const response = await fetch('/api/admin/rag-vectorization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        },
        body: JSON.stringify({ action, jobId })
      });

      if (response.ok) {
        await loadVectorizationJobs();
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
    }
  };

  const getStatusIcon = (status: VectorizationJob['status']) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: VectorizationJob['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Start New Vectorization Job */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Manual Vectorization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Type</label>
              <Select value={selectedJobType} onValueChange={(value: any) => setSelectedJobType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_users">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="single_user">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Single User
                    </div>
                  </SelectItem>
                  <SelectItem value="content_type">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Content Type
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedJobType === 'single_user' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.brandName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedJobType === 'content_type' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand_profile">Brand Profiles</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="blog_post">Blog Posts</SelectItem>
                    <SelectItem value="ad_campaign">Ad Campaigns</SelectItem>
                    <SelectItem value="saved_image">Saved Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button 
                onClick={startVectorizationJob}
                disabled={loading || (selectedJobType === 'single_user' && !selectedUserId) || (selectedJobType === 'content_type' && !selectedContentType)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Vectorization
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div>• <strong>All Users:</strong> Vectorize all existing content for all users (recommended for initial setup)</div>
            <div>• <strong>Single User:</strong> Vectorize all content for a specific user</div>
            <div>• <strong>Content Type:</strong> Vectorize specific content type across all users</div>
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Vectorization Jobs
            </div>
            <Badge variant="outline">
              {jobs.filter(job => job.status === 'running').length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No vectorization jobs found</p>
              <p className="text-sm mt-2">Start a new job above to begin vectorizing content.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium">
                          {job.type === 'all_users' && 'All Users Vectorization'}
                          {job.type === 'single_user' && `User: ${job.details.brandName || job.details.userEmail}`}
                          {job.type === 'content_type' && `Content Type: ${job.details.contentType}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.processedItems} / {job.totalItems} items processed
                          {job.failedItems > 0 && ` (${job.failedItems} failed)`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.toUpperCase()}
                      </Badge>
                      
                      {job.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => controlJob(job.id, 'pause')}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => controlJob(job.id, 'resume')}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {(job.status === 'running' || job.status === 'paused') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => controlJob(job.id, 'cancel')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.status === 'running' && (
                    <div className="space-y-2">
                      <Progress value={job.progress} className="w-full" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{job.progress.toFixed(1)}% complete</span>
                        {job.estimatedTimeRemaining && (
                          <span>~{formatDuration(job.estimatedTimeRemaining)} remaining</span>
                        )}
                      </div>
                    </div>
                  )}

                  {job.completedAt && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Completed: {job.completedAt instanceof Date ? job.completedAt.toLocaleString() : new Date(job.completedAt).toLocaleString()}
                      {job.startedAt && job.completedAt && (
                        <span className="ml-4">
                          Duration: {(() => {
                            try {
                              const startTime = job.startedAt instanceof Date ? job.startedAt.getTime() : new Date(job.startedAt).getTime();
                              const endTime = job.completedAt instanceof Date ? job.completedAt.getTime() : new Date(job.completedAt).getTime();
                              return formatDuration(Math.floor((endTime - startTime) / 1000));
                            } catch (error) {
                              console.warn('Error calculating duration:', error);
                              return 'N/A';
                            }
                          })()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};