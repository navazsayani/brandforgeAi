
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
import { Send, Image as ImageIconLucide, MessageSquareText, Newspaper, Briefcase, AlertCircle, RefreshCw, Layers, CheckCircle, Loader2, Copy, Rocket, Facebook, Edit, Download, Trash2 } from 'lucide-react';
import type { GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';
import { cn } from '@/lib/utils';
import { handleDeleteContentAction, handleUpdateContentStatusAction, handleSimulatedDeployAction, handleUpdateContentAction, type FormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { SubmitButton } from '@/components/SubmitButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
            variant={activeFilter === opt.id ? 'default' : 'outline'}
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
                    <Icon className="w-4 h-4" />
                    <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'No date'}</span>
                </div>
                {renderContentPreview()}
            </CardContent>
            <CardFooter className={cn("pt-4 mt-auto border-t grid gap-2", isDeployed ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
                <ContentDetailsDialog item={item} />
                 {isDeployed ? (
                    <form action={formAction} className="w-full">
                        <input type="hidden" name="userId" value={currentUser?.uid || ''} />
                        <input type="hidden" name="docPath" value={item.docPath} />
                        <StatusButton newStatus="draft" text="Revert" icon={<RefreshCw className="w-4 h-4 mr-2" />} variant="secondary" />
                    </form>
                 ) : (
                    <>
                        <EditContentDialog item={item} />
                        <DeployDialog item={item} />
                    </>
                 )}
            </CardFooter>
        </Card>
    );
}

function StatusButton({ newStatus, text, icon, variant = "default", ...props }: { newStatus: string, text: string, icon: React.ReactNode, variant?: "default" | "secondary", [key: string]: any }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" name="newStatus" value={newStatus} className="w-full h-auto whitespace-normal" variant={variant} disabled={pending} {...props}>
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : icon}
            {pending ? `Updating...` : text}
        </Button>
    );
}

function DeployPlatformButton({ platform, icon, children }: { platform: string; icon: React.ReactNode; children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" name="platform" value={platform} className="w-full justify-start gap-3 h-auto" variant="outline" disabled={pending}>
             {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
             <span className="whitespace-normal text-left">{children}</span>
        </Button>
    )
}


function DeployDialog({ item }: { item: DeployableContent }) {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const initialFormState: FormState<{ success: boolean }> = { data: undefined, error: undefined, message: undefined };
    const [state, formAction] = useActionState(handleSimulatedDeployAction, initialFormState);

    useEffect(() => {
        if (state.data?.success) {
            setOpen(false); // Close dialog on success
            toast({ title: "Deployment Submitted", description: state.message });
            queryClient.invalidateQueries({ queryKey: ['socialPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['blogPosts', currentUser?.uid] });
            queryClient.invalidateQueries({ queryKey: ['adCampaigns', currentUser?.uid] });
        }
        if (state.error) {
            toast({ title: "Deployment Error", description: state.error, variant: "destructive" });
        }
    }, [state, setOpen, queryClient, currentUser, toast]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="w-full h-auto whitespace-normal">
                    <Rocket className="w-4 h-4 mr-2"/>
                    Deploy
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deploy Content</DialogTitle>
                    <DialogDescription>
                        Choose where to deploy this content. This is a simulation and will not post to a live account yet.
                    </DialogDescription>
                </DialogHeader>
                 <form action={formAction} className="space-y-4 py-4">
                    <input type="hidden" name="userId" value={currentUser?.uid || ''} />
                    <input type="hidden" name="docPath" value={item.docPath} />
                    <p className="text-sm font-semibold">Automated Deployment (Simulation)</p>
                    <div className="p-4 border rounded-lg bg-secondary/50 space-y-3">
                       <DeployPlatformButton platform="Meta" icon={<Facebook className="w-5 h-5 text-[#1877F2]" />}>
                           Deploy to Meta (Facebook/Instagram)
                       </DeployPlatformButton>
                       <DeployPlatformButton platform="X" icon={<XIcon className="w-5 h-5" />}>
                           Deploy to X (Twitter)
                       </DeployPlatformButton>
                    </div>
                 </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
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
                <Button variant="secondary" className="w-full h-auto whitespace-normal">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                 <DialogHeader>
                    <DialogTitle>Edit Content</DialogTitle>
                    <DialogDescription>Make changes to your generated content before deploying.</DialogDescription>
                 </DialogHeader>
                 
                 <form id={formId} action={updateFormAction}>
                     <input type="hidden" name="userId" value={currentUser?.uid || ''} />
                     <input type="hidden" name="docPath" value={item.docPath} />
                     <input type="hidden" name="contentType" value={item.type} />
                     <ScrollArea className="max-h-[60vh] my-4 pr-4 -mr-4">
                        {renderEditForm()}
                     </ScrollArea>
                 </form>

                 <DialogFooter>
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
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 text-muted-foreground hover:bg-accent/50">
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy content</span>
        </Button>
    );
}


function ContentDetailsDialog({ item }: { item: DeployableContent }) {
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
                <div className="space-y-4">
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
                </div>
            );
            break;
        case 'blog':
            copyText = `Title: ${item.title}\n\n${item.content}`;
            details = (
                <div className="space-y-4">
                     <DetailItem label="Title">{item.title}</DetailItem>
                     <DetailItem label="Tags">{item.tags}</DetailItem>
                     <DetailItem label="Content" isBlock><p>{item.content}</p></DetailItem>
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
                <Button variant="outline" className="w-full h-auto whitespace-normal">View Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle>{typeName} Details</DialogTitle>
                            <DialogDescription>
                                Created on {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
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
