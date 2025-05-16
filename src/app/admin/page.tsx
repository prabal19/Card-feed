// src/app/admin/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { useToast } from '@/hooks/use-toast';

export default function AdminEntryPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      toast({
        title: 'Admin Access',
        description: decodeURIComponent(message),
        variant: 'default',
      });
      // Clean the URL
      router.replace('/admin', { scroll: false });
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (!isLoading) {
      if (user && isAdmin) {
        // If user is already logged in and is an admin, redirect to dashboard
        router.replace('/admin/dashboard');
      }
      // If not an admin or not logged in, the AdminLoginForm will be rendered
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <Toaster />
      </div>
    );
  }

  // If user is defined but not an admin, and they somehow landed here (should be rare),
  // they'll see the login form. If they are not logged in, they'll also see the form.
  // The form submission itself will handle auth.
  if (user && isAdmin) {
     // This state should ideally be caught by the useEffect redirecting to dashboard
     return (
       <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to dashboard...</p>
        <Toaster />
      </div>
     );
  }

  return (
    <>
      <AdminLoginForm />
      <Toaster />
    </>
  );
}
