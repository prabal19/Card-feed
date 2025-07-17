// src/components/blog/blog-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, CalendarDays, Heart, Share2, MessageCircle, LinkIcon, Mail, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { likePost, sharePost } from '@/app/actions/post.actions';
import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, generateSlug, formatDateAgo, formatNumber } from '@/lib/utils';

// Mock social icons for dropdown
const TwitterIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.733 4.568 4.69 4.69 0 0 1-2.104.08 4.661 4.661 0 0 0 4.35 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.49 9.49 0 0 0 2.323-2.41z"/></svg>;
const FacebookIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.046C18.343 21.128 22 16.991 22 12z"/></svg>;
const WhatsAppIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.34 3.43 16.84L2.05 22L7.32 20.63C8.75 21.39 10.35 21.81 12.04 21.81C17.5 21.81 21.95 17.36 21.95 11.9C21.95 6.44 17.5 2 12.04 2ZM12.04 20.13C10.56 20.13 9.12 19.75 7.89 19.03L7.53 18.82L4.44 19.65L5.29 16.64L5.06 16.26C4.26 14.94 3.83 13.42 3.83 11.91C3.83 7.39 7.52 3.69 12.04 3.69C16.56 3.69 20.25 7.39 20.25 11.9C20.25 16.41 16.56 20.13 12.04 20.13ZM17.37 14.52C17.13 14.24 16.05 13.68 15.82 13.59C15.58 13.5 15.42 13.46 15.25 13.73C15.08 14 14.66 14.52 14.53 14.69C14.4 14.85 14.27 14.87 14.02 14.78C13.78 14.69 12.93 14.41 11.92 13.54C11.14 12.86 10.64 12.05 10.49 11.81C10.34 11.57 10.45 11.44 10.57 11.32C10.68 11.21 10.82 11.03 10.95 10.88C11.08 10.74 11.12 10.62 11.21 10.45C11.3 10.28 11.25 10.13 11.19 10.02C11.12 9.91 10.66 8.76 10.47 8.31C10.29 7.86 10.11 7.91 9.96 7.91C9.82 7.91 9.66 7.9 9.5 7.9C9.33 7.9 9.08 7.95 8.88 8.22C8.69 8.49 8.13 9.01 8.13 10.13C8.13 11.25 8.91 12.33 9.04 12.49C9.17 12.66 10.65 15.01 12.96 15.92C15.27 16.83 15.27 16.54 15.59 16.5C15.91 16.45 16.92 15.85 17.13 15.28C17.34 14.71 17.34 14.31 17.37 14.52Z"/></svg>;


interface BlogCardProps {
  post: Post;
  showEditButton?: boolean;
}

