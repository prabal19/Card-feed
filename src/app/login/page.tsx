// src/app/signup/page.tsx
'use client';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, UserPlus, Loader2, ShieldAlert } from 'lucide-react';
import { AppHeader } from '@/components/layout/header';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type GoogleAuthData } from '@/contexts/auth-context';

const GoogleIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path d="M1 1h22v22H1z" fill="none"/></svg>;


export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { initiateGoogleLoginOrSignup, isLoading: authIsLoading } = useAuth(); 
  
  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    toast({
        title: `Connecting with Google...`,
        description: "Please wait while we authenticate you.",
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const googleMockData: GoogleAuthData = {
        email: `google.signup${Date.now().toString().slice(-5)}@example.com`,
        firstName: "GoogleUser", 
        lastName: "Candidate",   
        profileImageUrl: `https://picsum.photos/seed/googlesignup${Date.now()}/200/200`,
        googleId: `google-id-signup-${Date.now()}`
    };
    
    await initiateGoogleLoginOrSignup(googleMockData, 'signup');
    setIsSubmitting(false);
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
          <CardDescription>Join CardFeed today with Google. It&apos;s free!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <Button variant="outline" className="w-full" disabled={isSubmitting || authIsLoading} onClick={handleGoogleSignup}>
              {isSubmitting || authIsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
              <span className="ml-2">{isSubmitting || authIsLoading ? 'Processing...' : 'Continue with Google'}</span>
            </Button>
          </div>


          
         
        </CardContent>
      </Card>
    </div>
    </>
  );
}
