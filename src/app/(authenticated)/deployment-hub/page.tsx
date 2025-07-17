
"use client";

import React, { useState, useMemo, useActionState, useEffect, startTransition } from 'react';
import { useFormStatus } from 'react-dom';
import NextImage from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, Image as ImageIconLucide, MessageSquareText, Newspaper, Briefcase, AlertCircle, RefreshCw, Layers, CheckCircle, Loader2, Copy, Rocket, Facebook, Edit, Download, Trash2, Instagram, ExternalLink } from 'lucide-react';
import type { GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign, InstagramAccount } from '@/types';
import { cn } from '@/lib/utils';
import { handleDeleteContentAction, handleUpdateContentStatusAction, handleSimulatedDeployAction, handleUpdateContentAction, handleGetInstagramAccountsAction, type FormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { SubmitButton } from '@/components/SubmitButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import SocialMediaPreviews from '@/components/SocialMediaPreviews';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


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

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-1.148 13.5h1.22l-6.5-8.875H6.05l6.4 8.875Z" />
    </svg>
);

// Main page component
export default function DeploymentHubPage() {
  const { currentUser } = useAuth();
  const { brandData } = useBrand();
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
              Review, manage status, and deploy your AI-generated content.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div className="flex flex-wrap gap-2 mb-8">
        {filterOptions.map(opt => (
          <Button
            key={opt.id}
            variant={activeFilter === opt.id ? 'default' : 'secondary'}
            onClick={() => setActiveFilter(opt.id as any)}
            className="flex items-center gap-2 h-auto whitespace-normal"
          >
            <opt.icon className="w-4 h-4" />
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredContent.map(item => (
            <ContentCard key={item.docPath} item={item} brandData={brandData} />
          ))}
        </div>
      )}
    </div>
  );
}


