"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Clock } from 'lucide-react';
import type { ContentTemplate } from '@/lib/content-templates';

interface TemplateInputModalProps {
  template: ContentTemplate | null;
  open: boolean;
  onClose: () => void;
  onApply: (template: ContentTemplate, userInput: Record<string, string>) => void;
}

export function TemplateInputModal({
  template,
  open,
  onClose,
  onApply
}: TemplateInputModalProps) {
  const [userInput, setUserInput] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setUserInput(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (!template) return;

    // Validate required inputs
    const missingInputs = template.requiredUserInputs
      .filter(input => !userInput[input.key] || userInput[input.key].trim() === '');

    if (missingInputs.length > 0) {
      return; // Form validation will show errors
    }

    onApply(template, userInput);
    setUserInput({}); // Reset for next use
    onClose();
  };

  const handleClose = () => {
    setUserInput({});
    onClose();
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{template.icon}</span>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {template.name}
                {template.premium && (
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {template.description}
              </DialogDescription>
            </div>
          </div>

          {/* Template info badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {template.estimatedTime}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {template.category === 'image' ? 'Image Generation' : 'Social Post'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>
                This template will use your brand details automatically. Just fill in the fields below!
              </span>
            </p>
          </div>

          {template.requiredUserInputs.map((input) => (
            <div key={input.key} className="space-y-2">
              <Label htmlFor={input.key}>
                {input.label}
                <span className="text-destructive ml-1">*</span>
              </Label>

              {input.type === 'text' && (
                <Input
                  id={input.key}
                  placeholder={input.placeholder}
                  value={userInput[input.key] || ''}
                  onChange={(e) => handleInputChange(input.key, e.target.value)}
                  maxLength={input.maxLength}
                />
              )}

              {input.type === 'textarea' && (
                <Textarea
                  id={input.key}
                  placeholder={input.placeholder}
                  value={userInput[input.key] || ''}
                  onChange={(e) => handleInputChange(input.key, e.target.value)}
                  maxLength={input.maxLength}
                  rows={3}
                />
              )}

              {input.type === 'select' && (
                <Select
                  value={userInput[input.key] || ''}
                  onValueChange={(value) => handleInputChange(input.key, value)}
                >
                  <SelectTrigger id={input.key}>
                    <SelectValue placeholder={input.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {input.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {input.maxLength && (
                <p className="text-xs text-muted-foreground">
                  {userInput[input.key]?.length || 0} / {input.maxLength} characters
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="btn-gradient-primary gap-2"
            disabled={template.requiredUserInputs.some(
              input => !userInput[input.key] || userInput[input.key].trim() === ''
            )}
          >
            <Sparkles className="h-4 w-4" />
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
