// src/components/auth/admin-login-form.tsx
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
import { ShieldAlert, LogIn, Loader2, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react'; 
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';


const adminLoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

interface AdminLoginFormProps {
  onSubmitSuccess?: () => void; 
}

export function AdminLoginForm({ onSubmitSuccess }: AdminLoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { login, isLoading: authIsLoading } = useAuth();


  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onAdminSubmit(values: z.infer<typeof adminLoginSchema>) {
    setIsSubmitting(true);
    try {
      await login({
        email: values.email,
        password: values.password,
        id: 'admin-attempt', 
        firstName: 'Admin', 
        lastName: 'User', 
      });
      // Successful login is handled by AuthContext, which redirects to /admin/dashboard.
      // The AdminLayout will then re-render and show the dashboard content.
      if (onSubmitSuccess) {
        onSubmitSuccess(); // Call if provided, though redirect might happen first.
      }
    } catch (error) {
      toast({
        title: "Admin Login Failed",
        description: error instanceof Error ? error.message : "Invalid admin credentials or error.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
 
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>Please enter your administrator credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAdminSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Your Email"
                        {...field}
                        disabled={isSubmitting || authIsLoading}
                        autoComplete="email"
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
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Your Password"
                        {...field}
                        disabled={isSubmitting || authIsLoading}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading}>
                {isSubmitting || authIsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Login as Admin
                  </>
                )}
              </Button>
            </form>
          </Form>

          
        </CardContent>
      </Card>
    </div>
  );
}
