// src/app/login/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, LogIn, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/layout/header';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type GoogleAuthData } from '@/contexts/auth-context'; 
import type { User } from '@/types'; // Keep User type for email/password login data structure
import { getUserProfile } from '@/app/actions/user.actions';


// Mock social icons
const GoogleIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path d="M1 1h22v22H1z" fill="none"/></svg>;

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { login, initiateGoogleLoginOrSignup } = useAuth(); 
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      // Simulate API call for login
      // In a real app, your backend would verify credentials and return user data.
      // For this mock, try to fetch user by email.
      // IMPORTANT: This is a simplified mock. Real password auth is complex.
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      // This is a MOCK login process.
      // It assumes if a user exists with this email, the password is "correct".
      // DO NOT use this logic in production.
      const potentialUser = await getUserProfile(values.email); // Try fetching by email as if it's an ID
      
      if (potentialUser) {
        // Password check would happen on backend. Here, we just proceed.
        login(potentialUser); // Call context login
      } else {
         // More specific mock for 'demo.user@example.com'
        if (values.email === 'demo.user@example.com' && values.password === 'password') {
            const demoUser: User = {
                id: 'mock-user-123',
                firstName: 'Demo',
                lastName: 'User',
                email: 'demo.user@example.com',
                profileImageUrl: 'https://picsum.photos/seed/demoUser/200/200',
                description: 'A passionate writer and reader on CardFeed.',
            };
            login(demoUser);
        } else {
            toast({
                title: "Login Failed",
                description: "User not found or credentials incorrect.",
                variant: "destructive",
            });
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    toast({
        title: `Connecting with Google...`,
        description: "Please wait while we authenticate you.",
    });

    // Simulate redirect to Google and back
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // Simulate data received from Google
    // In a real scenario, this would come from Google OAuth response
    const googleMockData: GoogleAuthData = {
        email: `google.user${Date.now().toString().slice(-5)}@example.com`,
        firstName: "GoogleUser", // Google might provide this
        lastName: "Example",   // Google might provide this
        profileImageUrl: `https://picsum.photos/seed/google${Date.now()}/200/200`, // Google might provide this
        googleId: `google-id-${Date.now()}` // A mock Google ID
    };
    
    initiateGoogleLoginOrSignup(googleMockData);
    // The AuthContext will now open the CompleteProfileDialog
    // and handle the rest of the flow.
    
    // setIsSubmitting(false); // This will be handled by the dialog flow completion
  };


  return (
    <>
    <AppHeader />
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 pt-28 md:pt-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Newspaper className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to your CardFeed account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <Button variant="outline" className="w-full" disabled={isSubmitting} onClick={handleGoogleLogin}>
              <GoogleIcon />
              <span className="ml-2">Login with Google</span>
            </Button>
          </div>

          <Separator className="my-6" />
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} disabled={isSubmitting} />
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </>
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href={isSubmitting ? "#" : "/signup"} className={`font-medium text-primary hover:underline ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
