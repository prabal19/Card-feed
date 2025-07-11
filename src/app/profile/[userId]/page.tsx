
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserCircle, ShieldCheck, AlertTriangle, XOctagon, Twitter, Linkedin, Github, Instagram, Link2 as WebsiteIcon} from 'lucide-react';
import { useForm, type SubmitHandler, Controller, FieldPath  } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, UpdateUserProfileInput, Post } from '@/types';
import { getUserProfile, updateUserProfile } from '@/app/actions/user.actions'; 
import { getPostsByAuthorId } from '@/app/actions/post.actions';
import { BlogCard } from '@/components/blog/blog-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const POSTS_PER_SECTION_LIMIT = 2; // Number of posts to show initially per status section

const socialLinkPlatformSchema = z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal(''));

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  description: z.string().max(500, "Description must be 500 characters or less.").optional().or(z.literal('')),
  profileImageUrl: z.string().optional().or(z.literal('')),
  socialLinks: z.object({
    twitter: socialLinkPlatformSchema,
    linkedin: socialLinkPlatformSchema,
    github: socialLinkPlatformSchema,
    instagram: socialLinkPlatformSchema,
    website: socialLinkPlatformSchema,
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const socialMediaPlatforms = [
  { key: 'twitter', name: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username' },
  { key: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
  { key: 'github', name: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
  { key: 'instagram', name: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'website', name: 'Website', icon: WebsiteIcon, placeholder: 'https://yourwebsite.com' },
] as const; 

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser, login: updateAuthUserContext, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [allAuthorPosts, setAllAuthorPosts] = useState<Post[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true); // Separate loading state for posts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [showAllAccepted, setShowAllAccepted] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllRejected, setShowAllRejected] = useState(false);
    const [showSocialInputs, setShowSocialInputs] = useState<Record<string, boolean>>({});

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',  
      description: '',
      profileImageUrl: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        github: '',
        instagram: '',
        website: '',
      },
    },
  });

  const isOwnProfile = authUser?.id === userId;

  useEffect(() => {
    async function fetchProfileData() {
      if (!userId) {
        setIsLoadingProfile(false);
        return;
      }
      setIsLoadingProfile(true);
      try {
        const fetchedUser = await getUserProfile(userId as string);
        setProfileUser(fetchedUser);
        if (!fetchedUser) {
          toast({ title: "Profile Not Found", description: "The user profile could not be loaded.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Failed to load profile", description: String(error), variant: "destructive" });
        setProfileUser(null);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    if (!authLoading) {
      fetchProfileData();
    }
  }, [userId, authLoading, toast]);

  // Effect for fetching posts
  useEffect(() => {
    async function fetchUserPosts() {
      if (!userId) {
        setIsLoadingPosts(false);
        return;
      }
      setIsLoadingPosts(true);
      try {
        const posts = await getPostsByAuthorId(userId as string, isOwnProfile);
        setAllAuthorPosts(posts);
      } catch (error) {
        toast({ title: "Failed to load posts", description: String(error), variant: "destructive" });
        setAllAuthorPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    // Fetch posts when userId changes or when isOwnProfile status changes (to refetch with correct visibility)
    if (userId) {
        fetchUserPosts();
    }
  }, [userId, isOwnProfile, toast]);


  // Effect for resetting form when profileUser data is available or changes
  useEffect(() => {
    if (profileUser) {
      const currentSocialLinks = profileUser.socialLinks || {};
      form.reset({
        firstName: profileUser.firstName,
        lastName: profileUser.lastName,
        description: profileUser.description || '',
        profileImageUrl: profileUser.profileImageUrl || '',
        socialLinks: {
          twitter: currentSocialLinks.twitter || '',
          linkedin: currentSocialLinks.linkedin || '',
          github: currentSocialLinks.github || '',
          instagram: currentSocialLinks.instagram || '',
          website: currentSocialLinks.website || '',
        }
      });
      setImagePreview(profileUser.profileImageUrl || null);
      
      const initialShowInputs: Record<string, boolean> = {};
      socialMediaPlatforms.forEach(platform => {
        if (currentSocialLinks[platform.key as keyof User['socialLinks']]) {
          initialShowInputs[platform.key] = true;
        }
      });
      setShowSocialInputs(initialShowInputs);
    }
  }, [profileUser, form]); // form.reset is stable


  const acceptedPosts = useMemo(() => allAuthorPosts.filter(post => post.status === 'accepted'), [allAuthorPosts]);
  const pendingPosts = useMemo(() => allAuthorPosts.filter(post => post.status === 'pending'), [allAuthorPosts]);
  const rejectedPosts = useMemo(() => allAuthorPosts.filter(post => post.status === 'rejected'), [allAuthorPosts]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Image Too Large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          variant: "destructive",
        });
        event.target.value = ''; 
        // Revert preview to original if file is too large
        setImagePreview(profileUser?.profileImageUrl || null);
        form.setValue('profileImageUrl', profileUser?.profileImageUrl || '', { shouldValidate: true, shouldDirty: true });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue('profileImageUrl', dataUri, { shouldValidate: true, shouldDirty: true }); 
      };
      reader.readAsDataURL(file);
    } else {
        setImagePreview(profileUser?.profileImageUrl || null);
        form.setValue('profileImageUrl', profileUser?.profileImageUrl || '', { shouldValidate: true, shouldDirty: true });
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
        profileImageUrl: data.profileImageUrl || undefined ,
        socialLinks: data.socialLinks || {},
    };
    
    try {
      const updatedUser = await updateUserProfile(profileUser.id, updateData);
      if (updatedUser) {
        setProfileUser(updatedUser);
        if (authUser.id === updatedUser.id) { 
            updateAuthUserContext(updatedUser); 
        }
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      } else {
        toast({ title: "Update Failed", description: "Could not update profile.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error Updating Profile", description: String(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialCheckboxChange = (platformKey: 'twitter' | 'linkedin' | 'github' | 'instagram' | 'website', checked: boolean) => {
    setShowSocialInputs(prev => ({ ...prev, [platformKey]: checked }));
    if (!checked) {
      const fieldName = `socialLinks.${platformKey}` as FieldPath<ProfileFormValues>;
      form.setValue(
        fieldName,
        '',
        { shouldDirty: true, shouldValidate: true }
      );
    }
  };

  const renderPostSection = (
    posts: Post[], 
    title: string, 
    showAll: boolean, 
    setShowAllFn: (show: boolean) => void, 
    emptyMessage: string,
    statusIcon?: React.ReactNode
  ) => {
    const displayedPosts = showAll ? posts : posts.slice(0, POSTS_PER_SECTION_LIMIT);
    return (
      <section className="w-full">
        <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          {statusIcon} {title} ({posts.length})
        </h3>
        {displayedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedPosts.map(post => (
              <BlogCard key={post.id} post={post} showEditButton={isOwnProfile} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>
        )}
        {posts.length > POSTS_PER_SECTION_LIMIT && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setShowAllFn(!showAll)}>
              {showAll ? 'Show Less' : 'View All'}
            </Button>
          </div>
        )}
      </section>
    );
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
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
      </div>
    );
  }
  
  const canEdit = authUser && authUser.id === profileUser.id;
    const displayableSocialLinks = Object.entries(profileUser.socialLinks || {})
    .filter(([_, value]) => value && value.trim() !== '')
    .map(([key, value]) => {
      const platformInfo = socialMediaPlatforms.find(p => p.key === key);
      return platformInfo ? { ...platformInfo, url: value as string} : null;
    }).filter(Boolean);

 const UserInfoCard = () => (
    <Card className="shadow-xl bg-card">
      <CardHeader className="text-center border-b pb-6">
        <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-primary shadow-lg object-cover">
          <AvatarImage src={imagePreview || undefined} alt={`${profileUser.firstName} ${profileUser.lastName}`} className="object-cover"/>
          <AvatarFallback className="text-4xl">{profileUser.firstName?.charAt(0)}{profileUser.lastName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl font-bold text-primary">{profileUser.firstName} {profileUser.lastName}</CardTitle>
          {profileUser.isBlocked && <Badge variant="destructive" className="mt-2">This user is blocked</Badge>}
        {displayableSocialLinks.length > 0 && (
          <div className="flex justify-center gap-3 mt-3">
            {displayableSocialLinks.map(link => (
              link && <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer" title={link.name} className="text-muted-foreground hover:text-primary">
                <link.icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        )}

      </CardHeader>
      <CardContent className="p-6 md:p-8 text-card-foreground">
        {canEdit ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profile-image-upload">Profile Picture</Label>
              <Input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-grow"
                disabled={isSubmitting}
              />
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
                      
            <div>
              <Label className="text-base font-semibold">Social Links</Label>
              <p className="text-xs text-muted-foreground mb-3">Add links to your social media profiles or website.</p>
              <div className="space-y-4">
                {socialMediaPlatforms.map((platform) => (
                  <div key={platform.key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`checkbox-${platform.key}`}
                        checked={showSocialInputs[platform.key] || false}
                        onCheckedChange={(checked) => handleSocialCheckboxChange(platform.key, !!checked)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`checkbox-${platform.key}`} className="flex items-center gap-2 cursor-pointer">
                        <platform.icon className="h-5 w-5" /> {platform.name}
                      </Label>
                    </div>
                    {showSocialInputs[platform.key] && (
                      <>
                        <Controller
                          name={`socialLinks.${platform.key}`}
                          control={form.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="url"
                              placeholder={platform.placeholder}
                              disabled={isSubmitting}
                              className="transition-all duration-300 ease-in-out"
                            />
                          )}
                        />
                        {form.formState.errors.socialLinks?.[platform.key] && (
                          <p className="text-destructive text-xs mt-1">
                            {form.formState.errors.socialLinks[platform.key]?.message}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
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
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        {isOwnProfile ? (
          // Two-column layout for own profile
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="w-full">
              <UserInfoCard />
            </div>
            <div className="w-full">
              <h2 className="text-2xl font-bold text-primary mb-6 text-center md:text-left">Your Posts</h2>
              <Tabs defaultValue="accepted" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="accepted">Accepted ({acceptedPosts.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingPosts.length})</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected ({rejectedPosts.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="accepted">
                  {renderPostSection(
                    acceptedPosts,
                    "Accepted Posts",
                    showAllAccepted,
                    setShowAllAccepted,
                    "You have no accepted posts yet.",
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  )}
                </TabsContent>
                <TabsContent value="pending">
                  {renderPostSection(
                    pendingPosts,
                    "Pending Review",
                    showAllPending,
                    setShowAllPending,
                    "You have no posts pending review.",
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </TabsContent>
                <TabsContent value="rejected">
                  {renderPostSection(
                    rejectedPosts,
                    "Rejected Posts",
                    showAllRejected,
                    setShowAllRejected,
                    "You have no rejected posts.",
                    <XOctagon className="h-5 w-5 text-red-500" />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          // Single-column, centered layout for other users' profiles
          <div className="max-w-3xl mx-auto space-y-8">
            <UserInfoCard />
            <section className="w-full">
              <h2 className="text-2xl font-bold text-primary mb-6 text-center">
                Posts by {profileUser.firstName} {profileUser.lastName}
              </h2>
              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : acceptedPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {acceptedPosts.map(post => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {profileUser.firstName} hasn&apos;t posted anything publicly yet.
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

