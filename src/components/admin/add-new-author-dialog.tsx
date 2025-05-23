
// src/components/admin/add-new-author-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserSummary, CreateUserByAdminInput } from '@/types';
import { createUserByAdmin } from '@/app/actions/user.actions';
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
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const newAuthorSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  description: z.string().max(500, "Description can be up to 500 characters.").optional().or(z.literal('')),
  profileImageUrl: z.string().optional().or(z.literal('')), // Will hold data URI
});

type FormValues = z.infer<typeof newAuthorSchema>;

interface AddNewAuthorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorCreated: (author: UserSummary) => void;
}

export function AddNewAuthorDialog({ isOpen, onClose, onAuthorCreated }: AddNewAuthorDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // imageDataUri is already covered by form.watch('profileImageUrl') or form.getValues('profileImageUrl')

  const form = useForm<FormValues>({
    resolver: zodResolver(newAuthorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      description: '',
      profileImageUrl: '',
    },
  });
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset(); 
      setImagePreview(null);
      // No need to reset imageDataUri explicitly as it's part of form state
      onClose();
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Image Too Large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue('profileImageUrl', dataUri, {shouldDirty: true});
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      form.setValue('profileImageUrl', '', {shouldDirty: true});
    }
  };

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const payload: CreateUserByAdminInput = {
        ...data,
        profileImageUrl: data.profileImageUrl, // This is now the data URI from the form state
        role: 'user', 
        // Password field removed, so no password is sent
      };
      
      const newUser = await createUserByAdmin(payload);

      if (newUser) {
        toast({ title: "Author Created", description: `${newUser.firstName} ${newUser.lastName} has been added.` });
        onAuthorCreated({
          id: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          imageUrl: newUser.profileImageUrl,
        });
        form.reset(); // Reset form after successful submission
        setImagePreview(null); // Clear preview
        onClose();
      } else {
        throw new Error("Failed to create author on the server.");
      }
    } catch (error) {
      console.error("Error creating new author:", error);
      toast({ title: "Creation Failed", description: error instanceof Error ? error.message : "Could not create new author.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Author</DialogTitle>
          <DialogDescription>
            Create a new author profile. They will be assigned the 'user' role and will not have a password set initially. Max image size 5MB.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
           <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={imagePreview || undefined} alt="Profile preview" data-ai-hint="profile preview"/>
              <AvatarFallback className="text-2xl">
                {form.watch('firstName')?.charAt(0) || '?'}
                {form.watch('lastName')?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>
            <Label htmlFor="profileImageUpload-new-author" className="cursor-pointer text-xs text-primary hover:underline">
              Upload Profile Picture
            </Label>
            <Input
              id="profileImageUpload-new-author"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
             {form.formState.errors.profileImageUrl && <p className="text-destructive text-xs">{form.formState.errors.profileImageUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="firstName-new-author">First Name</Label>
              <Input id="firstName-new-author" {...form.register('firstName')} disabled={isSubmitting} />
              {form.formState.errors.firstName && <p className="text-destructive text-xs mt-1">{form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName-new-author">Last Name</Label>
              <Input id="lastName-new-author" {...form.register('lastName')} disabled={isSubmitting} />
              {form.formState.errors.lastName && <p className="text-destructive text-xs mt-1">{form.formState.errors.lastName.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="email-new-author">Email</Label>
            <Input id="email-new-author" type="email" {...form.register('email')} disabled={isSubmitting} />
            {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="description-new-author">Description (Optional)</Label>
            <Textarea
              id="description-new-author"
              rows={2}
              placeholder="A brief bio for the author..."
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Author
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