export function BlogCard({ post: initialPost, showEditButton = false }: BlogCardProps) {
  const { user } = useAuth();
  const [postData, setPostData] = useState<Post>(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    setPostData(initialPost);
    if (user && initialPost.likedBy) {
      setIsLiked(initialPost.likedBy.includes(user.id));
    } else {
      setIsLiked(false);
    }
  }, [initialPost, user]);

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please login to like posts", variant: "destructive" });
      return;
    }

    const newLikedState = !isLiked;
    const newLikeCount = newLikedState 
      ? (postData.likes || 0) + 1 
      : Math.max(0, (postData.likes || 0) - 1);

    setIsLiked(newLikedState);
    setPostData(prevPost => ({ 
      ...prevPost, 
      likes: newLikeCount,
      likedBy: newLikedState 
        ? [...(prevPost.likedBy || []), user.id]
        : (prevPost.likedBy || []).filter(id => id !== user.id)
    }));
    
    if (newLikedState) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 300);
    }

    try {
      const updatedPost = await likePost(postData.id, user.id);
      if (updatedPost) {
        setPostData(updatedPost); 
        if (user && updatedPost.likedBy) { 
            setIsLiked(updatedPost.likedBy.includes(user.id));
        }
      } else {
        throw new Error("Failed to update like on server");
      }
    } catch (error) {
      setIsLiked(!newLikedState); 
      setPostData(prevPost => ({ 
        ...prevPost,
        likes: newLikedState ? (prevPost.likes || 1) -1 : (prevPost.likes || 0) + 1,
        likedBy: newLikedState
          ? (prevPost.likedBy || []).filter(id => id !== user.id)
          : [...(prevPost.likedBy || []), user.id]
      }));
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      if (errorMessage.toLowerCase().includes("blocked")) {
        toast({ title: "Action Failed", description: "Your account has been suspended.", variant: "destructive" });
      } else {
        toast({ title: "Error updating like", description: errorMessage, variant: "destructive" });
      }
    }
  };

  const handleShare = async (platform: string) => {
    const postUrl = `${window.location.origin}/posts/${postData.id}/${generateSlug(postData.title)}`; 
    const postTitle = postData.title;
    let shareUrl = '';

    switch (platform) {
      case 'copyLink':
        navigator.clipboard.writeText(postUrl)
          .then(() => toast({ title: "Link Copied!", description: "Post link copied to clipboard." }))
          .catch(() => toast({ title: "Copy Failed", description: "Could not copy link.", variant: "destructive" }));
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(postTitle)}&body=${encodeURIComponent(postUrl)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(postTitle + " " + postUrl)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'messenger': 
        shareUrl = `fb-messenger://share?link=${encodeURIComponent(postUrl)}`;
        const messengerWindow = window.open(shareUrl, '_blank');
        setTimeout(() => {
            if (!messengerWindow || messengerWindow.closed || typeof messengerWindow.closed == 'undefined') {
                 const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID'; 
                 if (fbAppId === 'YOUR_FACEBOOK_APP_ID') {
                     console.warn("Facebook App ID not configured for Messenger share fallback.");
                     toast({ title: "Messenger Share", description: "Share to Instagram manually via mobile app. Link copied to clipboard for convenience."});
                     return;
                 }
                 shareUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(postUrl)}&app_id=${fbAppId}&redirect_uri=${encodeURIComponent(window.location.href)}`;
                 window.open(shareUrl, '_blank');
            }
        }, 500);
        break;
      case 'instagram':
        console.log("Instagram share (typically done via mobile app):", postUrl);
        toast({ title: "Instagram Share", description: "Share to Instagram manually via mobile app. Link copied to clipboard for convenience." });
        navigator.clipboard.writeText(postUrl);
        break;
      default:
        return;
    }

    if (platform !== 'copyLink') { 
      try {
        const updatedPost = await sharePost(postData.id);
        if (updatedPost) {
          setPostData(updatedPost);
        }
      } catch (error) {
        console.error("Error updating share count", error);
      }
    }
  };
  
  if (!postData.author) {
    return null; // Or a skeleton/error component
  }
  
  const authorLinkPath = postData.author.id ? `/profile/${postData.author.id}` : '#';
  const postLinkPath = `/posts/${postData.id}/${generateSlug(postData.title)}`;
  const commentsLinkPath = `${postLinkPath}#comments-section`;

  return (
    <article className="bg-card border-none hover:border-accent transition-colors p-4 group hover:bg-accent">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Link href={authorLinkPath} className="cursor-pointer">
          <Avatar className="h-5 w-5">
            <AvatarImage src={postData.author.imageUrl} alt={postData.author.name} className="object-cover"/>
            <AvatarFallback>{postData.author.name?.substring(0, 1) || 'A'}</AvatarFallback>
          </Avatar>
        </Link>
        <Link href={authorLinkPath} className="font-bold text-foreground hover:underline">
          {postData.author.name}
        </Link>
        <span>•</span>
        <span>{formatDateAgo(postData.date)}</span>
      </div>

      <Link href={postLinkPath} className="block space-y-2">
        <h2 className="text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
          {postData.title}
        </h2>
        {postData.imageUrl && (
          <div className="relative w-full max-h-[500px] overflow-hidden mt-2">
            <Image
              src={postData.imageUrl}
              alt={postData.title}
              width={800}
              height={500}
              className="w-full h-auto object-cover"
              data-ai-hint={postData.title.split(' ').slice(0,2).join(' ')}
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3 pt-2">
          {postData.excerpt}
        </p>
      </Link>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-full">
            <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            className={cn(
                "flex items-center text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full",
                isLiked && "text-red-500 hover:text-red-500"
            )}
            >
            <Heart className={cn("h-5 w-5 mr-1", isLiked && "fill-current", showHeartAnimation && "animate-heartBeat")} />
            {formatNumber(postData.likes || 0)}
            </Button>
            <Button 
            asChild
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full"
            >
            <Link href={commentsLinkPath}>
                <MessageCircle className="h-5 w-5 mr-1" />
                 {formatNumber(postData.comments?.length || 0)}
            </Link>
            </Button>
        </div>
        
        <div className="flex items-center gap-1">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full"
                >
                <Share2 className="h-5 w-5 mr-1" />
                Share
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShare('copyLink')}><LinkIcon className="mr-2 h-4 w-4" /> Copy Link</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('email')}><Mail className="mr-2 h-4 w-4" /> Email</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('twitter')}><TwitterIcon /> <span className="ml-2">Twitter</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('facebook')}><FacebookIcon /> <span className="ml-2">Facebook</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}><WhatsAppIcon /> <span className="ml-2">WhatsApp</span></DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            {showEditButton && user && user.id === postData.author.id && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full">
                <Link href={`/create-post?editPostId=${postData.id}`}>
                <Edit className="mr-1.5 h-4 w-4" />
                Edit
                </Link>
            </Button>
            )}
        </div>
      </div>
    </article>
  );
}