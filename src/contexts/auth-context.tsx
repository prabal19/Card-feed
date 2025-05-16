// src/contexts/auth-context.tsx
'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, getUserProfile, findOrCreateUserFromGoogle } from '@/app/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { CompleteProfileDialog } from '@/components/auth/complete-profile-dialog';

export interface GoogleAuthData {
  email: string;
  firstName?: string; 
  lastName?: string;  
  profileImageUrl?: string; 
  googleId?: string; 
}

export interface CompleteProfileFormData {
  firstName: string;
  lastName: string;
  description: string;
  profileImageFile?: File; 
}

// This interface is primarily for the admin email/password login flow
interface AdminLoginData {
  email: string;
  password?: string; 
  // These are less relevant for admin but part of the broader User type structure for login function
  id: string; 
  firstName: string;
  lastName: string;
}


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (loginData: AdminLoginData | User) => Promise<void>; // Accepts AdminLoginData or a User object
  logout: () => void;
  initiateGoogleLoginOrSignup: (googleData: GoogleAuthData, intent: 'login' | 'signup') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [isCompleteProfileDialogOpen, setCompleteProfileDialogOpen] = useState(false);
  const [googleAuthDataForDialog, setGoogleAuthDataForDialog] = useState<GoogleAuthData | null>(null);

  useEffect(() => {
    const storedUserJson = sessionStorage.getItem('cardfeed_user');
    if (storedUserJson) {
      try {
        const storedUser: User = JSON.parse(storedUserJson);
        setUser(storedUser);
        if (storedUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || storedUser.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        sessionStorage.removeItem('cardfeed_user');
      }
    }
    setIsLoading(false);
  }, []);

  const performLoginSteps = (loggedInUser: User) => {
    let finalUser = { ...loggedInUser };
    if (!finalUser.profileImageUrl) {
      finalUser.profileImageUrl = `https://picsum.photos/seed/${finalUser.id}/200/200`;
    }
    if (finalUser.description === undefined) {
      finalUser.description = ""; 
    }

    setUser(finalUser);
    sessionStorage.setItem('cardfeed_user', JSON.stringify(finalUser));
    
    const isAdminUser = finalUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || finalUser.role === 'admin';
    setIsAdmin(isAdminUser);

    toast({ title: "Login Successful", description: `Welcome back, ${finalUser.firstName}!`});
    
    if (isAdminUser) {
      router.push('/admin/dashboard'); // Admin goes to admin dashboard
    } else {
      router.push('/'); // Regular user goes to homepage
    }
    
    setCompleteProfileDialogOpen(false); 
    setGoogleAuthDataForDialog(null); 
  }

  const login = async (loginData: AdminLoginData | User) => {
    setIsLoading(true);
    try {
      // Admin email/password attempt
      if ('password' in loginData && loginData.email && loginData.password) { 
        if (loginData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && loginData.password === process.env.ADMIN_PASSWORD) {
          let adminUser = await getUserProfile(loginData.email);
          if (!adminUser) {
            console.warn("Admin user not found in DB, attempting to create/seed.");
            adminUser = await createUser({
              id: 'admin-user-001', // Consistent ID for admin
              email: process.env.NEXT_PUBLIC_ADMIN_EMAIL!,
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
              description: 'CardFeed Administrator',
              profileImageUrl: 'https://picsum.photos/seed/adminuser/200/200'
            });
            if (!adminUser) throw new Error("Failed to create admin user during login.");
          }
          // Ensure role is admin, even if fetched from DB where it might not be set by older seeders
          adminUser.role = 'admin'; 
          performLoginSteps(adminUser);
          return;
        } else {
          throw new Error("Invalid admin email or password.");
        }
      }
      // Google login attempt (User object provided)
      else if ('id' in loginData && !('password' in loginData)) { 
         performLoginSteps(loginData as User);
         return;
      }
      throw new Error("Invalid login data provided.");

    } catch (error) {
       console.error("Login error:", error);
       // Do not set isLoading to false here if error is thrown, let finally handle it
       throw error; // Re-throw for the calling component to handle (e.g., AdminLoginForm)
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    sessionStorage.removeItem('cardfeed_user');
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
    router.push('/'); // Redirect to homepage after logout for all users
  };

  const initiateGoogleLoginOrSignup = async (googleData: GoogleAuthData, intent: 'login' | 'signup') => {
    setIsLoading(true);
    try {
      const existingUser = await getUserProfile(googleData.email);

      if (intent === 'login') {
        if (existingUser) {
          await login(existingUser); 
        } else {
          toast({ title: "Account Not Found", description: "No account found with this Google email. Please sign up first.", variant: "destructive" });
          // No automatic redirect to signup, user must click the signup button/link
        }
      } else if (intent === 'signup') {
        if (existingUser) {
          // User tried to "Sign up with Google" but already has an account
          await login(existingUser); 
          toast({ title: "Account Exists", description: "Logged you in with your existing Google account." });
        } else {
          // New user via Google signup, proceed to complete profile dialog
          setGoogleAuthDataForDialog(googleData);
          setCompleteProfileDialogOpen(true);
          // setIsLoading(false) will be handled by the dialog flow or if it closes
          return; // Return early as dialog will take over
        }
      }
    } catch (error) {
      console.error(`Google ${intent} error:`, error);
      toast({ title: `Google ${intent} Failed`, description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive"});
    } finally {
      // Only set isLoading to false if not opening dialog, dialog flow will handle it
      if (!isCompleteProfileDialogOpen) {
        setIsLoading(false);
      }
    }
  };

  const handleCompleteProfileSubmit = async (formData: CompleteProfileFormData) => {
    if (!googleAuthDataForDialog) {
        toast({ title: "Error", description: "Google authentication data is missing.", variant: "destructive"});
        setCompleteProfileDialogOpen(false);
        setIsLoading(false);
        return;
    }
    setIsLoading(true); // Ensure loading state during profile finalization
    try {
        const userFromDb = await findOrCreateUserFromGoogle({
            googleAuthData: googleAuthDataForDialog,
            profileFormData: formData,
        });

        if (userFromDb) {
            await login(userFromDb); // This will set user, session, isAdmin and redirect
            // performLoginSteps is called inside login()
        } else {
            throw new Error("Failed to finalize Google user profile.");
        }
    } catch (error) {
        console.error("Error completing Google profile:", error);
        toast({ title: "Profile Setup Failed", description: error instanceof Error ? error.message : "Could not save profile details.", variant: "destructive"});
        // If profile setup fails, keep dialog open for retry or user can cancel
    } finally {
        // isLoading will be set to false by the login function's finally block or if dialog remains open
        // If dialog is still open due to error, don't set isLoading false here, let user retry or cancel.
        // If login was successful, it would have already set isLoading to false.
    }
  };


  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout, initiateGoogleLoginOrSignup }}>
      {children}
      {googleAuthDataForDialog && (
        <CompleteProfileDialog
          isOpen={isCompleteProfileDialogOpen}
          onClose={() => { // This onClose is critical for when dialog is closed by user (e.g. Esc, overlay click)
            setCompleteProfileDialogOpen(false);
            setGoogleAuthDataForDialog(null);
            setIsLoading(false); // Ensure loading is false if dialog is dismissed without submission
          }}
          googleAuthData={googleAuthDataForDialog}
          onSubmit={handleCompleteProfileSubmit}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
