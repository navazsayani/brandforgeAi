
"use client";

import React, { useState, useEffect } from 'react';
import { useActionState } from "react";
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox"
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Type, DollarSign, Target, CheckSquare, Copy, Info, Edit3, AlignLeft, MessageSquare } from 'lucide-react';
import { handleGenerateAdCampaignAction, type FormState } from '@/lib/actions';
import { SubmitButton } from "@/components/SubmitButton";
import type { GeneratedAdCampaign } from '@/types';

const initialFormState: FormState = { error: undefined, data: undefined, message: undefined };

const platforms = [
  { id: "google_ads", label: "Google Ads" },
  { id: "meta", label: "Meta (Facebook/Instagram)" },
] as const;


export default function CampaignManagerPage() {
  const { brandData, addGeneratedAdCampaign, generatedBlogPosts, generatedSocialPosts } = useBrand();
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleGenerateAdCampaignAction, initialFormState);
  const [generatedCampaign, setGeneratedCampaign] = useState<{campaignSummary: string; platformDetails: Record<string, string>} | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedContentSource, setSelectedContentSource] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (state.data) {
      setGeneratedCampaign(state.data);
      const newCampaign: GeneratedAdCampaign = {
        id: new Date().toISOString(),
        summary: state.data.campaignSummary,
        platformDetails: state.data.platformDetails,
        targetPlatforms: selectedPlatforms as ('google_ads' | 'meta')[],
      };
      addGeneratedAdCampaign(newCampaign);
      toast({ title: "Success", description: state.message });
    }
    if (state.error) toast({ title: "Error", description: state.error, variant: "destructive" });
  }, [state, toast, addGeneratedAdCampaign, selectedPlatforms]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} Copied!`, description: "Content copied to clipboard." });
  };

  const availableContent = [
    ...generatedSocialPosts.map(p => ({ id: `social-${p.id}`, label: `Social: ${p.caption.substring(0,30)}...`, content: p.caption })),
    ...generatedBlogPosts.map(p => ({ id: `blog-${p.id}`, label: `Blog: ${p.title}`, content: `${p.title}\n\n${p.content}`})),
  ].filter(item => item.content && item.content.trim() !== "");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
                <Briefcase className="w-10 h-10 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">Ad Campaign Manager</CardTitle>
                    <CardDescription className="text-lg">
                    Automatically generate and configure ad campaigns for Google Ads and Meta.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-8">
              <div>
                <Label htmlFor="adBrandName" className="flex items-center mb-2 text-base"><Edit3 className="w-5 h-5 mr-2 text-primary" />Brand Name</Label>
                <Input
                  id="adBrandName"
                  name="brandName"
                  defaultValue={brandData?.brandName || ""}
                  placeholder="Your brand's name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adBrandDescription" className="flex items-center mb-2 text-base"><AlignLeft className="w-5 h-5 mr-2 text-primary" />Brand Description</Label>
                <Textarea
                  id="adBrandDescription"
                  name="brandDescription"
                  defaultValue={brandData?.brandDescription || ""}
                  placeholder="Detailed brand description, values, and target audience"
                  rows={4} 
                  required
                />
              </div>
              <div>
                <Label htmlFor="adGeneratedContent" className="flex items-center mb-2 text-base"><MessageSquare className="w-5 h-5 mr-2 text-primary" />Ad Content Source</Label>
                <Select 
                  name="generatedContent" 
                  required 
                  onValueChange={setSelectedContentSource}
                  value={selectedContentSource}
                >
                  <SelectTrigger id="adGeneratedContent">
                    <SelectValue placeholder="Select generated content or choose 'Custom'" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContent.length > 0 ? (
                      availableContent.map(item => (
                        <SelectItem key={item.id} value={item.content}>
                          {item.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        No pre-generated content available.
                      </div>
                    )}
                    {availableContent.length > 0 && <SelectSeparator />}
                    <SelectItem value="Custom content for ad campaign">Custom (type below)</SelectItem>
                  </SelectContent>
                </Select>
                {selectedContentSource === "Custom content for ad campaign" && (
                 <Textarea
                    name="customGeneratedContent" 
                    placeholder="Paste or write your ad copy here for the custom campaign."
                    rows={4}
                    className="mt-3" 
                    required
                  />
                )}
              </div>
              <div>
                <Label htmlFor="adTargetKeywords" className="flex items-center mb-2 text-base"><Target className="w-5 h-5 mr-2 text-primary" />Target Keywords</Label>
                <Input
                  id="adTargetKeywords"
                  name="targetKeywords"
                  defaultValue={brandData?.targetKeywords || ""}
                  placeholder="Comma-separated keywords (e.g., digital marketing, AI tools)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adBudget" className="flex items-center mb-2 text-base"><DollarSign className="w-5 h-5 mr-2 text-primary" />Budget ($)</Label>
                <Input
                  id="adBudget"
                  name="budget"
                  type="number"
                  placeholder="E.g., 500"
                  required
                />
              </div>
              <div>
                <Label className="flex items-center mb-3 text-base"><CheckSquare className="w-5 h-5 mr-2 text-primary" />Platforms</Label>
                <input type="hidden" name="platforms" value={selectedPlatforms.join(',')} />
                <div className="space-y-3"> 
                  {platforms.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-secondary/50 transition-colors"> 
                      <Checkbox
                        id={item.id}
                        checked={selectedPlatforms.includes(item.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? setSelectedPlatforms((prev) => [...prev, item.id])
                            : setSelectedPlatforms((prev) => prev.filter((value) => value !== item.id))
                        }}
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor={item.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
                 {selectedPlatforms.length === 0 && <p className="text-destructive text-xs mt-2">Please select at least one platform.</p>}
              </div>
            </CardContent>
            <CardFooter className="pt-4"> 
              <SubmitButton className="w-full" size="lg" loadingText="Generating Campaign..." disabled={selectedPlatforms.length === 0}>Generate Ad Campaign</SubmitButton>
            </CardFooter>
          </form>
          {generatedCampaign && (
            <CardContent className="mt-8 space-y-6 border-t pt-6">
              <div>
                <h3 className="mb-2 text-xl font-semibold flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/>Campaign Summary</h3>
                 <div className="p-4 prose border rounded-md bg-muted/50 max-w-none max-h-60 overflow-y-auto text-sm">
                    <p className="whitespace-pre-wrap">{generatedCampaign.campaignSummary}</p>
                  </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedCampaign.campaignSummary, "Summary")} className="mt-2 text-muted-foreground hover:text-primary">
                  <Copy className="w-4 h-4 mr-2" /> Copy Summary
                </Button>
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold flex items-center"><Briefcase className="w-5 h-5 mr-2 text-primary"/>Platform Details</h3>
                <div className="p-4 border rounded-md bg-muted/50 space-y-3">
                  {Object.entries(generatedCampaign.platformDetails).map(([platform, details]) => (
                    <div key={platform}>
                      <strong className="capitalize block mb-1 text-primary">{platform.replace('_', ' ')}:</strong>
                      <p className="text-sm whitespace-pre-wrap text-foreground">{details}</p>
                    </div>
                  ))}
                </div>
                 <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(generatedCampaign.platformDetails, null, 2), "Details")} className="mt-2 text-muted-foreground hover:text-primary">
                  <Copy className="w-4 h-4 mr-2" /> Copy Details
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
