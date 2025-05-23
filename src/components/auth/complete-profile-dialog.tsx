
// src/components/auth/complete-profile-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GoogleAuthData, CompleteProfileFormData } from '@/contexts/auth-context'; // Uses updated type
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const completeProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  description: z.string().min(10, "Please tell us a bit about yourself (min 10 characters).").max(500, "Description must be 500 characters or less."),
  // profileImageFile is no longer in schema as we pass data URI directly
});

type FormValues = Omit<z.infer<typeof completeProfileSchema>, 'profileImageFile'>; // Schema doesn't include file

interface CompleteProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  googleAuthData: GoogleAuthData;
  onSubmit: (formData: CompleteProfileFormData) => Promise<void>; // onSubmit expects CompleteProfileFormData
}

export function CompleteProfileDialog({ isOpen, onClose, googleAuthData, onSubmit }: CompleteProfileDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string>(''); // For the data URI

  const form = useForm<FormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      description: '',
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        setImageDataUri(dataUri); // Store the data URI
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview( null);
      setImageDataUri('');
    }
  };

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: data.firstName,
        lastName: data.lastName,
        description: data.description,
        profileImageDataUri: imageDataUri, // Pass the data URI
      });
    } catch (error) {
      console.error("Dialog submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      form.reset({ 
        firstName: '',
        lastName: '',
        description: '',
      });
      setImagePreview( null);
      setImageDataUri('');
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
                { googleAuthData.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Input
              id="profileImageFile-complete"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName-complete">First Name</Label>
              <Input id="firstName-complete" {...form.register('firstName')} disabled={isSubmitting} />
              {form.formState.errors.firstName && <p className="text-destructive text-xs mt-1">{form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName-complete">Last Name</Label>
              <Input id="lastName-complete" {...form.register('lastName')} disabled={isSubmitting} />
              {form.formState.errors.lastName && <p className="text-destructive text-xs mt-1">{form.formState.errors.lastName.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="description-complete">About You</Label>
            <Textarea 
              id="description-complete" 
              placeholder="Tell us a bit about yourself..." 
              rows={3} 
              {...form.register('description')} 
              disabled={isSubmitting} 
            />
            {form.formState.errors.description && <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
                Cancel
            </Button>
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
