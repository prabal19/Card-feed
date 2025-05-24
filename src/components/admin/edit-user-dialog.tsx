
// src/components/admin/edit-user-dialog.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, UpdateUserByAdminInput } from '@/types';
import { updateUserByAdmin } from '@/app/actions/user.actions';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  description: z.string().max(500, "Description must be 500 characters or less.").optional().or(z.literal('')),
  profileImageUrl: z.string().optional().or(z.literal('')), // Will hold data URI or existing URL
  role: z.enum(['user', 'admin']),
  isBlocked: z.boolean(),
});

type FormValues = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

export function EditUserDialog({ user, isOpen, onClose, onUserUpdated }: EditUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      description: '',
      profileImageUrl: '',
      role: 'user',
      isBlocked: false,
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        description: user.description || '',
        profileImageUrl: user.profileImageUrl || '', // Original URL/DataURI
        role: user.role || 'user',
        isBlocked: user.isBlocked || false,
      });
      setImagePreview(user.profileImageUrl || null); // Set initial preview
    } else if (!isOpen) {
        form.reset({ // Reset on close
            firstName: '', lastName: '', email: '', description: '',
            profileImageUrl: '', role: 'user', isBlocked: false,
        });
        setImagePreview(null);
    }
  }, [user, form, isOpen]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Image Too Large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          variant: "destructive",
        });
        event.target.value = ''; 
        // Revert to original if oversized
        setImagePreview(user?.profileImageUrl || null);
        form.setValue('profileImageUrl', user?.profileImageUrl || '', {shouldValidate: true, shouldDirty: true });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri); // Update preview
        form.setValue('profileImageUrl', dataUri, { shouldValidate: true, shouldDirty: true }); // Set form value to data URI
      };
      reader.readAsDataURL(file);
    } else {
      // If selection is cancelled, revert to original
      setImagePreview(user?.profileImageUrl || null);
      form.setValue('profileImageUrl', user?.profileImageUrl || '', {shouldValidate: true, shouldDirty: true });
    }
  };

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!user || !user._id) {
        toast({title: "Error", description:"User data is missing for update.", variant: "destructive"});
        return;
    }
    
    if (data.isBlocked && user.role === 'admin' && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        const checkSelfBlock = confirm("Are you sure you want to block the main admin account? This could lock you out.");
        if (!checkSelfBlock) return;
    }
     if (user.role === 'admin' && data.role === 'user' && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        const checkRoleChange = confirm("Are you sure you want to change the main admin's role to user? This could lock you out of admin functions.");
        if (!checkRoleChange) return;
    }

    setIsSubmitting(true);
    try {
      // data.profileImageUrl now contains the data URI if a new image was uploaded, or the original URL/data URI
      const updatePayload: UpdateUserByAdminInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        description: data.description,
        role: data.role,
        isBlocked: data.isBlocked,
        profileImageUrl: data.profileImageUrl, 
      };
      
      console.log("[EditUserDialog] Payload being sent to updateUserByAdmin:", updatePayload);

      const updatedUser = await updateUserByAdmin(user._id, updatePayload);
      if (updatedUser) {
        toast({ title: "User Updated", description: `${updatedUser.firstName} ${updatedUser.lastName}'s profile has been updated.` });
        onUserUpdated(updatedUser);
        onClose(); // Close dialog on success
      } else {
        throw new Error("Failed to update user on the server.");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({ title: "Update Failed", description: error instanceof Error ? error.message : "Could not update user profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDialogClose = () => {
    onClose(); 
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User: {form.watch('firstName') || user.firstName} {form.watch('lastName') || user.lastName}</DialogTitle>
          <DialogDescription>
            Modify the details for this user. Click save when you're done. Max image size 5MB.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24 mb-2">
              <AvatarImage src={imagePreview || `https://placehold.co/200x200.png?text=${user.firstName?.charAt(0) || 'U'}${user.lastName?.charAt(0) || ''}`} alt="Profile preview" data-ai-hint="profile preview" className="object-cover"/>
              <AvatarFallback className="text-3xl">{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <Label htmlFor="profileImageFile-edit" className="text-sm font-medium">Change Profile Picture</Label>
            <Input
              id="profileImageFile-edit"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
              disabled={isSubmitting}
            />
            {form.formState.errors.profileImageUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.profileImageUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName-edit">First Name</Label>
              <Input id="firstName-edit" {...form.register('firstName')} disabled={isSubmitting} />
              {form.formState.errors.firstName && <p className="text-destructive text-xs mt-1">{form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName-edit">Last Name</Label>
              <Input id="lastName-edit" {...form.register('lastName')} disabled={isSubmitting} />
              {form.formState.errors.lastName && <p className="text-destructive text-xs mt-1">{form.formState.errors.lastName.message}</p>}
            </div>
          </div>
           <div>
              <Label htmlFor="email-edit">Email</Label>
              <Input id="email-edit" type="email" {...form.register('email')} disabled={isSubmitting} />
              {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
            </div>
          <div>
            <Label htmlFor="description-edit">Description</Label>
            <Textarea id="description-edit" rows={3} {...form.register('description')} disabled={isSubmitting} />
            {form.formState.errors.description && <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
                <Label htmlFor="role-edit">Role</Label>
                <Select 
                    value={form.watch('role')} 
                    onValueChange={(value) => form.setValue('role', value as 'user' | 'admin', {shouldValidate: true, shouldDirty: true})} 
                    disabled={isSubmitting}
                >
                    <SelectTrigger id="role-edit">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                 {form.formState.errors.role && <p className="text-destructive text-xs mt-1">{form.formState.errors.role.message}</p>}
            </div>
             <div className="flex flex-col space-y-2 pt-2">
                <Label htmlFor="isBlocked-edit" className="flex items-center">
                    User Blocked
                    <Switch
                        id="isBlocked-edit"
                        checked={form.watch('isBlocked')}
                        onCheckedChange={(checked) => form.setValue('isBlocked', checked, {shouldValidate: true, shouldDirty: true})}
                        className="ml-3"
                        disabled={isSubmitting}
                    />
                </Label>
                 {form.formState.errors.isBlocked && <p className="text-destructive text-xs">{form.formState.errors.isBlocked.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleDialogClose}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
