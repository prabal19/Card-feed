
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserCircle, ShieldCheck, AlertTriangle, XOctagon, Share2, Link as LinkIcon, Mail } from 'lucide-react';
import { useForm, type SubmitHandler, Controller, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, UpdateUserProfileInput, Post } from '@/types';
import { updateUserProfile } from '@/app/actions/user.actions';
import { getPostsByAuthorId } from '@/app/actions/post.actions';
import { BlogCard } from '@/components/blog/blog-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const POSTS_PER_SECTION_LIMIT = 4;

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

// Social Icons as inline SVGs
const WebsiteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>
);
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
    <title>X</title>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);
const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
    <title>LinkedIn</title>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 0 1 2.063-2.065 2.064 2.064 0 0 1 2.063 2.065c0 1.14-.925 2.065-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
    <title>GitHub</title>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
      <title>Instagram</title>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.784.297-1.459.717-2.126 1.384S.926 3.356.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.297.784.717 1.459 1.384 2.126.667.666 1.342 1.087 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.784-.297 1.459-.718 2.126-1.384.666-.667 1.087-1.342 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.297-.784-.718-1.459-1.384-2.126C21.313.926 20.644.505 19.86.21c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.06 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.419-.82.679-1.38.896-.423.164-1.06.36-2.23.413-1.26.057-1.64.07-4.85.07s-3.585-.015-4.85-.074c-1.17-.06-1.805-.249-2.227-.413-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.82-1.381-.896-.164-.423-.36-1.06-.413-2.23-.057-1.26-.07-1.64-.07-4.85s.015-3.585.07-4.85c.06-1.17.25-1.805.413-2.227.217-.562.477.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413C8.415 2.175 8.797 2.16 12 2.16zm0 5.48c-3.59 0-6.48 2.89-6.48 6.48s2.89 6.48 6.48 6.48 6.48-2.89 6.48-6.48-2.89-6.48-6.48-6.48zm0 10.8c-2.373 0-4.32-1.947-4.32-4.32s1.947-4.32 4.32-4.32 4.32 1.947 4.32 4.32-1.947 4.32-4.32 4.32zm6.406-11.845c-.796 0-1.44.645-1.44 1.44s.645 1.44 1.44 1.44 1.44-.645 1.44-1.44-.644-1.44-1.44-1.44z" />
  </svg>
);

const socialMediaPlatforms = [
  { key: 'twitter', name: 'Twitter/X', icon: TwitterIcon, placeholder: 'https://x.com/username' },
  { key: 'linkedin', name: 'LinkedIn', icon: LinkedinIcon, placeholder: 'https://linkedin.com/in/username' },
  { key: 'github', name: 'GitHub', icon: GithubIcon, placeholder: 'https://github.com/username' },
  { key: 'instagram', name: 'Instagram', icon: InstagramIcon, placeholder: 'https://instagram.com/username' },
  { key: 'website', name: 'Website', icon: WebsiteIcon, placeholder: 'https://yourwebsite.com' },
] as const;

// Social Icons for Share Menu
const ShareTwitterIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.733 4.568 4.69 4.69 0 0 1-2.104.08 4.661 4.661 0 0 0 4.35 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.49 9.49 0 0 0 2.323-2.41z"/></svg>;
const FacebookIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.046C18.343 21.128 22 16.991 22 12z"/></svg>;
const WhatsAppIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.34 3.43 16.84L2.05 22L7.32 20.63C8.75 21.39 10.35 21.81 12.04 21.81C17.5 21.81 21.95 17.36 21.95 11.9C21.95 6.44 17.5 2 12.04 2ZM12.04 20.13C10.56 20.13 9.12 19.75 7.89 19.03L7.53 18.82L4.44 19.65L5.29 16.64L5.06 16.26C4.26 14.94 3.83 13.42 3.83 11.91C3.83 7.39 7.52 3.69 12.04 3.69C16.56 3.69 20.25 7.39 20.25 11.9C20.25 16.41 16.56 20.13 12.04 20.13ZM17.37 14.52C17.13 14.24 16.05 13.68 15.82 13.59C15.58 13.5 15.42 13.46 15.25 13.73C15.08 14 14.66 14.52 14.53 14.69C14.4 14.85 14.27 14.87 14.02 14.78C13.78 14.69 12.93 14.41 11.92 13.54C11.14 12.86 10.64 12.05 10.49 11.81C10.34 11.57 10.45 11.44 10.57 11.32C10.68 11.21 10.82 11.03 10.95 10.88C11.08 10.74 11.12 10.62 11.21 10.45C11.3 10.28 11.25 10.13 11.19 10.02C11.12 9.91 10.66 8.76 10.47 8.31C10.29 7.86 10.11 7.91 9.96 7.91C9.82 7.91 9.66 7.9 9.5 7.9C9.33 7.9 9.08 7.95 8.88 8.22C8.69 8.49 8.13 9.01 8.13 10.13C8.13 11.25 8.91 12.33 9.04 12.49C9.17 12.66 10.65 15.01 12.96 15.92C15.27 16.83 15.27 16.54 15.59 16.5C15.91 16.45 16.92 15.85 17.13 15.28C17.34 14.71 17.34 14.31 17.37 14.52Z"/></svg>;

