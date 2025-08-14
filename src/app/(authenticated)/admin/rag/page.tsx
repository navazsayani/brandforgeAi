"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RAGCostMonitor } from '@/components/admin/RAGCostMonitor';
import { RAGVectorizationManager } from '@/components/admin/RAGVectorizationManager';
import { RAGSystemSettings } from '@/components/admin/RAGSystemSettings';
import { Brain, DollarSign, Settings, Zap } from 'lucide-react';

export default function RAGAdminPage() {
  const { currentUser } = useAuth();

  // Admin-only access control
  if (currentUser?.email !== 'admin@brandforge.ai') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              Access denied. Admin privileges required for RAG management.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">RAG Administration</h1>
          <p className="text-lg text-muted-foreground">
            Manage RAG system, costs, vectorization, and performance
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cost Monitor
          </TabsTrigger>
          <TabsTrigger value="vectorization" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Vectorization
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Cost Monitor Tab */}
        <TabsContent value="overview" className="space-y-6">
          <RAGCostMonitor adminEmail={currentUser.email} />
        </TabsContent>

        {/* Vectorization Management Tab */}
        <TabsContent value="vectorization" className="space-y-6">
          <RAGVectorizationManager adminEmail={currentUser.email} />
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <RAGSystemSettings adminEmail={currentUser.email} />
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced RAG Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Advanced analytics dashboard coming soon...</p>
                <p className="text-sm mt-2">Will include performance trends, user behavior analysis, and optimization recommendations.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}