
"use client";

import React, { useEffect, useState, useActionState, startTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { handleGetUsageForAllUsersAction, type FormState } from '@/lib/actions';
import { Loader2, BarChart } from 'lucide-react';
import type { AdminUserUsage } from '@/types';

const initialFetchState: FormState<AdminUserUsage[]> = { error: undefined, data: undefined, message: undefined };

export default function AdminUsageDashboardPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [usageData, setUsageData] = useState<AdminUserUsage[]>([]);

    const [fetchState, fetchAction] = useActionState(handleGetUsageForAllUsersAction, initialFetchState);

    useEffect(() => {
        if (currentUser?.email === 'admin@brandforge.ai') {
            const formData = new FormData();
            formData.append('adminRequesterEmail', currentUser.email);
            startTransition(() => {
                fetchAction(formData);
            });
        }
    }, [currentUser, fetchAction]);

    useEffect(() => {
        if (fetchState.data) {
            setUsageData(fetchState.data);
            setIsLoading(false);
        }
        if (fetchState.error) {
            toast({ title: "Error Fetching Usage Data", description: fetchState.error, variant: "destructive" });
            setIsLoading(false);
        }
    }, [fetchState, toast]);

    return (
        <div className="max-w-7xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center space-x-3">
                        <BarChart className="w-10 h-10 text-primary" />
                        <div>
                            <CardTitle className="text-3xl font-bold">User Usage Dashboard</CardTitle>
                            <CardDescription className="text-lg">
                                Track monthly content generation usage for all users.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="ml-4">Loading usage data...</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Brand Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Image Generations</TableHead>
                                    <TableHead className="text-center">Social Posts</TableHead>
                                    <TableHead className="text-center">Blog Posts</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No usage data found for the current month.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    usageData.map((user) => (
                                        <TableRow key={user.userId}>
                                            <TableCell className="font-medium">{user.brandName}</TableCell>
                                            <TableCell>{user.userEmail}</TableCell>
                                            <TableCell className="text-center">{user.imageGenerations}</TableCell>
                                            <TableCell className="text-center">{user.socialPosts}</TableCell>
                                            <TableCell className="text-center">{user.blogPosts}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
