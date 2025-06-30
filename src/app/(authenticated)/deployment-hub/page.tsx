
"use client";

import React, { useState, useMemo, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import NextImage from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, Image as ImageIconLucide, MessageSquareText, Newspaper, Briefcase, AlertCircle, RefreshCw, Layers, CheckCircle, Loader2, Copy } from 'lucide-react';
import type { GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';
import { cn } from '@/lib/utils';
import { handleUpdateContentStatusAction, type FormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Combined type for all deployable content
type DeployableContent =
  (GeneratedSocialMediaPost & { type: 'social'; docPath: string }) |
  (GeneratedBlogPost & { type: 'blog'; docPath: string }) |
  (GeneratedAdCampaign & { type: 'ad'; docPath: string });

// --- Data Fetching Functions ---
const fetchSocialPosts = async (userId: string): Promise<DeployableContent[]> => {
  const path = `users/${userId}/brandProfiles/${userId}/socialMediaPosts`;
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'social', docPath: doc.ref.path } as DeployableContent));
};

const fetchBlogPosts = async (userId: string): Promise<DeployableContent[]> => {
  const path = `users/${userId}/brandProfiles/${userId}/blogPosts`;
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'blog', docPath: doc.ref.path } as DeployableContent));
};

const fetchAdCampaigns = async (userId: string): Promise<DeployableContent[]> => {
  const path = `users/${userId}/brandProfiles/${userId}/adCampaigns`;
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'ad', docPath: doc.ref.path } as DeployableContent));
};

