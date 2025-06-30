
"use client";

import React, { useEffect, useState, useActionState, startTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { handleGetAllUserProfilesForAdminAction, handleUpdateUserPlanByAdminAction, type FormState } from '@/lib/actions';
import { Loader2, ShieldCheck, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import type { UserProfileSelectItem } from '@/types';
import { SubmitButton } from '@/components/SubmitButton';
import { Label } from '@/components/ui/label';

const initialFetchState: FormState<UserProfileSelectItem[]> = { error: undefined, data: undefined, message: undefined };
const initialUpdateState: FormState<{ success: boolean }> = { error: undefined, data: undefined, message: undefined };

export default function AdminDashboardPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserProfileSelectItem[]>([]);

    const [fetchState, fetchAction] = useActionState(handleGetAllUserProfilesForAdminAction, initialFetchState);
    const [updateState, updateAction] = useActionState(handleUpdateUserPlanByAdminAction, initialUpdateState);

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
            setUsers(fetchState.data);
            setIsLoading(false);
        }
        if (fetchState.error) {
            toast({ title: "Error Fetching Users", description: fetchState.error, variant: "destructive" });
            setIsLoading(false);
        }
    }, [fetchState, toast]);

    useEffect(() => {
        if (updateState.message && !updateState.error) {
            toast({ title: "Success", description: updateState.message });
            // Re-fetch users to show updated data
            if (currentUser?.email) {
                 const formData = new FormData();
                 formData.append('adminRequesterEmail', currentUser.email);
                 startTransition(() => fetchAction(formData));
            }
        }
        if (updateState.error) {
            toast({ title: "Update Failed", description: updateState.error, variant: "destructive" });
        }
    }, [updateState, toast, currentUser, fetchAction]);
    
    const handlePlanUpdate = (formData: FormData) => {
        if (currentUser?.email) {
            formData.append('adminRequesterEmail', currentUser.email);
            startTransition(() => updateAction(formData));
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center space-x-3">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                        <div>
                            <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
                            <CardDescription className="text-lg">
                                Manage users and their subscriptions.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="ml-4">Loading users...</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Brand Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Subscription Ends</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.userId}>
                                        <TableCell className="font-medium">{user.brandName}</TableCell>
                                        <TableCell>{user.userEmail}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.plan === 'premium' ? 'default' : 'secondary'} className="capitalize">
                                                {user.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.subscriptionEndDate
                                                ? format(new Date(user.subscriptionEndDate), 'PPP')
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <EditUserSubscriptionForm user={user} onUpdate={handlePlanUpdate} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function EditUserSubscriptionForm({ user, onUpdate }: { user: UserProfileSelectItem, onUpdate: (formData: FormData) => void }) {
    const [plan, setPlan] = useState<'free' | 'premium'>(user.plan || 'free');
    const [endDate, setEndDate] = useState<Date | undefined>(
        user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : undefined
    );
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('userId', user.userId);
        formData.append('plan', plan);
        if (plan === 'premium' && endDate) {
            formData.append('subscriptionEndDate', endDate.toISOString());
        }
        onUpdate(formData);
        setIsPopoverOpen(false);
    };

    return (
         <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <h4 className="font-medium leading-none">Edit {user.brandName}'s Plan</h4>
                        <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                    </div>
                     <div className="space-y-2">
                        <Label>Plan</Label>
                        <Select value={plan} onValueChange={(value: 'free' | 'premium') => setPlan(value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {plan === 'premium' && (
                        <div className="space-y-2">
                            <Label>Subscription End Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                     <div className="flex justify-end">
                       <SubmitButton size="sm" loadingText="Saving..." className="h-auto whitespace-normal">Save Changes</SubmitButton>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}
