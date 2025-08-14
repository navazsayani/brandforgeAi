'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, Activity, Users } from 'lucide-react';

interface RAGCostMetrics {
  totalEmbeddings: number;
  estimatedMonthlyCost: number;
  costPerUser: number;
  activeUsers: number;
  lastUpdated: Date;
  recentActivity: {
    date: string;
    embeddings: number;
    cost: number;
    activeUsers: number;
  }[];
  topUsers: {
    userId: string;
    userEmail: string;
    brandName: string;
    embeddings: number;
    cost: number;
    lastActivity: string;
    avgPerformance: number;
  }[];
}

interface RAGCostMonitorProps {
  adminEmail?: string;
}

export const RAGCostMonitor: React.FC<RAGCostMonitorProps> = ({ adminEmail }) => {
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
  const [costs, setCosts] = useState<RAGCostMetrics>({
    totalEmbeddings: 0,
    estimatedMonthlyCost: 0,
    costPerUser: 0,
    activeUsers: 0,
    lastUpdated: new Date(),
    recentActivity: [],
    topUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitedUsers, setLimitedUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Cost thresholds for early-stage startup
  const COST_THRESHOLDS = {
    WARNING: 25, // $25/month
    CRITICAL: 50, // $50/month
    EMERGENCY: 100 // $100/month
  };

  useEffect(() => {
    loadCostMetrics();
    loadLimitedUsers();
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      loadCostMetrics();
      loadLimitedUsers();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadCostMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[RAG Cost Monitor] Fetching real cost metrics...');
      
      const response = await fetch('/api/admin/rag-costs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { data } = await response.json();
      
      // Convert lastUpdated string back to Date
      const metricsData: RAGCostMetrics = {
        ...data,
        lastUpdated: new Date(data.lastUpdated)
      };
      
      setCosts(metricsData);
      console.log('[RAG Cost Monitor] Successfully loaded real metrics:', {
        totalEmbeddings: metricsData.totalEmbeddings,
        estimatedMonthlyCost: metricsData.estimatedMonthlyCost,
        activeUsers: metricsData.activeUsers
      });
      
    } catch (err: any) {
      console.error('[RAG Cost Monitor] Error loading metrics:', err);
      setError(`Failed to load cost metrics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadLimitedUsers = async () => {
    try {
      console.log('[RAG Cost Monitor] Loading limited users...');
      
      const response = await fetch('/api/admin/rag-costs/limited-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        }
      });

      if (response.ok) {
        const { limitedUserIds } = await response.json();
        setLimitedUsers(new Set(limitedUserIds || []));
        console.log('[RAG Cost Monitor] Loaded limited users:', limitedUserIds);
      }
    } catch (err: any) {
      console.error('[RAG Cost Monitor] Error loading limited users:', err);
    }
  };

  const getCostStatus = () => {
    if (costs.estimatedMonthlyCost >= COST_THRESHOLDS.EMERGENCY) {
      return { level: 'emergency', color: 'destructive', icon: AlertTriangle };
    } else if (costs.estimatedMonthlyCost >= COST_THRESHOLDS.CRITICAL) {
      return { level: 'critical', color: 'destructive', icon: AlertTriangle };
    } else if (costs.estimatedMonthlyCost >= COST_THRESHOLDS.WARNING) {
      return { level: 'warning', color: 'secondary', icon: AlertTriangle };
    }
    return { level: 'healthy', color: 'default', icon: Activity };
  };

  const handleRateLimitingAction = async (action: string, userId?: string) => {
    try {
      console.log(`[RAG Cost Monitor] Executing action: ${action}`);
      setActionLoading(userId || action);
      
      const response = await fetch('/api/admin/rag-costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        },
        body: JSON.stringify({ action, userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { message } = await response.json();
      alert(`Success: ${message}`);
      
      // Update limited users state immediately for better UX
      if (action === 'limit_user' && userId) {
        setLimitedUsers(prev => new Set([...prev, userId]));
      } else if (action === 'unlimit_user' && userId) {
        setLimitedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
      
      // Refresh metrics after action
      await loadCostMetrics();
      await loadLimitedUsers();
      
    } catch (error: any) {
      console.error('[RAG Cost Monitor] Rate limiting action failed:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const status = getCostStatus();
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            RAG Cost Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading cost metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              RAG Cost Monitor
            </div>
            <Badge variant={status.color as any}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.level.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {costs.totalEmbeddings.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Embeddings
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${costs.estimatedMonthlyCost.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Monthly Cost
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${costs.costPerUser.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Cost Per User
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {costs.activeUsers}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Users
              </div>
            </div>
          </div>

          {/* Cost Alerts */}
          {costs.estimatedMonthlyCost >= COST_THRESHOLDS.WARNING && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {costs.estimatedMonthlyCost >= COST_THRESHOLDS.EMERGENCY && (
                  <strong>EMERGENCY: </strong>
                )}
                {costs.estimatedMonthlyCost >= COST_THRESHOLDS.CRITICAL && costs.estimatedMonthlyCost < COST_THRESHOLDS.EMERGENCY && (
                  <strong>CRITICAL: </strong>
                )}
                {costs.estimatedMonthlyCost >= COST_THRESHOLDS.WARNING && costs.estimatedMonthlyCost < COST_THRESHOLDS.CRITICAL && (
                  <strong>WARNING: </strong>
                )}
                Monthly RAG costs are ${costs.estimatedMonthlyCost.toFixed(2)}. 
                Consider implementing rate limiting or optimizing embedding usage.
              </AlertDescription>
            </Alert>
          )}

          {/* Cost Breakdown */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Last updated: {costs.lastUpdated.toLocaleString()}</div>
            <div>Calculation: $0.02 per 1,000 embeddings (OpenAI text-embedding-3-small)</div>
            <div>Refresh rate: Every 5 minutes</div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={loadCostMetrics}
              disabled={loading}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
            {costs.estimatedMonthlyCost >= COST_THRESHOLDS.WARNING && (
              <>
                <button
                  onClick={() => handleRateLimitingAction('enable_global_rate_limiting')}
                  className="px-3 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors"
                >
                  Enable Global Rate Limiting
                </button>
                <button
                  onClick={() => handleRateLimitingAction('disable_global_rate_limiting')}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-800/40 transition-colors"
                >
                  Disable Rate Limiting
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Recent Activity Chart */}
      {costs.recentActivity && costs.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Recent Activity (Last 7 Days)
              <Badge variant="outline" className="text-xs">
                {costs.recentActivity.reduce((sum, day) => sum + day.embeddings, 0)} total embeddings
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costs.recentActivity.map((activity, idx) => {
                const date = new Date(activity.date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
                
                let dateLabel = date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                });
                
                if (isToday) dateLabel = `Today (${dateLabel})`;
                else if (isYesterday) dateLabel = `Yesterday (${dateLabel})`;
                
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{dateLabel}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {activity.activeUsers} active user{activity.activeUsers !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{activity.embeddings} embeddings</div>
                      <div className="text-xs text-muted-foreground">${activity.cost.toFixed(4)} cost</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        ~{(activity.embeddings / activity.activeUsers || 0).toFixed(1)} per user
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {costs.recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No RAG activity in the last 7 days</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Top Users by RAG Usage */}
      {costs.topUsers && costs.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Top Users by RAG Usage
              <Badge variant="outline" className="text-xs">
                {costs.topUsers.length} users tracked
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costs.topUsers.slice(0, 8).map((user, idx) => {
                const lastActivityDate = new Date(user.lastActivity);
                const daysSinceActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
                const performanceColor = user.avgPerformance >= 0.7 ? 'text-green-600 dark:text-green-400' :
                                       user.avgPerformance >= 0.4 ? 'text-yellow-600 dark:text-yellow-400' :
                                       'text-red-600 dark:text-red-400';
                const isLimited = limitedUsers.has(user.userId);
                const isActionLoading = actionLoading === user.userId;
                
                return (
                  <div key={idx} className={`flex justify-between items-start p-4 rounded-lg border ${isLimited ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-muted/30'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          #{idx + 1}
                        </Badge>
                        <div className="font-medium text-sm truncate">
                          {user.brandName}
                        </div>
                        {isLimited && (
                          <Badge variant="destructive" className="text-xs">
                            LIMITED
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2 truncate">
                        {user.userEmail}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Embeddings:</span>
                          <span className="ml-1 font-medium">{user.embeddings.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Performance:</span>
                          <span className={`ml-1 font-medium ${performanceColor}`}>
                            {(user.avgPerformance * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Active:</span>
                          <span className="ml-1 font-medium">
                            {daysSinceActivity === 0 ? 'Today' :
                             daysSinceActivity === 1 ? 'Yesterday' :
                             `${daysSinceActivity}d ago`}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {isLimited ? 'Limit:' : 'Avg/Day:'}
                          </span>
                          <span className="ml-1 font-medium">
                            {isLimited ? '10/hr, 100/day' : (user.embeddings / Math.max(daysSinceActivity || 1, 1)).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary mb-1">
                        ${user.cost.toFixed(4)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        ${(user.cost / user.embeddings * 1000).toFixed(2)}/1k
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {!isLimited ? (
                          <button
                            onClick={() => handleRateLimitingAction('limit_user', user.userId)}
                            disabled={isActionLoading}
                            className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors disabled:opacity-50"
                          >
                            {isActionLoading ? 'Limiting...' : 'Limit User'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRateLimitingAction('unlimit_user', user.userId)}
                            disabled={isActionLoading}
                            className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors disabled:opacity-50"
                          >
                            {isActionLoading ? 'Unlimiting...' : 'Remove Limit'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {costs.topUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No users with RAG activity found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics & Insights */}
      {costs.recentActivity && costs.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analytics & Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {costs.recentActivity.reduce((sum, day) => sum + day.embeddings, 0)}
                </div>
                <div className="text-xs text-muted-foreground">7-Day Total</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(costs.recentActivity.reduce((sum, day) => sum + day.embeddings, 0) / 7).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Daily Average</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.max(...costs.recentActivity.map(day => day.embeddings))}
                </div>
                <div className="text-xs text-muted-foreground">Peak Day</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {costs.topUsers.length > 0 ? (costs.topUsers.reduce((sum, user) => sum + user.avgPerformance, 0) / costs.topUsers.length * 100).toFixed(0) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Performance</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Usage Trends</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {costs.recentActivity.length >= 2 && (
                    <>
                      <div>
                        • <strong>Trend:</strong> {
                          costs.recentActivity[costs.recentActivity.length - 1].embeddings >
                          costs.recentActivity[costs.recentActivity.length - 2].embeddings ?
                          '📈 Increasing usage' : '📉 Decreasing usage'
                        }
                      </div>
                      <div>
                        • <strong>Most Active Day:</strong> {
                          costs.recentActivity.reduce((max, day) =>
                            day.embeddings > max.embeddings ? day : max
                          ).date
                        } ({Math.max(...costs.recentActivity.map(day => day.embeddings))} embeddings)
                      </div>
                    </>
                  )}
                  <div>
                    • <strong>User Distribution:</strong> {
                      costs.topUsers.length > 0 ?
                      `Top 20% users account for ${((costs.topUsers.slice(0, Math.ceil(costs.topUsers.length * 0.2)).reduce((sum, user) => sum + user.cost, 0) / costs.estimatedMonthlyCost) * 100).toFixed(0)}% of costs` :
                      'No usage data available'
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Usage Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-base">Immediate Actions</h4>
              <div>• <strong>Rate Limiting:</strong> Set 50 embeddings/hour per user</div>
              <div>• <strong>High Usage Alert:</strong> Monitor users exceeding $0.10/day</div>
              <div>• <strong>Performance Review:</strong> Focus on users with &lt;40% performance</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-base">Long-term Strategies</h4>
              <div>• <strong>Caching:</strong> Implement semantic similarity caching</div>
              <div>• <strong>Batch Processing:</strong> Group similar content requests</div>
              <div>• <strong>Auto-cleanup:</strong> Remove vectors older than 90 days</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-sm">
              <strong>💡 Smart Tip:</strong> {
                costs.estimatedMonthlyCost > 50 ?
                'Consider implementing user-specific rate limits for top users to reduce costs.' :
                costs.estimatedMonthlyCost > 25 ?
                'Monitor usage trends closely as you approach the warning threshold.' :
                'Current usage is within healthy limits. Focus on optimizing performance.'
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};