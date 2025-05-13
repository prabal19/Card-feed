// src/contexts/auth-context.tsx
'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, getUserProfile, findOrCreateUserFromGoogle } from '@/app/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { CompleteProfileDialog } from '@/components/auth/complete-profile-dialog'; // Import the new dialog

// Define a type for the data expected by the signup function (email/password)
interface EmailSignupData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  description: string;
}

// Data from Google (mock or real)
export interface GoogleAuthData {
  email: string;
  firstName?: string; // Google might provide this
  lastName?: string;  // Google might provide this
  profileImageUrl?: string; // Google might provide this
  googleId?: string; // Important for linking account
}

// Data collected from the CompleteProfileDialog
export interface CompleteProfileFormData {
  firstName: string;
  lastName: string;
  description: string;
  profileImageFile?: File; // For new image upload
}


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void; // Final login step
  logout: () => void;
  signupWithEmail: (signupData: EmailSignupData) => Promise<User | null>; 
  initiateGoogleLoginOrSignup: (googleData: GoogleAuthData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isCompleteProfileDialogOpen, setCompleteProfileDialogOpen] = useState(false);
  const [googleAuthDataForDialog, setGoogleAuthDataForDialog] = useState<GoogleAuthData | null>(null);

  useEffect(() => {
    const storedUserJson = sessionStorage.getItem('cardfeed_user');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        setUser(storedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        sessionStorage.removeItem('cardfeed_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (loggedInUser: User) => {
    // This is the final step of login, after user data is confirmed/created in DB
    setIsLoading(true);
    try {
      let finalUser = { ...loggedInUser };
      if (!finalUser.profileImageUrl) {
        finalUser.profileImageUrl = `https://picsum.photos/seed/${finalUser.id}/200/200`;
      }
      if (finalUser.description === undefined) {
        finalUser.description = ""; 
      }

      setUser(finalUser);
      sessionStorage.setItem('cardfeed_user', JSON.stringify(finalUser));
      toast({ title: "Login Successful", description: `Welcome, ${finalUser.firstName}!`});
      router.push('/');
      setCompleteProfileDialogOpen(false); // Ensure dialog is closed
      setGoogleAuthDataForDialog(null); // Clear temp data
    } catch (error) {
       console.error("Final login step error:", error);
       toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('cardfeed_user');
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
    router.push('/login');
  };

  const signupWithEmail = async (signupData: EmailSignupData): Promise<User | null> => {
    setIsLoading(true);
    try {
      const newUserPayload: Omit<User, '_id' | 'id'> & { id?: string, password?: string } = {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        password: signupData.password, // The action should handle this securely
        profileImageUrl: `https://picsum.photos/seed/${signupData.email}/200/200`,
        description: signupData.description,
      };

      const createdUser = await createUser(newUserPayload); // createUser needs to handle password if direct signup

      if (createdUser) {
        return createdUser;
      } else {
        throw new Error("User creation failed in action.");
      }
    } catch (error) {
        console.error("Email signup error:", error);
        throw error; 
    } finally {
        setIsLoading(false);
    }
  };

  const initiateGoogleLoginOrSignup = (googleData: GoogleAuthData) => {
    // This function is called after (mock) Google auth.
    // It will open the CompleteProfileDialog.
    // The dialog will then handle DB interaction and final login.
    setGoogleAuthDataForDialog(googleData);
    setCompleteProfileDialogOpen(true);
  };

  const handleCompleteProfileSubmit = async (formData: CompleteProfileFormData) => {
    if (!googleAuthDataForDialog) {
        toast({ title: "Error", description: "Google authentication data is missing.", variant: "destructive"});
        setCompleteProfileDialogOpen(false);
        return;
    }
    setIsLoading(true);
    try {
        const userFromDb = await findOrCreateUserFromGoogle({
            googleAuthData: googleAuthDataForDialog,
            profileFormData: formData,
        });

        if (userFromDb) {
            login(userFromDb); // Finalize login with the complete user data
        } else {
            throw new Error("Failed to finalize Google user profile.");
        }
    } catch (error) {
        console.error("Error completing Google profile:", error);
        toast({ title: "Profile Setup Failed", description: error instanceof Error ? error.message : "Could not save profile details.", variant: "destructive"});
        // Keep dialog open for user to retry or close manually
    } finally {
        setIsLoading(false);
        // Don't close dialog here on error, let user decide.
    }
  };


  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signupWithEmail, initiateGoogleLoginOrSignup }}>
      {children}
      {googleAuthDataForDialog && (
        <CompleteProfileDialog
          isOpen={isCompleteProfileDialogOpen}
          onClose={() => {
            setCompleteProfileDialogOpen(false);
            setGoogleAuthDataForDialog(null);
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

