// src/app/admin/layout.tsx
'use client';

import React, { type ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation'; // Removed usePathname as it's not directly needed for this logic now
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { AdminLoginForm } from '@/components/auth/admin-login-form'; // Import the login form

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user && !isAdmin) {
        // If user is logged in but NOT an admin, redirect to homepage
        router.replace('/?message=Not%20authorized%20for%20admin%20area');
      }
      // If !user, the AdminLoginForm will be rendered by the return statement below.
      // No explicit redirect to /admin/dashboard needed here for unauthenticated users,
      // as the login form will appear on any admin route they try to access.
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading, and user is not logged in (user is null), show AdminLoginForm.
  // The AdminLoginForm itself will handle the login process. AuthContext.login()
  // will redirect to /admin/dashboard upon successful admin login.
  if (!user) {
    return (
        <>
            <AdminLoginForm /> 
            <Toaster />
        </>
    );
  }

  // If user is logged in but not an admin, they would have been redirected by useEffect.
  // If execution reaches here, it means user is logged in. If they are not admin,
  // the useEffect will redirect. So, if we are here and user is defined,
  // we only proceed if they are also admin.
  if (user && isAdmin) {
    return (
      <div className="flex min-h-screen bg-muted/40">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
        <Toaster />
      </div>
    );
  }

  // Fallback for any other state, e.g., user exists but isAdmin is false (though covered by useEffect)
  // This state should ideally not be reached if useEffect logic is correct.
  // Showing a loader or a generic message might be suitable here.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-2">Verifying access...</p>
    </div>
  );
}