// Main page component
export default function DeploymentHubPage() {
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'social' | 'blog' | 'ad'>('all');

  const { data: socialPosts = [], isLoading: isLoadingSocial, error: errorSocial } = useQuery({
    queryKey: ['socialPosts', currentUser?.uid],
    queryFn: () => fetchSocialPosts(currentUser!.uid),
    enabled: !!currentUser,
  });

  const { data: blogPosts = [], isLoading: isLoadingBlog, error: errorBlog } = useQuery({
    queryKey: ['blogPosts', currentUser?.uid],
    queryFn: () => fetchBlogPosts(currentUser!.uid),
    enabled: !!currentUser,
  });

  const { data: adCampaigns = [], isLoading: isLoadingAds, error: errorAds } = useQuery({
    queryKey: ['adCampaigns', currentUser?.uid],
    queryFn: () => fetchAdCampaigns(currentUser!.uid),
    enabled: !!currentUser,
  });

  const isLoading = isLoadingSocial || isLoadingBlog || isLoadingAds;
  const fetchError = errorSocial || errorBlog || errorAds;

  const allContent = useMemo(() => {
    const combined = [...socialPosts, ...blogPosts, ...adCampaigns];
    return combined.sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [socialPosts, blogPosts, adCampaigns]);

  const filteredContent = useMemo(() => {
    if (activeFilter === 'all') return allContent;
    return allContent.filter(item => item.type === activeFilter);
  }, [allContent, activeFilter]);

  const filterOptions = [
    { id: 'all', label: 'All Content', icon: Layers },
    { id: 'social', label: 'Social Posts', icon: MessageSquareText },
    { id: 'blog', label: 'Blog Posts', icon: Newspaper },
    { id: 'ad', label: 'Ad Campaigns', icon: Briefcase },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <CardHeader className="px-0 mb-6">
        <div className="flex items-center space-x-3">
          <Send className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-3xl font-bold">Deployment Hub</CardTitle>
            <CardDescription className="text-lg">
              Review, manage status, and (mock) deploy your persistent AI-generated content.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div className="flex flex-wrap gap-2 mb-8">
        {filterOptions.map(opt => (
          <Button
            key={opt.id}
            variant={activeFilter === opt.id ? 'default' : 'outline'}
            onClick={() => setActiveFilter(opt.id as any)}
            className="flex items-center gap-2"
          >
            <opt.icon className="w-4 h-4" />
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      )}

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Content</AlertTitle>
          <AlertDescription>{fetchError.message}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !fetchError && filteredContent.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-lg text-muted-foreground">No content found for this filter.</p>
            <p className="text-sm text-muted-foreground">Visit the Content Studio or Campaign Manager to create assets.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !fetchError && filteredContent.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map(item => (
            <ContentCard key={item.docPath} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}


function ContentCard({ item }: { item: DeployableContent }) {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const initialFormState: FormState<{ success: boolean }> = { data: undefined, error: undefined, message: undefined };
    const [state, formAction] = useActionState(handleUpdateContentStatusAction, initialFormState);

    const renderContentPreview = () => {
        switch (item.type) {
            case 'social':
                return (
                    <>
                        {item.imageSrc && (
                            <div className="relative w-full h-40 mb-3 overflow-hidden border rounded-md bg-muted">
                                <NextImage src={item.imageSrc} alt="Social post image" fill style={{objectFit: 'cover'}} data-ai-hint="social media" />
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-3 break-words">{item.caption}</p>
                    </>
                );
            case 'blog':
                return (
                    <p className="text-sm text-muted-foreground line-clamp-4 break-words">{item.content}</p>
                );
            case 'ad':
                return (
                    <p className="text-sm text-muted-foreground line-clamp-4 break-words">{item.campaignConcept}</p>
                );
        }
    };

    const getTitle = () => {
        switch(item.type) {
            case 'social': return `Social: ${item.tone}`;
            case 'blog': return item.title;
            case 'ad': return `Ad: ${item.brandName || "Campaign"}`;
        }
    }

    const typeIcons = {
        social: MessageSquareText,
        blog: Newspaper,
        ad: Briefcase
    };
    const Icon = typeIcons[item.type];

    useEffect(() => {
        if(state.data?.success) {
            queryClient.invalidateQueries({ queryKey: ['socialPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['blogPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['adCampaigns', currentUser?.uid] });
        }
    }, [state.data?.success, queryClient, currentUser]);
    
    const isDeployed = item.status === 'deployed';
    const buttonProps = isDeployed 
        ? { newStatus: 'draft', text: 'Revert to Draft', icon: <RefreshCw className="w-4 h-4 mr-2" />, variant: 'secondary' as const } 
        : { newStatus: 'deployed', text: 'Mock Deploy', icon: <CheckCircle className="w-4 h-4 mr-2" />, variant: 'default' as const };

    return (
        <Card className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2">{getTitle()}</CardTitle>
                    <Badge variant={item.status === 'deployed' ? 'default' : 'secondary'} className="capitalize shrink-0">
                      {item.status || 'draft'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Icon className="w-4 h-4" />
                    <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'No date'}</span>
                </div>
                {renderContentPreview()}
            </CardContent>
            <CardFooter className="pt-4 mt-auto border-t grid grid-cols-2 gap-2">
                <ContentDetailsDialog item={item} />
                <form action={formAction}>
                    <input type="hidden" name="userId" value={currentUser?.uid || ''} />
                    <input type="hidden" name="docPath" value={item.docPath} />
                    <StatusButton {...buttonProps} />
                </form>
            </CardFooter>
        </Card>
    );
}

function StatusButton({ newStatus, text, icon, variant = "default" }: { newStatus: string, text: string, icon: React.ReactNode, variant?: "default" | "secondary" }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" name="newStatus" value={newStatus} className="w-full h-auto whitespace-normal" variant={variant} disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : icon}
            {pending ? `Updating...` : text}
        </Button>
    );
}

function DetailItem({ label, children, isBlock = false }: { label: string, children: React.ReactNode, isBlock?: boolean }) {
    if (!children) return null;
    return (
        <div className={cn("space-y-1", isBlock ? "py-2" : "grid grid-cols-3 gap-2 items-start")}>
            <dt className={cn("font-semibold text-muted-foreground", !isBlock && "col-span-1")}>{label}</dt>
            <dd className={cn("text-sm", isBlock ? "prose prose-sm max-w-none p-3 border rounded-md bg-muted/50 whitespace-pre-wrap" : "col-span-2")}>{children}</dd>
        </div>
    );
}

function CopyButton({ textToCopy }: { textToCopy: string }) {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        toast({ title: "Copied to clipboard!" });
    };
    return (
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6 text-muted-foreground hover:bg-accent/50">
            <Copy className="h-4 w-4" />
        </Button>
    );
}


function ContentDetailsDialog({ item }: { item: DeployableContent }) {
    const typeName = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    
    let details: React.ReactNode;
    switch (item.type) {
        case 'social':
            details = (
                <div className="space-y-4">
                    {item.imageSrc && (
                        <div className="relative w-full aspect-video border rounded-md bg-muted overflow-hidden">
                            <NextImage src={item.imageSrc} alt="Social post image" fill style={{objectFit:'contain'}} data-ai-hint="social media"/>
                        </div>
                    )}
                    <DetailItem label="Caption" isBlock>{item.caption}</DetailItem>
                    <DetailItem label="Hashtags" isBlock>{item.hashtags}</DetailItem>
                    <DetailItem label="Tone">{item.tone}</DetailItem>
                    <DetailItem label="Goal">{item.postGoal}</DetailItem>
                </div>
            );
            break;
        case 'blog':
            details = (
                <div className="space-y-4">
                     <DetailItem label="Title">{item.title}</DetailItem>
                     <DetailItem label="Tags">{item.tags}</DetailItem>
                     <DetailItem label="Content" isBlock><p>{item.content}</p></DetailItem>
                </div>
            );
            break;
        case 'ad':
             details = (
                <div className="space-y-4">
                    <DetailItem label="Concept" isBlock>{item.campaignConcept}</DetailItem>
                    <div className="space-y-2 pt-2">
                        <h4 className="font-semibold text-muted-foreground">Headlines</h4>
                        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                            {item.headlines.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </div>
                    <div className="space-y-2 pt-2">
                        <h4 className="font-semibold text-muted-foreground">Body Texts</h4>
                        <ul className="space-y-2">
                            {item.bodyTexts.map((b, i) => <li key={i} className="p-2 border rounded bg-muted/50 text-sm whitespace-pre-wrap">{b}</li>)}
                        </ul>
                    </div>
                    <DetailItem label="Guidance" isBlock>{item.platformGuidance}</DetailItem>
                </div>
            );
            break;
        default:
            details = <p>No details available for this content type.</p>;
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">View Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{typeName} Details</DialogTitle>
                    <DialogDescription>
                        Full content view. Created on {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
                    <div className="space-y-4 py-4">{details}</div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
