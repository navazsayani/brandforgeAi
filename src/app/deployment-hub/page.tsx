
"use client";

import React from 'react';
import Image from 'next/image';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Send, Image as ImageIconLucide, MessageSquareText, Newspaper, Briefcase, ExternalLink } from 'lucide-react';
import type { GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';

export default function DeploymentHubPage() {
  const { generatedImages, generatedSocialPosts, generatedBlogPosts, generatedAdCampaigns } = useBrand();
  const { toast } = useToast();

  const handleDeploy = (platform: string, contentTitle: string) => {
    toast({
      title: `Deploying to ${platform}`,
      description: `"${contentTitle}" is being (mock) deployed.`,
    });
    // In a real app, API calls for deployment would happen here.
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
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

        {/* Generated Images Section */}
        {generatedImages.length > 0 && (
          <ContentSection title="Generated Images" icon={<ImageIconLucide className="w-6 h-6 text-primary" />}>
            {generatedImages.map((image) => (
              <GeneratedItemCard key={image.id} title={`Image: ${image.style.substring(0, 20)}...`} description={`Prompt: ${image.prompt.substring(0,50)}...`}>
                <div className="relative w-full overflow-hidden border rounded-md aspect-video bg-muted">
                  <Image src={image.src} alt="Generated brand image" layout="fill" objectFit="contain" data-ai-hint="brand visual" />
                </div>
                <CardFooter className="pt-4">
                  <Button onClick={() => handleDeploy("Social Media", `Image for ${image.style}`)} className="w-full">
                    <Send className="w-4 h-4 mr-2" /> Mock Post to Social
                  </Button>
                </CardFooter>
              </GeneratedItemCard>
            ))}
          </ContentSection>
        )}

        {/* Generated Social Media Posts Section */}
        {generatedSocialPosts.length > 0 && (
          <ContentSection title="Social Media Posts" icon={<MessageSquareText className="w-6 h-6 text-primary" />}>
            {generatedSocialPosts.map((post) => (
              <GeneratedItemCard key={post.id} title={`Instagram: ${post.tone}`} description={post.caption.substring(0,100) + "..."}>
                <p className="mb-2 text-xs text-muted-foreground">Hashtags: {post.hashtags}</p>
                {post.imageSrc && (
                  <div className="relative w-full h-32 mb-2 overflow-hidden border rounded-md">
                    <Image src={post.imageSrc} alt="Social post image" layout="fill" objectFit="cover" data-ai-hint="social media" />
                  </div>
                )}
                <CardFooter className="pt-4">
                  <Button onClick={() => handleDeploy(post.platform, post.caption.substring(0,30))} className="w-full">
                    <Send className="w-4 h-4 mr-2" /> Mock Post to {post.platform}
                  </Button>
                </CardFooter>
              </GeneratedItemCard>
            ))}
          </ContentSection>
        )}

        {/* Generated Blog Posts Section */}
        {generatedBlogPosts.length > 0 && (
          <ContentSection title="Blog Posts" icon={<Newspaper className="w-6 h-6 text-primary" />}>
            {generatedBlogPosts.map((post) => (
              <GeneratedItemCard key={post.id} title={post.title} description={post.content.substring(0,150) + "..."}>
                <p className="mb-2 text-xs text-muted-foreground">Tags: {post.tags}</p>
                <p className="mb-2 text-xs text-muted-foreground">Platform: {post.platform}</p>
                <CardFooter className="pt-4">
                   <Button onClick={() => handleDeploy(post.platform, post.title)} className="w-full">
                    <Send className="w-4 h-4 mr-2" /> Mock Publish to {post.platform}
                  </Button>
                </CardFooter>
              </GeneratedItemCard>
            ))}
          </ContentSection>
        )}

        {/* Generated Ad Campaigns Section */}
        {generatedAdCampaigns.length > 0 && (
          <ContentSection title="Ad Campaigns" icon={<Briefcase className="w-6 h-6 text-primary" />}>
            {generatedAdCampaigns.map((campaign) => (
              <GeneratedItemCard key={campaign.id} title={`Campaign for ${campaign.targetPlatforms.join(', ')}`} description={campaign.summary.substring(0,150) + "..."}>
                 <div className="p-2 my-2 text-xs border rounded-md bg-muted">
                  <h4 className="font-semibold">Platform Details:</h4>
                  {Object.entries(campaign.platformDetails).map(([key, value]) => (
                    <p key={key} className="truncate"><strong>{key.replace('_',' ')}:</strong> {String(value).substring(0,50)}...</p>
                  ))}
                 </div>
                <CardFooter className="pt-4">
                  <Button onClick={() => handleDeploy("Ad Platforms", `Campaign: ${campaign.summary.substring(0,20)}`)} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" /> Mock Launch Campaign
                  </Button>
                </CardFooter>
              </GeneratedItemCard>
            ))}
          </ContentSection>
        )}
      </div>
    </AppShell>
  );
}

interface ContentSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ContentSection({ title, icon, children }: ContentSectionProps) {
  return (
    <div className="mb-10">
      <h2 className="flex items-center mb-4 text-2xl font-semibold">
        {icon}
        <span className="ml-2">{title}</span>
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

interface GeneratedItemCardProps {
  title: string;
  description: string;
  children: React.ReactNode; // For image or specific content preview
}

function GeneratedItemCard({ title, description, children }: GeneratedItemCardProps) {
  return (
    <Card className="flex flex-col shadow-md hover:shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg truncate">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="mb-2 text-sm text-muted-foreground break-words overflow-hidden max-h-[6em] text-ellipsis">
            {description}
        </p>
        {children}
      </CardContent>
      {/* Footer is now part of children if needed */}
    </Card>
  );
}