function ContentCard({ item, brandData }: { item: DeployableContent; brandData: any }) {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
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
            case 'social':
                return item.caption ? item.caption.substring(0, 50) + (item.caption.length > 50 ? '...' : '') : "Untitled Social Post";
            case 'blog':
                return item.title || "Untitled Blog Post";
            case 'ad':
                return item.campaignConcept || "Ad Campaign Concept";
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
            toast({ title: "Status Updated", description: state.message });
            queryClient.invalidateQueries({ queryKey: ['socialPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['blogPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['adCampaigns', currentUser?.uid] });
        }
        if (state.error) {
            toast({ title: "Update Failed", description: state.error, variant: "destructive" });
        }
    }, [state, queryClient, currentUser, toast]);
    
    const isDeployed = item.status === 'deployed';

    return (
        <Card className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-grow">{getTitle()}</CardTitle>
                     <div className="flex items-center gap-1 shrink-0">
                        <Badge variant={item.status === 'deployed' ? 'default' : 'secondary'} className="capitalize">
                          {item.status || 'draft'}
                        </Badge>
                        <DeleteContentDialog item={item} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Badge variant="outline">
                        <Icon className="w-3 h-3 mr-1" />
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{item.createdAt ? format(new Date(item.createdAt.seconds * 1000), 'dd/MM/yyyy') : 'N/A'}</span>
                </div>
                {renderContentPreview()}
            </CardContent>
            <CardFooter className="pt-4 mt-auto border-t">
                <div className="flex flex-col gap-2 w-full">
                    {/* View Details button - always full width first row */}
                    <ContentDetailsDialog item={item} brandData={brandData} />
                    
                    {/* Action buttons - always full width second row */}
                    {isDeployed ? (
                        <form action={formAction} className="w-full">
                            <input type="hidden" name="userId" value={currentUser?.uid || ''} />
                            <input type="hidden" name="docPath" value={item.docPath} />
                            <StatusButton newStatus="draft" text="Revert" icon={<RefreshCw className="w-4 h-4 mr-2 flex-shrink-0" />} variant="secondary" />
                        </form>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <EditContentDialog item={item} />
                            <DeployDialog item={item} />
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

function StatusButton({ newStatus, text, icon, variant = "default", ...props }: { newStatus: string, text: string, icon: React.ReactNode, variant?: "default" | "secondary", [key: string]: any }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" name="newStatus" value={newStatus} className="w-full h-full min-w-0" variant={variant} disabled={pending} {...props}>
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" /> : icon}
            <span className="truncate">{pending ? `Updating...` : text}</span>
        </Button>
    );
}

function DeployDialog({ item }: { item: DeployableContent }) {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [accounts, setAccounts] = React.useState<InstagramAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
    const [requestId, setRequestId] = React.useState<string>('');

    const initialFetchState: FormState<{ accounts: InstagramAccount[] }> = { data: undefined, error: undefined, message: undefined };
    const [fetchState, fetchAccountsAction] = useActionState(handleGetInstagramAccountsAction, initialFetchState);
    
    const initialDeployState: FormState<{ success: boolean }> = { data: undefined, error: undefined, message: undefined };
    const [deployState, deployAction] = useActionState(handleSimulatedDeployAction, initialDeployState);

    // Generate unique request ID for tracking
    useEffect(() => {
        if (open) {
            const newRequestId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setRequestId(newRequestId);
            console.log(`[DEPLOY_FLOW] ${newRequestId}: Dialog opened for content type: ${item.type}, ID: ${item.id}`);
        }
    }, [open, item.type, item.id]);

    useEffect(() => {
        if (open && currentUser?.uid) {
            console.log(`[DEPLOY_FLOW] ${requestId}: Fetching Instagram accounts for user: ${currentUser.uid}`);
            const formData = new FormData();
            formData.append('userId', currentUser.uid);
            formData.append('requestId', requestId); // Pass request ID for tracking
            startTransition(() => {
                fetchAccountsAction(formData);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, currentUser?.uid, requestId]);

    useEffect(() => {
        if (fetchState.data) {
            console.log(`[DEPLOY_FLOW] ${requestId}: Successfully fetched ${fetchState.data.accounts.length} Instagram accounts`);
            setAccounts(fetchState.data.accounts);
        }
        if (fetchState.error) {
            console.error(`[DEPLOY_FLOW] ${requestId}: Failed to fetch Instagram accounts:`, fetchState.error);
            
            // Enhanced error handling with categorization
            let errorTitle = "Could Not Fetch Accounts";
            let errorDescription = fetchState.error;
            let actionableGuidance = "";

            if (fetchState.error.includes("Invalid OAuth access token")) {
                errorTitle = "Instagram Connection Issue";
                errorDescription = "Your Instagram connection has expired or is invalid.";
                actionableGuidance = "Please reconnect your Meta account in Settings to restore access.";
            } else if (fetchState.error.includes("Failed to fetch pages")) {
                errorTitle = "Facebook Pages Access Issue";
                errorDescription = "Unable to access your Facebook Pages.";
                actionableGuidance = "Ensure your Meta account has proper permissions and try reconnecting.";
            } else if (fetchState.error.includes("Network")) {
                errorTitle = "Connection Problem";
                errorDescription = "Unable to connect to Instagram services.";
                actionableGuidance = "Please check your internet connection and try again.";
            }

            toast({
                title: errorTitle,
                description: `${errorDescription} ${actionableGuidance}`,
                variant: "destructive"
            });
        }
    }, [fetchState, toast, requestId]);

    useEffect(() => {
        if (deployState.data?.success) {
            console.log(`[DEPLOY_FLOW] ${requestId}: Deployment successful for content ID: ${item.id}`);
            setOpen(false);
            toast({ title: "Deployment Submitted", description: deployState.message });
            // You might want to invalidate queries here if status changes upon deployment
        }
        if (deployState.error) {
            console.error(`[DEPLOY_FLOW] ${requestId}: Deployment failed for content ID: ${item.id}:`, deployState.error);
            
            // Enhanced deployment error handling
            let errorTitle = "Deployment Failed";
            let errorDescription = deployState.error;
            let actionableGuidance = "";

            if (deployState.error.includes("access token")) {
                errorTitle = "Authentication Error";
                errorDescription = "Your Instagram connection is no longer valid.";
                actionableGuidance = "Please reconnect your Meta account in Settings.";
            } else if (deployState.error.includes("rate limit")) {
                errorTitle = "Rate Limit Exceeded";
                errorDescription = "Too many posts in a short time.";
                actionableGuidance = "Please wait a few minutes before trying again.";
            } else if (deployState.error.includes("content policy")) {
                errorTitle = "Content Policy Violation";
                errorDescription = "The content doesn't meet Instagram's guidelines.";
                actionableGuidance = "Please review and edit your content before reposting.";
            }

            toast({
                title: errorTitle,
                description: `${errorDescription} ${actionableGuidance}`,
                variant: "destructive"
            });
        }
    }, [deployState, toast, setOpen, requestId, item.id]);
    
    const handleDeploy = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        console.log(`[DEPLOY_FLOW] ${requestId}: Starting deployment process`);
        
        if (!selectedAccountId) {
            console.warn(`[DEPLOY_FLOW] ${requestId}: No account selected for deployment`);
            toast({ title: "No Account Selected", description: "Please select an Instagram account to post to.", variant: "destructive" });
            return;
        }

        const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
        console.log(`[DEPLOY_FLOW] ${requestId}: Deploying to account: ${selectedAccount?.username || selectedAccountId}`);
        console.log(`[DEPLOY_FLOW] ${requestId}: Content details:`, {
            type: item.type,
            id: item.id,
            hasImage: item.type === 'social' && !!(item as any).imageSrc,
            contentLength: item.type === 'social' ? (item as any).caption?.length :
                          item.type === 'blog' ? (item as any).content?.length :
                          (item as any).campaignConcept?.length
        });

        const formData = new FormData(event.currentTarget);
        formData.append('selectedAccountId', selectedAccountId);
        formData.append('requestId', requestId); // Pass request ID for tracking
        
        deployAction(formData);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="w-full h-full min-w-0">
                    <Rocket className="w-4 h-4 mr-2 flex-shrink-0"/>
                    <span className="truncate">Deploy</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deploy Content</DialogTitle>
                    <DialogDescription>
                        Choose which connected account to publish this content to.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleDeploy} className="space-y-4 py-4">
                    <input type="hidden" name="userId" value={currentUser?.uid || ''} />
                    <input type="hidden" name="docPath" value={item.docPath} />

                    {fetchState.error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{fetchState.error}</AlertDescription></Alert>}
                    
                    {fetchState.data?.accounts.length === 0 && !fetchState.error && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No Instagram Business Accounts Found</AlertTitle>
                            <AlertDescription>
                                <p className="mb-2">To deploy content, Meta requires an Instagram Business account linked to a Facebook Page. We couldn&apos;t find any associated with your connected Meta profile.</p>
                                <p className="font-semibold">How to fix this:</p>
                                <ul className="list-decimal text-xs space-y-1 pl-4 mt-1">
                                    <li>Ensure you have converted your Instagram account to a <a href="https://help.instagram.com/502981923235522" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-primary">Business or Creator account</a>.</li>
                                    <li>Make sure your Instagram account is <a href="https://help.instagram.com/399237273466453" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-primary">linked to a Facebook Page</a> you manage.</li>
                                </ul>
                                <Button variant="link" asChild className="p-0 h-auto text-xs mt-2"><Link href="/settings">Reconnect your Meta account after making changes <ExternalLink className="w-3 h-3 ml-1" /></Link></Button>
                            </AlertDescription>
                        </Alert>
                    )}


                    {fetchState.data && fetchState.data.accounts.length > 0 && (
                        <RadioGroup onValueChange={setSelectedAccountId} value={selectedAccountId || ""}>
                            <Label>Select an Instagram Account</Label>
                            <div className="p-4 border rounded-lg bg-secondary/50 space-y-3 max-h-60 overflow-y-auto">
                                {fetchState.data.accounts.map(acc => (
                                    <Label key={acc.id} htmlFor={acc.id} className="flex items-center space-x-3 p-3 rounded-md border bg-background hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer transition-colors">
                                        <RadioGroupItem value={acc.id} id={acc.id} />
                                        <div className="flex items-center gap-2">
                                            <Instagram className="w-5 h-5" />
                                            <span>{acc.username}</span>
                                        </div>
                                    </Label>
                                ))}
                            </div>
                        </RadioGroup>
                    )}

                    {fetchState.data === undefined && !fetchState.error && (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="ml-3">Fetching your accounts...</p>
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton loadingText="Deploying..." disabled={!selectedAccountId}>
                            Publish to Instagram
                        </SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


function EditContentDialog({ item }: { item: DeployableContent }) {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    
    const initialUpdateState: FormState<{ success: boolean }> = { data: undefined, error: undefined };
    const [updateState, updateFormAction] = useActionState(handleUpdateContentAction, initialUpdateState);

    useEffect(() => {
        if (updateState.data?.success) {
            toast({ title: "Content Updated", description: updateState.message });
            setOpen(false);
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['socialPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['blogPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['adCampaigns', currentUser?.uid] });
        }
        if (updateState.error) {
            toast({ title: "Update Failed", description: updateState.error, variant: "destructive" });
        }
    }, [updateState, toast, setOpen, queryClient, currentUser]);

    const renderEditForm = () => {
        switch(item.type) {
            case 'social':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-caption">Caption</Label>
                            <Textarea id="edit-caption" name="caption" defaultValue={item.caption} rows={5} />
                        </div>
                        <div>
                            <Label htmlFor="edit-hashtags">Hashtags</Label>
                            <Textarea id="edit-hashtags" name="hashtags" defaultValue={item.hashtags} rows={2} />
                        </div>
                    </div>
                );
            case 'blog':
                return (
                    <div className="space-y-4">
                         <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input id="edit-title" name="title" defaultValue={item.title} />
                        </div>
                        <div>
                            <Label htmlFor="edit-content">Content</Label>
                            <Textarea id="edit-content" name="content" defaultValue={item.content} rows={10} />
                        </div>
                         <div>
                            <Label htmlFor="edit-tags">Tags</Label>
                            <Input id="edit-tags" name="tags" defaultValue={item.tags} />
                        </div>
                    </div>
                );
            case 'ad':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-concept">Campaign Concept</Label>
                            <Textarea id="edit-concept" name="campaignConcept" defaultValue={item.campaignConcept} rows={3} />
                        </div>
                        <div>
                            <Label>Headlines</Label>
                            {item.headlines.map((headline, index) => (
                                <Input key={index} name="headlines[]" defaultValue={headline} className="mb-2"/>
                            ))}
                        </div>
                         <div>
                            <Label>Body Texts</Label>
                            {item.bodyTexts.map((body, index) => (
                                <Textarea key={index} name="bodyTexts[]" defaultValue={body} rows={3} className="mb-2"/>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <p>This content type cannot be edited.</p>;
        }
    }

    const formId = `edit-form-${item.id}`;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full h-full min-w-0">
                    <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Edit</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Edit Content</DialogTitle>
                    <DialogDescription>Make changes to your generated content before deploying.</DialogDescription>
                </DialogHeader>
                <form id={formId} action={updateFormAction} className="py-4 space-y-4 flex-1 overflow-y-auto">
                      <input type="hidden" name="userId" value={currentUser?.uid || ''} />
                      <input type="hidden" name="docPath" value={item.docPath} />
                      <input type="hidden" name="contentType" value={item.type} />
                      {renderEditForm()}
                </form>
                <DialogFooter className="flex-shrink-0">
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <SubmitButton form={formId} loadingText="Saving...">Save Changes</SubmitButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteContentDialog({ item }: { item: DeployableContent }) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  
  const initialDeleteState: FormState<{ success: boolean }> = { data: undefined, error: undefined };
  const [deleteState, deleteAction] = useActionState(handleDeleteContentAction, initialDeleteState);

  useEffect(() => {
      if (deleteState.data?.success) {
          toast({ title: "Content Deleted", description: deleteState.message });
          setOpen(false);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['socialPosts', currentUser?.uid] });
          queryClient.invalidateQueries({ queryKey: ['blogPosts', currentUser?.uid] });
          queryClient.invalidateQueries({ queryKey: ['adCampaigns', currentUser?.uid] });
      }
      if (deleteState.error) {
          toast({ title: "Deletion Failed", description: deleteState.error, variant: "destructive" });
      }
  }, [deleteState, toast, setOpen, queryClient, currentUser]);


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4"/>
              <span className="sr-only">Delete Content</span>
          </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={deleteAction}>
            <input type="hidden" name="userId" value={currentUser?.uid || ''} />
            <input type="hidden" name="docPath" value={item.docPath} />
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this piece of content from your records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <SubmitButton variant="destructive" loadingText="Deleting...">Delete</SubmitButton>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DetailItem({ label, children, isBlock = false }: { label: string, children: React.ReactNode, isBlock?: boolean }) {
    if (!children) return null;
    return (
        <div className={cn("space-y-1", isBlock ? "py-2" : "grid grid-cols-3 gap-2 items-start")}>
            <dt className={cn("font-semibold text-muted-foreground", !isBlock && "col-span-1")}>{label}</dt>
            <dd className={cn("text-sm", isBlock ? "p-3 border rounded-md bg-muted/50" : "col-span-2")}>{children}</dd>
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
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 text-muted-foreground hover:bg-accent/50">
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy content</span>
        </Button>
    );
}


function ContentDetailsDialog({ item, brandData }: { item: DeployableContent; brandData: any }) {
    const typeName = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    
    let details: React.ReactNode;
    let copyText: string = '';

    const downloadImage = (imageUrl: string, filename = "brandforge-image.png") => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        if (!imageUrl.startsWith('data:')) {
            link.target = '_blank';
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    switch (item.type) {
        case 'social':
            copyText = `Caption:\n${item.caption}\n\nHashtags:\n${item.hashtags}`;
            details = (
                <div className="space-y-6">
                    {item.imageSrc && (
                        <div>
                             <div className="relative w-full aspect-video border rounded-md bg-muted overflow-hidden">
                                <NextImage src={item.imageSrc} alt="Social post image" fill style={{objectFit:'contain'}} data-ai-hint="social media"/>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => downloadImage(item.imageSrc!, `social-post-${item.id}.png`)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Image
                            </Button>
                        </div>
                    )}
                    <DetailItem label="Caption" isBlock>{item.caption}</DetailItem>
                    <DetailItem label="Hashtags" isBlock>{item.hashtags}</DetailItem>
                    <DetailItem label="Tone">{item.tone}</DetailItem>
                    <DetailItem label="Goal">{item.postGoal}</DetailItem>
                    
                    {/* Social Media Previews */}
                    <div className="pt-4 border-t border-gray-200">
                        <SocialMediaPreviews
                            caption={item.caption}
                            hashtags={item.hashtags}
                            imageSrc={item.imageSrc}
                            brandName={brandData?.brandName || "YourBrand"}
                            brandLogoUrl={brandData?.brandLogoUrl || null}
                        />
                    </div>
                </div>
            );
            break;
        case 'blog':
            copyText = `Title: ${item.title}\n\n${item.content}`;
            details = (
                <div className="space-y-4">
                     <DetailItem label="Title">{item.title}</DetailItem>
                     <DetailItem label="Tags">{item.tags}</DetailItem>
                     <DetailItem label="Content" isBlock>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm dark:prose-invert max-w-none">
                            {item.content}
                        </ReactMarkdown>
                     </DetailItem>
                </div>
            );
            break;
        case 'ad':
             copyText = `Concept:\n${item.campaignConcept}\n\nHeadlines:\n${item.headlines.join('\n')}\n\nBody Texts:\n${item.bodyTexts.join('\n\n')}`;
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
                <Button variant="outline" className="w-full h-full min-w-0">
                    <span className="truncate">View Details</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle>{typeName} Details</DialogTitle>
                            <DialogDescription>
                                Created on {item.createdAt ? format(new Date(item.createdAt.seconds * 1000), 'dd/MM/yyyy') : 'N/A'}
                            </DialogDescription>
                        </div>
                        <CopyButton textToCopy={copyText} />
                    </div>
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
