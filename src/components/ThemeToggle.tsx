"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      description: 'Clean and bright interface',
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: 'System',
      description: 'Follow your device preference',
      icon: Monitor,
    },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <Palette className="w-6 h-6 text-primary" />
          Theme Preference
        </CardTitle>
        <CardDescription>
          Choose your preferred theme or follow your system setting. Changes apply instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
          className="space-y-4"
        >
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            const isActive = theme === option.value;
            
            return (
              <div key={option.value} className="relative">
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-secondary/50 ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="shrink-0"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-md ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {theme === 'system' && (
                    <div className="text-xs text-muted-foreground">
                      Currently: {resolvedTheme}
                    </div>
                  )}
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {/* Theme Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Preview</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <div className="space-y-2">
                <div className="h-2 bg-primary rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded w-2/3"></div>
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-secondary/30">
              <div className="space-y-2">
                <div className="h-2 bg-accent rounded w-2/3"></div>
                <div className="h-2 bg-muted rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Note */}
        <div className="text-xs text-muted-foreground p-3 bg-secondary/30 rounded-lg">
          <strong>Accessibility:</strong> All themes maintain WCAG 2.1 AA contrast ratios for optimal readability.
          {resolvedTheme === 'dark' && ' Dark mode reduces eye strain in low-light environments.'}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact theme toggle for navigation/header use
export function CompactThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 rounded-full border bg-muted/50">
      <TooltipProvider delayDuration={100}>
        {themeOptions.map((option) => (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <Button
                variant={theme === option.value ? 'default' : 'ghost'}
                size="icon"
                className={cn("h-8 w-8 rounded-full transition-all duration-200", 
                  theme === option.value && "shadow-sm"
                )}
                onClick={() => setTheme(option.value)}
                aria-label={`Set theme to ${option.label}`}
              >
                <option.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{option.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
