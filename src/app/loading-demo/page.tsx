"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

// Loading Dots Component
function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
    </div>
  );
}

// Shimmer Bar Component
function ShimmerBar() {
  return (
    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer bg-[length:200%_100%]" />
    </div>
  );
}

export default function LoadingDemoPage() {
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Loading Animation Options</h1>
        <p className="text-muted-foreground">Compare different loading states for your generate buttons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Current: Plain Spinning Circle */}
        <Card>
          <CardHeader>
            <CardTitle>Current: Plain Spinner</CardTitle>
            <CardDescription>Your existing loading state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Simple but plain, no excitement</p>
          </CardContent>
        </Card>

        {/* Option 1: Pulsing Sparkles */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Option 1: Pulsing Sparkles
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Recommended</span>
            </CardTitle>
            <CardDescription>AI magic in action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full btn-gradient-primary">
              <Sparkles className="mr-2 h-4 w-4 animate-sparkle-pulse" />
              Generating...
            </Button>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center justify-center h-20">
                <Sparkles className="h-8 w-8 animate-sparkle-pulse text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">✨ Feels like AI creating magic, brand-aligned</p>
          </CardContent>
        </Card>

        {/* Option 2: Bouncing Dots */}
        <Card>
          <CardHeader>
            <CardTitle>Option 2: Bouncing Dots</CardTitle>
            <CardDescription>Professional, ChatGPT-style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">
              <LoadingDots className="mr-2 text-current" />
              <span className="ml-2">Generating...</span>
            </Button>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center justify-center h-20">
                <LoadingDots className="text-primary scale-150" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">● ● ● Industry standard, feels like "AI thinking"</p>
          </CardContent>
        </Card>

        {/* Option 3: Gradient Ring */}
        <Card>
          <CardHeader>
            <CardTitle>Option 3: Gradient Ring</CardTitle>
            <CardDescription>Modern, premium feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">
              <div className="mr-2 w-4 h-4 border-2 border-transparent rounded-full animate-spin-gradient" />
              Generating...
            </Button>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center justify-center h-20">
                <div className="w-12 h-12 border-4 border-transparent rounded-full animate-spin-gradient" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">🌀 Teal/gold colors, smooth and premium</p>
          </CardContent>
        </Card>

        {/* Option 4: Shimmer Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Option 4: Shimmer Progress Bar</CardTitle>
            <CardDescription>Shows work in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" disabled>
              Generating...
            </Button>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="space-y-2">
                <ShimmerBar />
                <p className="text-xs text-center text-muted-foreground">Generating your content...</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">📊 Shows progress, informative</p>
          </CardContent>
        </Card>

        {/* Option 5: Contextual Text */}
        <Card>
          <CardHeader>
            <CardTitle>Option 5: Animated Text</CardTitle>
            <CardDescription>Tells user what's happening</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="animate-pulse">Analyzing your brand...</span>
            </Button>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="space-y-2 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                <p className="text-sm animate-pulse">Generating creative concepts...</p>
                <p className="text-xs text-muted-foreground">Text cycles through stages</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">💬 High user feedback, educational</p>
          </CardContent>
        </Card>

        {/* Option 6: Hybrid (Recommended) */}
        <Card className="border-primary md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Option 6: Hybrid Approach
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Best Overall</span>
            </CardTitle>
            <CardDescription>Combines sparkles + dots + contextual text for longer operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Quick Action */}
              <div>
                <p className="text-sm font-medium mb-2">For Quick Actions (&lt;3 sec):</p>
                <Button className="w-full btn-gradient-primary">
                  <Sparkles className="mr-2 h-4 w-4 animate-sparkle-pulse" />
                  Generating...
                </Button>
              </div>

              {/* Long Action */}
              <div>
                <p className="text-sm font-medium mb-2">For Long Operations (images, blogs):</p>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="h-8 w-8 animate-sparkle-pulse text-primary" />
                    <div className="flex items-center gap-2">
                      <LoadingDots className="text-primary" />
                      <span className="text-sm text-muted-foreground">Generating your content...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">✨ Best of all worlds: Visual appeal + User feedback + Brand alignment</p>
          </CardContent>
        </Card>

      </div>

      <div className="mt-8 p-6 bg-secondary/20 rounded-lg">
        <h3 className="font-semibold mb-2">Implementation Effort:</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• <strong>Option 1 (Sparkles):</strong> Low - Just CSS animation + icon swap</li>
          <li>• <strong>Option 2 (Dots):</strong> Low - Small component + Tailwind</li>
          <li>• <strong>Option 3 (Gradient Ring):</strong> Medium - CSS animation with brand colors</li>
          <li>• <strong>Option 4 (Shimmer Bar):</strong> Medium - New component + positioning</li>
          <li>• <strong>Option 5 (Text):</strong> Low - Just text logic</li>
          <li>• <strong>Option 6 (Hybrid):</strong> Medium - Combines Option 1 + 2 + 5</li>
        </ul>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Visit <code className="bg-muted px-2 py-1 rounded">/loading-demo</code> to see these animations live
        </p>
      </div>
    </div>
  );
}
