"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Clock, Zap } from 'lucide-react';
import type { ContentTemplate } from '@/lib/content-templates';
import { cn } from '@/lib/utils';

interface ContentTemplateCardProps {
  template: ContentTemplate;
  onSelect: (template: ContentTemplate) => void;
  disabled?: boolean;
  isPremium?: boolean;
}

export function ContentTemplateCard({
  template,
  onSelect,
  disabled = false,
  isPremium = false
}: ContentTemplateCardProps) {
  const isLocked = template.premium && !isPremium;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 h-full flex flex-col",
        isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !isLocked && !disabled && onSelect(template)}
    >
      {/* Premium badge */}
      {template.premium && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant={isPremium ? "default" : "secondary"} className="gap-1">
            <Lock className="h-3 w-3" />
            {isPremium ? "Pro" : "Premium"}
          </Badge>
        </div>
      )}

      <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Icon and name */}
        <div className="flex items-start gap-2 sm:gap-3 mb-2">
          <div className="text-2xl sm:text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            {template.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-primary transition-colors break-words">
              {template.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem] break-words">
              {template.description}
            </p>
          </div>
        </div>

        {/* Tags - Fixed height section */}
        <div className="flex flex-wrap gap-1 mb-3 min-h-[1.75rem]">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 h-fit whitespace-nowrap">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer - Pushed to bottom */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto gap-2">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{template.estimatedTime}</span>
          </div>
          {!isLocked && (
            <div className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all flex-shrink-0">
              <span className="hidden xs:inline">Use template</span>
              <span className="inline xs:hidden">Use</span>
              <Zap className="h-3 w-3 flex-shrink-0" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
