"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Not directly used, but FormLabel is
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { SubmitButton } from '@/components/SubmitButton';
import NextImage from 'next/image'; // For Google icon
import PublicHeader from '@/components/PublicHeader';
import { sendWelcomeEmailAction } from '@/lib/email-actions';

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // path of error
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const { user: authUser, signUp, signInWithGoogle, error: authError, setError: setAuthError, isLoading } = useAuth();
  const router = useRouter();
  // const [formError, setFormError] = useState<string | null>(null); // Using authError directly

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect is now handled manually in onSubmit and handleGoogleSignUp
  // This prevents race conditions between auth state change and manual redirect

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    // setFormError(null);
    setAuthError(null);
    const user = await signUp(data.email, data.password);
    if (user) {
      // Send welcome email after successful signup
      try {
        await sendWelcomeEmailAction({
          email: data.email,
          userName: undefined, // Generic greeting for email signups
          userId: user.uid,
        });
        console.log('[Signup] Welcome email sent to:', data.email);
      } catch (error) {
        console.error('[Signup] Failed to send welcome email:', error);
        // Don't block signup if email fails - just log it
      }

      // Redirect to Quick Start instead of dashboard
      router.push('/quick-start?welcome=true');
    } else {
      // authError from context will be set by signUp function
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthError(null);
    const user = await signInWithGoogle();
    if (user) {
      // Send welcome email after successful Google signup
      try {
        await sendWelcomeEmailAction({
          email: user.email || '',
          userName: user.displayName || undefined, // Use Google name or generic greeting
          userId: user.uid,
        });
        console.log('[Signup] Welcome email sent to:', user.email);
      } catch (error) {
        console.error('[Signup] Failed to send welcome email:', error);
        // Don't block signup if email fails - just log it
      }

      // Redirect to Quick Start instead of dashboard
      router.push('/quick-start?welcome=true');
    }
  };

  return (
    <div className="bg-background text-foreground">
      <PublicHeader />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background container-responsive pt-24 pb-12">
        <div className="animate-fade-in w-full max-w-md">
          <Card className="card-enhanced">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-2xl w-fit">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gradient-brand">BrandForge AI</h1>
              </div>
              <CardTitle className="text-break">Create Your Account</CardTitle>
              <CardDescription className="text-responsive text-break mt-2">
                Join BrandForge AI and start building your brand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="focus-enhanced" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="focus-enhanced" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="focus-enhanced" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {authError && ( // Combined formError and authError
                    <Alert variant="destructive" className="animate-fade-in">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Signup Failed</AlertTitle>
                      <AlertDescription className="text-break">{authError}</AlertDescription>
                    </Alert>
                  )}

                  <SubmitButton 
                    className="w-full btn-gradient-primary touch-target" 
                    loadingText="Creating Account..." 
                    disabled={isLoading}
                  >
                    <UserPlus className="mr-2 h-5 w-5" /> Sign Up with Email
                  </SubmitButton>
                </form>
              </Form>
               <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full touch-target focus-enhanced hover:bg-muted/50"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                 {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <NextImage src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google icon" width={18} height={18} className="mr-2" data-ai-hint="Google logo" />
                )}
                Sign up with Google
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-2 pt-4">
              <p className="text-responsive-sm text-muted-foreground text-break">
                Already have an account?
                <Button variant="link" className="px-1 focus-enhanced" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}