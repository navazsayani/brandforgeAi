'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Zap,
  DollarSign
} from 'lucide-react';

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

interface RAGSystemSettingsProps {
  adminEmail?: string;
}

export const RAGSystemSettings: React.FC<RAGSystemSettingsProps> = ({ adminEmail }) => {
  const [config, setConfig] = useState<RAGSystemConfig>({
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
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/rag-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        }
      });

      if (response.ok) {
        const { config: serverConfig } = await response.json();
        if (serverConfig) {
          setConfig(serverConfig);
        }
      }
    } catch (error: any) {
      console.error('Error loading system config:', error);
      setError(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveSystemConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/rag-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { message } = await response.json();
      setSuccess(message || 'Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('Error saving system config:', error);
      setError(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
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
    });
  };

  const updateConfig = (section: keyof RAGSystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">Loading system settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">RAG System Settings</h2>
          <p className="text-muted-foreground">Configure RAG system behavior and limits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={saveSystemConfig} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">{success}</AlertDescription>
        </Alert>
      )}

      {/* Rate Limiting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Rate Limiting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Global Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">Apply rate limits across all users</p>
            </div>
            <Switch
              checked={config.rateLimiting.enabled}
              onCheckedChange={(checked) => updateConfig('rateLimiting', 'enabled', checked)}
            />
          </div>

          {config.rateLimiting.enabled && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="globalMaxPerHour">Global Max/Hour</Label>
                <Input
                  id="globalMaxPerHour"
                  type="number"
                  value={config.rateLimiting.globalMaxPerHour}
                  onChange={(e) => updateConfig('rateLimiting', 'globalMaxPerHour', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="globalMaxPerDay">Global Max/Day</Label>
                <Input
                  id="globalMaxPerDay"
                  type="number"
                  value={config.rateLimiting.globalMaxPerDay}
                  onChange={(e) => updateConfig('rateLimiting', 'globalMaxPerDay', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="userMaxPerHour">User Max/Hour</Label>
                <Input
                  id="userMaxPerHour"
                  type="number"
                  value={config.rateLimiting.userMaxPerHour}
                  onChange={(e) => updateConfig('rateLimiting', 'userMaxPerHour', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="userMaxPerDay">User Max/Day</Label>
                <Input
                  id="userMaxPerDay"
                  type="number"
                  value={config.rateLimiting.userMaxPerDay}
                  onChange={(e) => updateConfig('rateLimiting', 'userMaxPerDay', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vector Cleanup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trash2 className="w-5 h-5 mr-2" />
            Vector Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Automatic Cleanup</Label>
              <p className="text-sm text-muted-foreground">Automatically remove old, low-performing vectors</p>
            </div>
            <Switch
              checked={config.vectorCleanup.enabled}
              onCheckedChange={(checked) => updateConfig('vectorCleanup', 'enabled', checked)}
            />
          </div>

          {config.vectorCleanup.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="retentionDays">Retention Days</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={config.vectorCleanup.retentionDays}
                  onChange={(e) => updateConfig('vectorCleanup', 'retentionDays', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">Keep vectors for this many days</p>
              </div>
              <div>
                <Label htmlFor="minPerformanceThreshold">Min Performance Threshold</Label>
                <Input
                  id="minPerformanceThreshold"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.vectorCleanup.minPerformanceThreshold}
                  onChange={(e) => updateConfig('vectorCleanup', 'minPerformanceThreshold', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">Remove vectors below this performance score</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embedding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Embedding Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="embeddingModel">Model</Label>
              <Input
                id="embeddingModel"
                value={config.embedding.model}
                onChange={(e) => updateConfig('embedding', 'model', e.target.value)}
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">OpenAI embedding model</p>
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                type="number"
                value={config.embedding.dimensions}
                onChange={(e) => updateConfig('embedding', 'dimensions', parseInt(e.target.value))}
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">Vector dimensions</p>
            </div>
            <div>
              <Label htmlFor="costPer1K">Cost per 1K</Label>
              <Input
                id="costPer1K"
                type="number"
                step="0.001"
                value={config.embedding.costPer1K}
                onChange={(e) => updateConfig('embedding', 'costPer1K', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">USD cost per 1,000 embeddings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Performance Tuning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="similarityThreshold">Similarity Threshold</Label>
              <Input
                id="similarityThreshold"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={config.performance.similarityThreshold}
                onChange={(e) => updateConfig('performance', 'similarityThreshold', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum similarity for context retrieval</p>
            </div>
            <div>
              <Label htmlFor="maxContextLength">Max Context Length</Label>
              <Input
                id="maxContextLength"
                type="number"
                value={config.performance.maxContextLength}
                onChange={(e) => updateConfig('performance', 'maxContextLength', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum characters in RAG context</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Context Caching</Label>
                <p className="text-sm text-muted-foreground">Cache similar queries to reduce embedding costs</p>
              </div>
              <Switch
                checked={config.performance.cacheEnabled}
                onCheckedChange={(checked) => updateConfig('performance', 'cacheEnabled', checked)}
              />
            </div>

            {config.performance.cacheEnabled && (
              <div>
                <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                <Input
                  id="cacheTTL"
                  type="number"
                  value={config.performance.cacheTTL}
                  onChange={(e) => updateConfig('performance', 'cacheTTL', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">How long to cache query results</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">RAG Engine</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">Rate Limiting</div>
              <div className="text-xs text-muted-foreground">
                {config.rateLimiting.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Database className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">Vector Cleanup</div>
              <div className="text-xs text-muted-foreground">
                {config.vectorCleanup.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium">Cache</div>
              <div className="text-xs text-muted-foreground">
                {config.performance.cacheEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};