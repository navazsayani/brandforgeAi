
"use client";

import React, { useState, useEffect } from 'react';
import { useActionState } from "react"; // Changed from react-dom
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox"
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Type, DollarSign, Target, CheckSquare, Copy } from 'lucide-react';
import { handleGenerateAdCampaignAction, type FormState } from '@/lib/actions';
import { SubmitButton } from "@/components/SubmitButton";
import type { GeneratedAdCampaign } from '@/types';

const initialFormState: FormState = { error: undefined, data: undefined, message: undefined };

const platforms = [
  { id: "google_ads", label: "Google Ads" },
  { id: "meta", label: "Meta (Facebook/Instagram)" },
] as const;


export default function CampaignManagerPage() {
  const { brandData, addGeneratedAdCampaign, generatedBlogPosts, generatedSocialPosts } = useBrand(); // Assuming you might want to use generated content
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleGenerateAdCampaignAction, initialFormState); // Changed from useFormState
  const [generatedCampaign, setGeneratedCampaign] = useState<{campaignSummary: string; platformDetails: Record<string, string>} | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

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
    ...generatedBlogPosts.map(p => ({ id: `blog-${p.id}`, label: `Blog: ${p.title}`, content: p.title + "\n" + p.content.substring(0,100)+"..."})),
  ];

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
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="adBrandName" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Name</Label>
                <Input
                  id="adBrandName"
                  name="brandName"
                  defaultValue={brandData?.brandName || ""}
                  placeholder="Your brand's name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adBrandDescription" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Description</Label>
                <Textarea
                  id="adBrandDescription"
                  name="brandDescription"
                  defaultValue={brandData?.brandDescription || ""}
                  placeholder="Detailed brand description"
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="adGeneratedContent" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Ad Content</Label>
                <Select name="generatedContent" required>
                  <SelectTrigger id="adGeneratedContent">
                    <SelectValue placeholder="Select generated content for ad" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContent.length > 0 ? (
                      availableContent.map(item => (
                        <SelectItem key={item.id} value={item.content}>{item.label}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No content generated yet. Create some in Content Studio.</SelectItem>
                    )}
                     <SelectItem value="Custom content for ad campaign">Custom (type below)</SelectItem>
                  </SelectContent>
                </Select>
                 <Textarea
                    name="customGeneratedContent" 
                    placeholder="If 'Custom' selected above, paste or write your ad copy here. Otherwise, this can be left blank."
                    rows={3}
                    className="mt-2"
                  />
              </div>
              <div>
                <Label htmlFor="adTargetKeywords" className="flex items-center mb-1"><Target className="w-4 h-4 mr-2 text-primary" />Target Keywords</Label>
                <Input
                  id="adTargetKeywords"
                  name="targetKeywords"
                  defaultValue={brandData?.targetKeywords || ""}
                  placeholder="Comma-separated keywords (e.g., digital marketing, AI tools)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adBudget" className="flex items-center mb-1"><DollarSign className="w-4 h-4 mr-2 text-primary" />Budget ($)</Label>
                <Input
                  id="adBudget"
                  name="budget"
                  type="number"
                  placeholder="E.g., 500"
                  required
                />
              </div>
              <div>
                <Label className="flex items-center mb-2"><CheckSquare className="w-4 h-4 mr-2 text-primary" />Platforms</Label>
                <input type="hidden" name="platforms" value={selectedPlatforms.join(',')} />
                <div className="space-y-2">
                  {platforms.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={selectedPlatforms.includes(item.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? setSelectedPlatforms((prev) => [...prev, item.id])
                            : setSelectedPlatforms((prev) => prev.filter((value) => value !== item.id))
                        }}
                      />
                      <label
                        htmlFor={item.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
                 {selectedPlatforms.length === 0 && <p className="text-destructive text-xs mt-1">Please select at least one platform.</p>}
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton className="w-full" loadingText="Generating Campaign..." disabled={selectedPlatforms.length === 0}>Generate Ad Campaign</SubmitButton>
            </CardFooter>
          </form>
          {generatedCampaign && (
            <CardContent className="mt-6 space-y-4">
              <div>
                <h3 className="mb-1 text-lg font-semibold">Campaign Summary:</h3>
                 <div className="p-3 prose border rounded-md bg-secondary max-w-none max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{generatedCampaign.campaignSummary}</p>
                  </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedCampaign.campaignSummary, "Summary")} className="mt-1">
                  <Copy className="w-3 h-3 mr-1" /> Copy Summary
                </Button>
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Platform Details:</h3>
                <div className="p-3 border rounded-md bg-secondary">
                  {Object.entries(generatedCampaign.platformDetails).map(([platform, details]) => (
                    <div key={platform} className="mb-2">
                      <strong className="capitalize">{platform.replace('_', ' ')}:</strong>
                      <p className="text-sm whitespace-pre-wrap">{details}</p>
                    </div>
                  ))}
                </div>
                 <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(generatedCampaign.platformDetails, null, 2), "Details")} className="mt-1">
                  <Copy className="w-3 h-3 mr-1" /> Copy Details
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
