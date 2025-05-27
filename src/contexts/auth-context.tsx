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
  profileImageUrl: string;
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


  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (user && user.id) {
      const checkBlockedStatus = async () => {
        try {
          const freshUserProfile = await getUserProfile(user.id);
          if (freshUserProfile && freshUserProfile.isBlocked) {
            toast({
              title: "Account Suspended",
              description: "Your account has been suspended by an administrator.",
              variant: "destructive",
              duration: 7000,
            });
            logout(); // This will clear user state and redirect
          }
        } catch (error) {
          console.error("Error checking user blocked status:", error);
          // Don't logout on error, could be temporary network issue
        }
      };

      // Check immediately on login/state hydration
      checkBlockedStatus(); 
      
      // And then check periodically
      intervalId = setInterval(checkBlockedStatus, 60000); // Check every 60 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, toast]); // Rerun when user state changes


  const performLoginSteps = (loggedInUser: User) => {
    // Clear dialog state first to prevent flashing if this is called after dialog interaction
    setCompleteProfileDialogOpen(false);
    setGoogleAuthDataForDialog(null);

    let finalUser = { ...loggedInUser };
    if (finalUser.description === undefined) {
      finalUser.description = "";
    }
    finalUser.authProvider = finalUser.authProvider || (finalUser.googleId ? 'google' : 'email');

    if (finalUser.isBlocked) { // Double check if somehow a blocked user reached here
      toast({ title: "Login Failed", description: "Your account has been suspended.", variant: "destructive"});
      sessionStorage.removeItem('cardfeed_user');
      setUser(null);
      setIsAdmin(false);
      router.push('/'); 
      setIsLoading(false); // Ensure loading is false
      return;
    }
    
    let welcomeMessage = `Welcome, ${finalUser.firstName}!`;
     if (user && user.isBlocked === true && finalUser.isBlocked === false) {
        welcomeMessage = "Your account has been reactivated. Welcome back!";
    }


    setUser(finalUser);
    sessionStorage.setItem('cardfeed_user', JSON.stringify(finalUser));

    const isAdminUser = finalUser.role === 'admin';
    setIsAdmin(isAdminUser);

    toast({ title: "Login Successful", description: welcomeMessage});
    
    if (isAdminUser) {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
    setIsLoading(false); // Set loading false after all state and navigation
  }


 const login = async (loginData: AdminLoginData | User) => {
    setIsLoading(true);
    setCompleteProfileDialogOpen(false);
    setGoogleAuthDataForDialog(null);
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
      else if ('id' in loginData && !('password' in loginData)) { // Regular user login (e.g., after Google auth)
         const userToLogin = loginData as User;
         if (userToLogin.isBlocked) { // Double check block status before final login steps
            toast({ title: "Login Failed", description: "Your account has been suspended.", variant: "destructive"});
            setIsLoading(false);
            router.push('/');
            return;
         }
         userToLogin.authProvider = userToLogin.googleId ? 'google' : (userToLogin.authProvider || 'email');
         performLoginSteps(userToLogin);
         return;
      }
      throw new Error("Invalid login data provided.");

    } catch (error) {
       console.error("Login error:", error);
       setIsLoading(false);
       throw error; // Rethrow for AdminLoginForm to catch and display specific admin login error
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
  setCompleteProfileDialogOpen(false); // Ensure dialog state is cleared on logout
  setGoogleAuthDataForDialog(null);
  toast({ title: "Logged Out", description: "You have been successfully logged out." });
  router.push('/');
};

  const initiateGoogleLoginOrSignup = async (googleData: GoogleAuthData, intent: 'login' | 'signup') => {
    setIsLoading(true);
    setCompleteProfileDialogOpen(false); // Proactively clear dialog state
    setGoogleAuthDataForDialog(null); 
    try {
      const existingUser = await getUserProfile(googleData.email);

      if (existingUser) {
        if (existingUser.isBlocked) {
          toast({ title: "Login Failed", description: "Your account has been suspended.", variant: "destructive" });
          setIsLoading(false);
           router.push('/'); 
          return; 
        }

        await login(existingUser); // login itself calls performLoginSteps
        if (intent === 'signup') {
          toast({ title: "Account Exists", description: "Logged you in with your existing Google account." });
        }
      } else {
        // User does not exist
        if (intent === 'login') {
          toast({ title: "Account Not Found", description: "No account found with this Google email. Please sign up first.", variant: "destructive" });
          setIsLoading(false);
        } else { // intent === 'signup' and user is new
          setGoogleAuthDataForDialog(googleData);
          setCompleteProfileDialogOpen(true);
          setIsLoading(false); // Allow dialog to render
        }
      }
    } catch (error) {
      console.error(`Google ${intent} error:`, error);
      toast({ title: `Google ${intent} Failed`, description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive"});
      setIsLoading(false);
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
            googleAuthData: googleAuthDataForDialog, // Pass the original googleData
            profileFormData: formData, // Pass the form data including new profileImageDataUri

        });

        if (userFromDb) {
            if (userFromDb.isBlocked) { // Should ideally not happen if Google flow checks first, but good safeguard
                toast({ title: "Account Creation Problem", description: "Your account has been created but is suspended. Please contact support.", variant: "destructive"});
                setCompleteProfileDialogOpen(false);
                setGoogleAuthDataForDialog(null);
                setIsLoading(false);
                router.push('/');
                return;
            }
            userFromDb.authProvider = 'google'; 
            await login(userFromDb);
        } else {
            throw new Error("Failed to finalize Google user profile.");
        }
    } catch (error) {
        console.error("Error completing Google profile:", error);
        toast({ title: "Profile Setup Failed", description: error instanceof Error ? error.message : "Could not save profile details.", variant: "destructive"});
        setCompleteProfileDialogOpen(false); // Close dialog on error
        setGoogleAuthDataForDialog(null);
        setIsLoading(false); 
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout, initiateGoogleLoginOrSignup }}>
      {children}
      {isCompleteProfileDialogOpen && googleAuthDataForDialog && (
        <CompleteProfileDialog
          isOpen={isCompleteProfileDialogOpen}
          onClose={() => {
            setCompleteProfileDialogOpen(false);
            setGoogleAuthDataForDialog(null);
            if (isLoading && !user) setIsLoading(false);
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
