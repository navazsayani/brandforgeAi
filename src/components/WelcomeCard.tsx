
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight, Sparkles } from 'lucide-react';

export function WelcomeCard() {
  return (
    <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-2xl text-center py-10 px-6 animate-fade-in shadow-xl bg-secondary/30 border-primary/20">
            <CardHeader>
                <div className="w-fit mx-auto p-4 bg-primary/10 rounded-full mb-4">
                    <Rocket className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold text-balance">
                    Welcome to BrandForge AI!
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2 text-balance">
                    Let's create a powerful brand identity together.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 bg-background rounded-lg border">
                    <h3 className="font-semibold text-lg">Your Brand Profile is the AI's Brain</h3>
                    <p className="text-muted-foreground mt-2">
                        Before we can start creating amazing content, we need to teach the AI about your brand. Your Brand Profile is where you define your voice, style, and mission. It's the most important step to unlocking the full power of BrandForge AI.
                    </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <p className="font-semibold text-foreground">
                            Complete your profile to receive <strong className="text-primary">3 FREE AI-generated brand images!</strong>
                        </p>
                    </div>
                </div>

                <Button asChild size="lg" className="w-full sm:w-auto btn-gradient-primary btn-lg-enhanced">
                    <Link href="/brand-profile">
                        Create My Brand Profile
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
