// src/components/admin/add-new-author-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserSummary } from '@/types';
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
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const newAuthorSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(newAuthorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset(); // Reset form when dialog is closed
      onClose();
    }
  };

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // For simplicity, we'll auto-generate a simple password or use a default
      // In a real scenario, you might email the user a setup link
      const tempPassword = `Pass${Math.random().toString(36).slice(-8)}`;
      
      const newUser = await createUserByAdmin({
        ...data,
        role: 'user', // New authors created this way are 'user' role
        password: tempPassword, // Provide a temporary or default password
        description: 'Newly added author for CardFeed.', // Default description
      });

      if (newUser) {
        toast({ title: "Author Created", description: `${newUser.firstName} ${newUser.lastName} has been added.` });
        onAuthorCreated({
          id: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          imageUrl: newUser.profileImageUrl,
        });
        form.reset();
        onClose(); // Close dialog on success
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
            Create a new author profile. They will be assigned the 'user' role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
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
          <div>
            <Label htmlFor="email-new-author">Email</Label>
            <Input id="email-new-author" type="email" {...form.register('email')} disabled={isSubmitting} />
            {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
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
