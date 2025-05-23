'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, findOrCreateUserFromGoogle, verifyAdminCredentials } from '@/app/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { CompleteProfileDialog } from '@/components/auth/complete-profile-dialog';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged,signOut } from 'firebase/auth';

function isProfileComplete(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.firstName && user.lastName && user.profileImageUrl);
}

export interface GoogleAuthData {
  email: string;
  googleId?: string; // Firebase UID (optional, for linking)
}


export interface CompleteProfileFormData {
  firstName: string;
  lastName: string;
  description: string;
  profileImageDataUri: string;
}
interface CreateUserInput extends CompleteProfileFormData {
  email: string;
  googleId?: string;
  authProvider: 'google';
}

interface AdminLoginData {
  email: string;
  password?: string; 
  id: string; 
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (loginData: AdminLoginData | User) => Promise<void>;
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

  // ✅ Always run this — even if sessionStorage has a user
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser?.email) {
      try {
        const existingUser = await getUserProfile(firebaseUser.email);
        if (existingUser) {
          await login(existingUser);
        } else {
          console.warn('No user profile found for Firebase user');
        }
      } catch (err) {
        console.error('Failed to auto-login with Firebase:', err);
      }
    } else {
      // ✅ No Firebase user — clear app state
      setUser(null);
      setIsAdmin(false);
      sessionStorage.removeItem('cardfeed_user');
    }
    setIsLoading(false);
  });

  return () => unsubscribe(); // Cleanup on unmount
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
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
    
    setCompleteProfileDialogOpen(false); 
    setGoogleAuthDataForDialog(null); 
  }

  const login = async (loginData: AdminLoginData | User) => {
    setIsLoading(true);
    try {
      if ('password' in loginData && loginData.email && loginData.password) {
        // Secure admin verification now on server
        const adminUser = await verifyAdminCredentials(loginData.email, loginData.password);
        if (adminUser) {
          adminUser.role = 'admin'; 
          adminUser.authProvider = 'email';
          performLoginSteps(adminUser);
          return;
        } else {
          throw new Error("Invalid admin email or password.");
        }
      }
      else if ('id' in loginData && !('password' in loginData)) {
        const userToLogin = loginData as User;
        performLoginSteps(loginData as User);
        userToLogin.authProvider = userToLogin.googleId ? 'google' : (userToLogin.authProvider || 'email');
        return;
      }
      throw new Error("Invalid login data provided.");

    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
  try {
    await signOut(auth); // 🔥 signs the user out from Firebase
  } catch (error) {
    console.error('Firebase sign-out error:', error);
  }

  setUser(null);
  setIsAdmin(false);
  sessionStorage.removeItem('cardfeed_user');
  toast({ title: "Logged Out", description: "You have been successfully logged out." });
  router.push('/');
};

 const initiateGoogleLoginOrSignup = async (googleData: GoogleAuthData, intent: 'login' | 'signup') => {
  setIsLoading(true);
  try {
    const existingUser = await getUserProfile(googleData.email);

    if (intent === 'login') {
      if (existingUser) {
        await login(existingUser);
      } else {
        toast({
          title: "Account Not Found",
          description: "No account found with this Google email. Please sign up first.",
          variant: "destructive"
        });
      }
    } else if (intent === 'signup') {
      if (existingUser) {
        if (isProfileComplete(existingUser)) {
          await login(existingUser);
          toast({ title: "Account Exists", description: "Logged you in with your existing Google account." });
        } else {
          // Existing but incomplete profile — show popup
          setGoogleAuthDataForDialog(googleData);
          setCompleteProfileDialogOpen(true);
          return;
        }
      } else {
        // New user — show complete profile dialog
        setGoogleAuthDataForDialog(googleData);
        setCompleteProfileDialogOpen(true);
        return;
      }
    }
  } catch (error) {
    console.error(`Google ${intent} error:`, error);
    toast({
      title: `Google ${intent} Failed`,
      description: error instanceof Error ? error.message : "An unexpected error occurred.",
      variant: "destructive"
    });
  } finally {
    if (!isCompleteProfileDialogOpen) {
      setIsLoading(false);
    }
  }
};

 const handleCompleteProfileSubmit = async (formData: CompleteProfileFormData) => {
    if (!googleAuthDataForDialog) {
        toast({ title: "Error", description: "Google authentication data is missing.", variant: "destructive"});
        setCompleteProfileDialogOpen(false);
        setGoogleAuthDataForDialog(null);
        setIsLoading(false);
        return;
    }
    // isLoading is already true from initiateGoogleLoginOrSignup
    try {
        const userFromDb = await findOrCreateUserFromGoogle({
            googleAuthData: {
                ...googleAuthDataForDialog,
                
            },
            profileFormData: { 
                firstName: formData.firstName,
                lastName: formData.lastName,
                description: formData.description,
                profileImageDataUri: formData.profileImageDataUri || '',
            },
        });

        if (userFromDb) {
            userFromDb.authProvider = 'google';
            await login(userFromDb); // login will set isLoading to false
        } else {
            throw new Error("Failed to finalize Google user profile.");
        }
    } catch (error) {
        console.error("Error completing Google profile:", error);
        toast({ title: "Profile Setup Failed", description: error instanceof Error ? error.message : "Could not save profile details.", variant: "destructive"});
        setIsLoading(false); // Set loading false if submission fails before login
        setCompleteProfileDialogOpen(false); // Close dialog on error
        setGoogleAuthDataForDialog(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout, initiateGoogleLoginOrSignup }}>
      {children}
      {googleAuthDataForDialog && (
        <CompleteProfileDialog
          isOpen={isCompleteProfileDialogOpen}
          onClose={() => {
            setCompleteProfileDialogOpen(false);
            setGoogleAuthDataForDialog(null);
            setIsLoading(false);
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