interface UserProfileContentProps {
  initialProfileUser: User;
}

export function UserProfileContent({ initialProfileUser }: UserProfileContentProps) {
  const { user: authUser, login: updateAuthUserContext } = useAuth();
  const { toast } = useToast();

  const [profileUser, setProfileUser] = useState<User>(initialProfileUser);
  const [allAuthorPosts, setAllAuthorPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
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

  const isOwnProfile = authUser?.id === profileUser.id;

  // Effect for fetching posts
  useEffect(() => {
    async function fetchUserPosts() {
      setIsLoadingPosts(true);
      try {
        const posts = await getPostsByAuthorId(profileUser.id, isOwnProfile);
        setAllAuthorPosts(posts);
      } catch (error) {
        toast({ title: "Failed to load posts", description: String(error), variant: "destructive" });
        setAllAuthorPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    fetchUserPosts();
  }, [profileUser.id, isOwnProfile, toast]);


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
  }, [profileUser, form]); 


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
        profileImageUrl: data.profileImageUrl || undefined,
        socialLinks: data.socialLinks || {},
    };

    try {
      const updatedUser = await updateUserProfile(profileUser.id, updateData);
      if (updatedUser) {
        setProfileUser(updatedUser); // This will trigger the form reset effect
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

  const handleProfileShare = (platform: string) => {
    if (!profileUser) return;
    const profileUrl = window.location.href;
    const profileName = `${profileUser.firstName} ${profileUser.lastName}`;
    const shareText = `Check out ${profileName}'s profile on CardFeed!`;
    let shareUrl = '';

    switch (platform) {
      case 'copyLink':
        navigator.clipboard.writeText(profileUrl).then(() => toast({ title: "Link Copied!" })).catch(() => toast({ title: "Copy Failed", variant: "destructive" }));
        break;
      case 'email': shareUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(profileUrl)}`; window.open(shareUrl, '_blank'); break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`; window.open(shareUrl, '_blank'); break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`; window.open(shareUrl, '_blank'); break;
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + profileUrl)}`; window.open(shareUrl, '_blank'); break;
      default: return;
    }
  };

  const handleSocialCheckboxChange = (platformKey: 'twitter' | 'linkedin' | 'github' | 'instagram' | 'website', checked: boolean) => {
    setShowSocialInputs(prev => ({ ...prev, [platformKey]: checked }));
    if (!checked) {
      const fieldName: FieldPath<ProfileFormValues> = `socialLinks.${platformKey}`;
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

  const UserInfoCard = () => (
    <Card className="shadow-xl bg-card">
      <CardHeader className="text-center border-b pb-6 relative">
        <div className="absolute top-4 right-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Share2 className="h-5 w-5 text-muted-foreground" />
                        <span className="sr-only">Share Profile</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleProfileShare('copyLink')}><LinkIcon className="mr-2 h-4 w-4" /> Copy Link</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProfileShare('email')}><Mail className="mr-2 h-4 w-4" /> Email</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProfileShare('twitter')}><ShareTwitterIcon /> <span className="ml-2">Twitter</span></DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProfileShare('facebook')}><FacebookIcon /> <span className="ml-2">Facebook</span></DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProfileShare('whatsapp')}><WhatsAppIcon /> <span className="ml-2">WhatsApp</span></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
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

  const canEdit = authUser && authUser.id === profileUser.id;
  const displayableSocialLinks = Object.entries(profileUser.socialLinks || {})
    .filter(([_, value]) => value && value.trim() !== '')
    .map(([key, value]) => {
      const platformInfo = socialMediaPlatforms.find(p => p.key === key);
      return platformInfo ? { ...platformInfo, url: value as string } : null;
    }).filter(Boolean);

  return (
    <>
      {isOwnProfile ? (
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
                {profileUser.firstName} hasn't posted anything publicly yet.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
