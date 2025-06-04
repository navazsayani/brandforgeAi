
"use client";

import React from 'react';
import NextImage from 'next/image'; 
// Removed AppShell import
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Send, Image as ImageIconLucide, MessageSquareText, Newspaper, Briefcase, ExternalLink } from 'lucide-react';
import type { GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function DeploymentHubPage() {
  const { generatedImages, generatedSocialPosts, generatedBlogPosts, generatedAdCampaigns } = useBrand();
  const { toast } = useToast();

  const handleDeploy = (platform: string, contentTitle: string) => {
    toast({
      title: `Deploying to ${platform}`,
      description: `"${contentTitle}" is being (mock) deployed.`,
    });
  };

  return (
    // AppShell is now handled by AuthenticatedLayout
    <div className="max-w-6xl mx-auto"> 
      <CardHeader className="px-0 mb-6">
          <div className="flex items-center space-x-3">
              <Send className="w-10 h-10 text-primary" />
              <div>
                  <CardTitle className="text-3xl font-bold">Deployment Hub</CardTitle>
                  <CardDescription className="text-lg">
                  Review and (mock) deploy your AI-generated content and campaigns.
                  </CardDescription>
              </div>
          </div>
      </CardHeader>

      {generatedImages.length === 0 && generatedSocialPosts.length === 0 && generatedBlogPosts.length === 0 && generatedAdCampaigns.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-lg text-muted-foreground">No content or campaigns generated yet.</p>
            <p className="text-sm text-muted-foreground">Visit the Content Studio or Campaign Manager to create assets.</p>
          </CardContent>
        </Card>
      )}

      {generatedImages.length > 0 && (
        <ContentSection title="Generated Images" icon={<ImageIconLucide className="w-6 h-6 text-primary" />}>
          {generatedImages.map((image) => (
            <GeneratedItemCard 
              key={image.id} 
              title={`Style: ${image.style.substring(0, 30)}${image.style.length > 30 ? '...' : ''}`} 
              description={`Prompt: ${image.prompt.substring(0,80)}${image.prompt.length > 80 ? '...' : ''}`}
            >
              <div className="relative w-full overflow-hidden border rounded-md aspect-[16/9] bg-muted mb-4"> 
                <NextImage src={image.src} alt="Generated brand image" layout="fill" objectFit="contain" data-ai-hint="brand visual" />
              </div>
              <CardFooter className="pt-4">
                <Button onClick={() => handleDeploy("Social Media Platform", `Image for ${image.style}`)} className="w-full">
                  <Send className="w-4 h-4 mr-2" /> Mock Post to Social
                </Button>
              </CardFooter>
            </GeneratedItemCard>
          ))}
        </ContentSection>
      )}

      {generatedSocialPosts.length > 0 && (
        <ContentSection title="Social Media Posts" icon={<MessageSquareText className="w-6 h-6 text-primary" />}>
          {generatedSocialPosts.map((post) => (
            <GeneratedItemCard 
              key={post.id} 
              title={`${post.platform}: ${post.tone}`} 
              description={post.caption} 
              footerContent={
                <Button onClick={() => handleDeploy(post.platform, post.caption.substring(0,30))} className="w-full">
                  <Send className="w-4 h-4 mr-2" /> Mock Post to {post.platform}
                </Button>
              }
            >
              {post.imageSrc && (
                <div className="relative w-full h-40 mb-3 overflow-hidden border rounded-md bg-muted"> 
                  <NextImage src={post.imageSrc} alt="Social post image" layout="fill" objectFit="cover" data-ai-hint="social media" />
                </div>
              )}
                <div className="mb-2 space-x-1">
                  {post.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
              </div>
            </GeneratedItemCard>
          ))}
        </ContentSection>
      )}

      {generatedBlogPosts.length > 0 && (
        <ContentSection title="Blog Posts" icon={<Newspaper className="w-6 h-6 text-primary" />}>
          {generatedBlogPosts.map((post) => (
            <GeneratedItemCard 
              key={post.id} 
              title={post.title} 
              description={post.content} 
              footerContent={
                <Button onClick={() => handleDeploy(post.platform, post.title)} className="w-full">
                  <Send className="w-4 h-4 mr-2" /> Mock Publish to {post.platform}
                </Button>
              }
            >              <div className="mb-1 text-xs text-muted-foreground">Platform: <Badge variant="outline">{post.platform}</Badge></div>
              <div className="mb-2 space-x-1">
                  {post.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
              </div>
            </GeneratedItemCard>
          ))}
        </ContentSection>
      )}

      {generatedAdCampaigns.length > 0 && (
        <ContentSection title="Ad Campaigns" icon={<Briefcase className="w-6 h-6 text-primary" />}>
          {generatedAdCampaigns.map((campaign) => (
            <GeneratedItemCard 
              key={campaign.id} 
              title={`Ad Campaign Summary`} 
              description={campaign.campaignConcept}
              footerContent={
                <Button onClick={() => handleDeploy("Ad Platforms", `Campaign: ${campaign.campaignConcept.substring(0,20)}...`)} className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" /> Mock Launch Campaign
                </Button>
              }
            >
                <div className="p-3 my-2 text-sm border rounded-md bg-secondary/50"> 
                    <h4 className="mb-1 font-semibold">Target Platforms:</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {campaign.targetPlatforms.map(platform => (
                          <Badge key={platform} variant="default">{platform.replace('_', ' ')}</Badge>
                      ))}
                    </div>
                    <h4 className="mt-3 mb-1 font-semibold">Platform Specifics:</h4>
                    <div className="p-4 prose border rounded-md bg-muted/50 max-w-none max-h-60 overflow-y-auto text-sm">
                        <p className="whitespace-pre-wrap">{campaign.platformGuidance}</p>
                    </div>
                </div>
            </GeneratedItemCard>
          ))}
        </ContentSection>
      )}
    </div>
  );
}

interface ContentSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ContentSection({ title, icon, children }: ContentSectionProps) {
  return (
    <div className="mb-12"> 
      <h2 className="flex items-center mb-6 text-2xl font-semibold"> 
        {icon}
        <span className="ml-3">{title}</span> 
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> 
        {children}
      </div>
    </div>
  );
}

interface GeneratedItemCardProps {
  title: string;
  description: string;
  children?: React.ReactNode; 
  footerContent?: React.ReactNode; 
}

function GeneratedItemCard({ title, description, children, footerContent }: GeneratedItemCardProps) {
  return (
    <Card className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-3"> 
        {children} 
        <p className="text-sm text-muted-foreground line-clamp-4 break-words"> 
            {description}
        </p>
      </CardContent>
      {footerContent && (
        <CardFooter className="pt-4 mt-auto border-t"> 
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}
