// src/components/auth/complete-profile-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GoogleAuthData, CompleteProfileFormData } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const completeProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  description: z.string().min(10, "Please tell us a bit about yourself (min 10 characters).").max(500, "Description must be 500 characters or less."),
  profileImageFile: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof completeProfileSchema>;

interface CompleteProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  googleAuthData: GoogleAuthData;
  onSubmit: (formData: CompleteProfileFormData) => Promise<void>;
}

export function CompleteProfileDialog({ isOpen, onClose, googleAuthData, onSubmit }: CompleteProfileDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(googleAuthData.profileImageUrl || null);

  const form = useForm<FormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      firstName: googleAuthData.firstName || '',
      lastName: googleAuthData.lastName || '',
      description: '',
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('profileImageFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue('profileImageFile', undefined);
      setImagePreview(googleAuthData.profileImageUrl || null); // Revert to Google image or null if file removed
    }
  };

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: data.firstName,
        lastName: data.lastName,
        description: data.description,
        profileImageFile: data.profileImageFile,
      });
      // onSubmit should handle closing the dialog on success
    } catch (error) {
      // Error handling is done by the onSubmit in AuthContext which calls this
      console.error("Dialog submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // When dialog is closed externally (e.g. clicking outside, pressing Esc)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      form.reset({ // Reset form to initial Google data or empty
        firstName: googleAuthData.firstName || '',
        lastName: googleAuthData.lastName || '',
        description: '',
        profileImageFile: undefined,
      });
      setImagePreview(googleAuthData.profileImageUrl || null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Welcome! Please provide a few more details to set up your CardFeed account. Your email is {googleAuthData.email}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24 mb-2">
              <AvatarImage src={imagePreview || undefined} alt="Profile preview" data-ai-hint="profile preview"/>
              <AvatarFallback className="text-3xl">
                {googleAuthData.firstName?.charAt(0) || googleAuthData.email?.charAt(0).toUpperCase()}
                {googleAuthData.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Input
              id="profileImageFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
              disabled={isSubmitting}
            />
             {form.formState.errors.profileImageFile && <p className="text-destructive text-xs">{form.formState.errors.profileImageFile.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...form.register('firstName')} disabled={isSubmitting} />
              {form.formState.errors.firstName && <p className="text-destructive text-xs mt-1">{form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...form.register('lastName')} disabled={isSubmitting} />
              {form.formState.errors.lastName && <p className="text-destructive text-xs mt-1">{form.formState.errors.lastName.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">About You</Label>
            <Textarea 
              id="description" 
              placeholder="Tell us a bit about yourself..." 
              rows={3} 
              {...form.register('description')} 
              disabled={isSubmitting} 
            />
            {form.formState.errors.description && <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit & Login'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
