"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ContentTemplateCard } from './ContentTemplateCard';
import { TemplateInputModal } from './TemplateInputModal';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { ContentTemplate } from '@/lib/content-templates';
import { cn } from '@/lib/utils';

interface TemplateCarouselProps {
  templates: ContentTemplate[];
  onTemplateApply: (template: ContentTemplate, userInput: Record<string, string>) => void;
  isPremium?: boolean;
  className?: string;
  defaultCollapsed?: boolean;
}

export function TemplateCarousel({
  templates,
  onTemplateApply,
  isPremium = false,
  className,
  defaultCollapsed = true
}: TemplateCarouselProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setModalOpen(true);
  };

  const handleTemplateApply = (template: ContentTemplate, userInput: Record<string, string>) => {
    onTemplateApply(template, userInput);
  };

  // Determine category from templates (context-aware)
  const category = templates[0]?.category || 'image';
  const categoryLabel = category === 'image' ? 'Image' : 'Social Media';
  const categoryIcon = category === 'image' ? '🎨' : '📱';

  return (
    <>
      {/* Collapsed state: Subtle banner */}
      {isCollapsed && (
        <div className={cn("mb-4", className)}>
          <Button
            variant="outline"
            className="w-full justify-between items-center h-auto py-3 px-3 sm:px-4 border-dashed hover:border-solid hover:border-primary/50 transition-all overflow-hidden"
            onClick={() => setIsCollapsed(false)}
          >
            <div className="flex items-center gap-2 text-left min-w-0 flex-1 mr-2 overflow-hidden">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0 overflow-hidden flex-1">
                <span className="text-sm font-medium truncate">
                  Need inspiration?
                </span>
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  Try a pre-designed {categoryLabel.toLowerCase()} template {categoryIcon}
                </span>
                <span className="text-xs text-muted-foreground truncate sm:hidden">
                  {templates.length} templates {categoryIcon}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                {templates.length}
              </Badge>
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </Button>
        </div>
      )}

      {/* Expanded state: Full template carousel */}
      {!isCollapsed && (
        <Card className={cn("border-primary/20 mb-4", className)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base break-words leading-tight">{categoryLabel} Templates</CardTitle>
                  <CardDescription className="text-xs mt-1 break-words leading-relaxed">
                    Pre-designed templates to help you get started quickly
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                className="h-8 gap-1 flex-shrink-0 mt-0"
              >
                <span className="text-xs hidden sm:inline">Collapse</span>
                <ChevronUp className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Template grid - horizontal scroll on mobile, grid on desktop */}
            <div className="relative">
              {/* Mobile: Horizontal scroll */}
              <div className="block lg:hidden">
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-4">
                    {templates.map((template) => (
                      <div key={template.id} className="w-[260px] sm:w-[280px] flex-shrink-0">
                        <ContentTemplateCard
                          template={template}
                          onSelect={handleTemplateSelect}
                          isPremium={isPremium}
                        />
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {/* Desktop: Grid */}
              <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {templates.slice(0, 6).map((template) => (
                  <ContentTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                    isPremium={isPremium}
                  />
                ))}
              </div>

              {/* Show all templates on mobile if more than 6 */}
              {templates.length > 6 && (
                <div className="lg:hidden mt-3">
                  <p className="text-xs text-center text-muted-foreground">
                    Scroll to see all {templates.length} templates →
                  </p>
                </div>
              )}
            </div>

            {/* Helpful tip */}
            <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Templates use your brand profile automatically. You only need to fill in specific details!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template input modal */}
      <TemplateInputModal
        template={selectedTemplate}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApply={handleTemplateApply}
      />
    </>
  );
}
