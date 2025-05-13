// src/app/signup/page.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, UserPlus, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/layout/header';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, type GoogleAuthData } from '@/contexts/auth-context';


// Mock social icons
const GoogleIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path d="M1 1h22v22H1z" fill="none"/></svg>;

const signupSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  description: z.string().min(10, { message: 'Please tell us a bit about yourself (min 10 characters).' }).max(500, "Description must be 500 characters or less."),
});

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { signupWithEmail, initiateGoogleLoginOrSignup } = useAuth(); 

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsSubmitting(true);
    try {
      const newUser = await signupWithEmail({ // Use signupWithEmail for clarity
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password, 
        description: values.description,
      });
      if (newUser) {
        toast({
          title: "Account Created",
          description: "Welcome to CardFeed! Please log in.",
        });
        router.push('/login'); 
      } else {
        // This case should ideally be handled by signupWithEmail throwing an error
        toast({
            title: "Signup Failed",
            description: "Could not create your account. Please try again.",
            variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    toast({
        title: `Connecting with Google...`,
        description: "Please wait while we authenticate you.",
    });

    // Simulate redirect to Google and back
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // Simulate data received from Google
    const googleMockData: GoogleAuthData = {
        email: `google.signup${Date.now().toString().slice(-5)}@example.com`,
        firstName: "GoogleUser", 
        lastName: "Candidate",   
        profileImageUrl: `https://picsum.photos/seed/googlesignup${Date.now()}/200/200`,
        googleId: `google-id-signup-${Date.now()}`
    };
    
    initiateGoogleLoginOrSignup(googleMockData);
    // AuthContext will open CompleteProfileDialog
    // setIsSubmitting(false); // Handled by dialog flow
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
          <CardTitle className="text-2xl font-bold">Create your Account</CardTitle>
          <CardDescription>Join CardFeed today. It&apos;s free!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <Button variant="outline" className="w-full" disabled={isSubmitting} onClick={handleGoogleSignup}>
              <GoogleIcon />
              <span className="ml-2">Sign up with Google</span>
            </Button>
          </div>

          <Separator className="my-6" />
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About You</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us a bit about yourself..." 
                        {...field} 
                        disabled={isSubmitting} 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href={isSubmitting ? "#" : "/login"} className={`font-medium text-primary hover:underline ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
