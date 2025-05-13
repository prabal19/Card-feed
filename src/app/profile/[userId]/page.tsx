'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserCircle } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, UpdateUserProfileInput, Post } from '@/types';
import { getUserProfile, updateUserProfile } from '@/app/actions/user.actions'; 
import { getPostsByAuthorId } from '@/app/actions/post.actions';
import { BlogCard } from '@/components/blog/blog-card';
import { Separator } from '@/components/ui/separator';
import { AppFooter } from '@/components/layout/footer';

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  description: z.string().max(500, "Description must be 500 characters or less.").optional().or(z.literal('')),
  profileImageUrl: z.string().url("Invalid URL for profile image.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser, login: updateAuthUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      description: '',
      profileImageUrl: '',
    },
  });

  useEffect(() => {
    async function fetchProfileData() {
      if (!userId) {
        setIsLoadingProfile(false);
        setIsLoadingPosts(false);
        return;
      }
      setIsLoadingProfile(true);
      setIsLoadingPosts(true); 
      try {
        const fetchedUser = await getUserProfile(userId as string);
        if (fetchedUser) {
          setProfileUser(fetchedUser);
          form.reset({
            firstName: fetchedUser.firstName,
            lastName: fetchedUser.lastName,  
            description: fetchedUser.description || '',
            profileImageUrl: fetchedUser.profileImageUrl || '',
          });
          if (fetchedUser.profileImageUrl) {
            setImagePreview(fetchedUser.profileImageUrl);
          }

          const posts = await getPostsByAuthorId(userId as string);
          setAuthorPosts(posts);
          setIsLoadingPosts(false);

        } else {
          setProfileUser(null); 
          setIsLoadingPosts(false);
          toast({ title: "Profile Not Found", description: "The user profile could not be loaded.", variant: "destructive" });
          // router.push('/'); // Optionally redirect if profile not found
        }
      } catch (error) {
        toast({ title: "Failed to load profile data", description: String(error), variant: "destructive" });
        setProfileUser(null); 
        setIsLoadingPosts(false);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    if (!authLoading) { 
        fetchProfileData();
    }
  }, [userId, form, toast, router, authLoading]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        form.setValue('profileImageUrl', reader.result as string, { shouldValidate: true }); 
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!profileUser || !authUser || authUser.id !== profileUser.id) {
        toast({ title: "Unauthorized", description: "You can only edit your own profile.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    const updateData: UpdateUserProfileInput = {
        firstName: data.firstName, 
        lastName: data.lastName,
        description: data.description,
    };
    
    if (selectedImageFile) {
        // Simulate image upload. In a real app, this would be an API call.
        await new Promise(res => setTimeout(res, 500)); 
        // Use a placeholder URL or a URL from a real storage service
        updateData.profileImageUrl = `https://picsum.photos/seed/${authUser.id}-${Date.now()}/200/200`; 
        setImagePreview(updateData.profileImageUrl); 
    } else if (data.profileImageUrl && data.profileImageUrl !== profileUser.profileImageUrl) {
        // If a new URL is provided directly (e.g., typed in)
        updateData.profileImageUrl = data.profileImageUrl;
    } else if (!data.profileImageUrl && profileUser.profileImageUrl) {
        // If profileImageUrl is cleared in form
        updateData.profileImageUrl = ""; 
    }


    try {
      const updatedUser = await updateUserProfile(profileUser.id, updateData);
      if (updatedUser) {
        setProfileUser(updatedUser);
        if (authUser.id === updatedUser.id) { 
            updateAuthUser(updatedUser); // Update auth context user as well
        }
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        form.reset({ 
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            description: updatedUser.description || '',
            profileImageUrl: updatedUser.profileImageUrl || '',
        });
        if (updatedUser.profileImageUrl) setImagePreview(updatedUser.profileImageUrl);
        else setImagePreview(null);
        setSelectedImageFile(null); // Clear selected file after successful upload
      } else {
        toast({ title: "Update Failed", description: "Could not update profile.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error Updating Profile", description: String(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8 text-center">
          <UserCircle className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold">Profile Not Found</h1>
          <p className="text-muted-foreground">The user profile you are looking for does not exist or could not be loaded.</p>
          <Button asChild className="mt-6">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </main>
        <AppFooter />
      </div>
    );
  }
  
  const canEdit = authUser && authUser.id === profileUser.id;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-3xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
            <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-primary shadow-lg">
              <AvatarImage src={imagePreview || profileUser.profileImageUrl || `https://picsum.photos/seed/${profileUser.id}/200/200`} alt={`${profileUser.firstName} ${profileUser.lastName}`} data-ai-hint="user profile large"/>
              <AvatarFallback className="text-4xl">{profileUser.firstName?.charAt(0)}{profileUser.lastName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold text-primary">{profileUser.firstName} {profileUser.lastName}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 text-card-foreground">
            {canEdit ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-image-upload">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="profile-image-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="flex-grow"
                      disabled={isSubmitting}
                    />
                  </div>
                  {form.formState.errors.profileImageUrl && <p className="text-destructive text-sm mt-1">{form.formState.errors.profileImageUrl.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...form.register('firstName')} disabled={isSubmitting} />
                        {form.formState.errors.firstName && <p className="text-destructive text-sm mt-1">{form.formState.errors.firstName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...form.register('lastName')} disabled={isSubmitting} />
                        {form.formState.errors.lastName && <p className="text-destructive text-sm mt-1">{form.formState.errors.lastName.message}</p>}
                    </div>
                </div>
                
                <div>
                    <Label htmlFor="description">About You (Bio)</Label>
                    <Textarea
                        id="description"
                        placeholder="Tell us a bit about yourself..."
                        rows={4}
                        {...form.register('description')}
                        disabled={isSubmitting}
                    />
                    {form.formState.errors.description && <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isDirty}>
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
              </form>
            ) : (
              // Read-only view for visitors
              <div className="pt-4">
                {profileUser.description ? (
                  <>
                    <h3 className="text-lg font-semibold text-primary mb-2">About {profileUser.firstName}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profileUser.description}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">This user has not provided a description yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-10" />

        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-primary mb-6 text-center">
              Posts by {profileUser.firstName} {profileUser.lastName}
            </h2>
            {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : authorPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {authorPosts.map(post => (
                        <BlogCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">
                    {profileUser.firstName} hasn&apos;t posted anything yet.
                </p>
            )}
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
