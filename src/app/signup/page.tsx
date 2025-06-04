
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, UserPlus, Sparkles } from 'lucide-react';
import { SubmitButton } from '@/components/SubmitButton';

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // path of error
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signUp, error: authError, setError: setAuthError, isLoading } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setFormError(null);
    setAuthError(null); 
    const user = await signUp(data.email, data.password);
    if (user) {
      router.push('/dashboard'); // Redirect to dashboard on successful signup
    } else {
      // authError from context will be set by signUp function
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background container-responsive">
      <div className="animate-fade-in w-full max-w-md">
        <Card className="card-enhanced">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 p-4 bg-primary/10 rounded-2xl w-fit">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-break">Create Your Account</CardTitle>
            <CardDescription className="text-responsive text-break mt-2">
              Join BrandForge AI and start building your brand.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                {(authError || formError) && (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Signup Failed</AlertTitle>
                    <AlertDescription className="text-break">{authError || formError}</AlertDescription>
                  </Alert>
                )}

                <SubmitButton 
                  className="w-full btn-gradient-primary touch-target" 
                  loadingText="Creating Account..." 
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                </SubmitButton>
              </form>
            </Form>
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
  );
}
