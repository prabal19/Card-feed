// src/components/blog/blog-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Post, Comment as CommentType, UserSummary } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User, CalendarDays, Heart, Share2, MessageCircle, Send, XCircle, LinkIcon, Mail, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { likePost, sharePost, addComment } from '@/app/actions/post.actions';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, generateSlug } from '@/lib/utils';

// Mock social icons for dropdown
const TwitterIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.733 4.568 4.69 4.69 0 0 1-2.104.08 4.661 4.661 0 0 0 4.35 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.49 9.49 0 0 0 2.323-2.41z"/></svg>;
const FacebookIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.046C18.343 21.128 22 16.991 22 12z"/></svg>;
const WhatsAppIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.34 3.43 16.84L2.05 22L7.32 20.63C8.75 21.39 10.35 21.81 12.04 21.81C17.5 21.81 21.95 17.36 21.95 11.9C21.95 6.44 17.5 2 12.04 2ZM12.04 20.13C10.56 20.13 9.12 19.75 7.89 19.03L7.53 18.82L4.44 19.65L5.29 16.64L5.06 16.26C4.26 14.94 3.83 13.42 3.83 11.91C3.83 7.39 7.52 3.69 12.04 3.69C16.56 3.69 20.25 7.39 20.25 11.9C20.25 16.41 16.56 20.13 12.04 20.13ZM17.37 14.52C17.13 14.24 16.05 13.68 15.82 13.59C15.58 13.5 15.42 13.46 15.25 13.73C15.08 14 14.66 14.52 14.53 14.69C14.4 14.85 14.27 14.87 14.02 14.78C13.78 14.69 12.93 14.41 11.92 13.54C11.14 12.86 10.64 12.05 10.49 11.81C10.34 11.57 10.45 11.44 10.57 11.32C10.68 11.21 10.82 11.03 10.95 10.88C11.08 10.74 11.12 10.62 11.21 10.45C11.3 10.28 11.25 10.13 11.19 10.02C11.12 9.91 10.66 8.76 10.47 8.31C10.29 7.86 10.11 7.91 9.96 7.91C9.82 7.91 9.66 7.9 9.5 7.9C9.33 7.9 9.08 7.95 8.88 8.22C8.69 8.49 8.13 9.01 8.13 10.13C8.13 11.25 8.91 12.33 9.04 12.49C9.17 12.66 10.65 15.01 12.96 15.92C15.27 16.83 15.27 16.54 15.59 16.5C15.91 16.45 16.92 15.85 17.13 15.28C17.34 14.71 17.34 14.31 17.37 14.52Z"/></svg>;


interface BlogCardProps {
  post: Post;
}

export function BlogCard({ post: initialPost }: BlogCardProps) {
  const { user } = useAuth();
  const [postData, setPostData] = useState<Post>(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

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

    // Optimistic UI update
    const newLikedState = !isLiked;
    const newLikeCount = newLikedState 
      ? (postData.likes || 0) + 1 
      : Math.max(0, (postData.likes || 0) - 1);

    setIsLiked(newLikedState);
    setPostData(prevPost => ({ 
      ...prevPost, 
      likes: newLikeCount,
      // Optimistically update likedBy for immediate UI reflection before server response
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
        setPostData(updatedPost); // Sync with server response
        if (user && updatedPost.likedBy) { // Ensure isLiked reflects server state
            setIsLiked(updatedPost.likedBy.includes(user.id));
        }
      } else {
        // Revert optimistic update on failure
        setIsLiked(!newLikedState); // Revert isLiked
        setPostData(prevPost => ({ // Revert likes and likedBy
          ...prevPost,
          likes: newLikedState ? (prevPost.likes || 1) -1 : (prevPost.likes || 0) + 1,
          likedBy: newLikedState
            ? (prevPost.likedBy || []).filter(id => id !== user.id)
            : [...(prevPost.likedBy || []), user.id]
        }));
        toast({ title: "Failed to update like", variant: "destructive" });
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      setPostData(prevPost => ({
         ...prevPost,
          likes: newLikedState ? (prevPost.likes || 1) -1 : (prevPost.likes || 0) + 1,
          likedBy: newLikedState
            ? (prevPost.likedBy || []).filter(id => id !== user.id)
            : [...(prevPost.likedBy || []), user.id]
      }));
      toast({ title: "Error updating like", description: String(error), variant: "destructive" });
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
         // Attempt to open Messenger app link, fallback to web dialog or copy
        const messengerWindow = window.open(shareUrl, '_blank');
        setTimeout(() => {
            // Heuristic to check if app opened (window might be null or closed quickly)
            if (!messengerWindow || messengerWindow.closed || typeof messengerWindow.closed == 'undefined') {
                 // Fallback for desktop or if app link fails
                 const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID'; // Replace with actual App ID
                 if (fbAppId === 'YOUR_FACEBOOK_APP_ID') {
                     console.warn("Facebook App ID not configured for Messenger share fallback.");
                     toast({ title: "Messenger Share", description: "Configure Facebook App ID or share manually."});
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

  const handleAddComment = async () => {
    if (!user) {
      toast({ title: "Please login to comment", variant: "destructive" });
      return;
    }
    if (!newCommentText.trim()) {
      toast({ title: "Comment cannot be empty", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    
    const authorSummary: UserSummary = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.profileImageUrl || undefined ,
    };

    // Optimistic update
    const optimisticCommentId = `temp-${Date.now()}`;
    const optimisticComment: CommentType = {
      id: optimisticCommentId,
      _id: undefined, // No _id for optimistic client-side comment
      postId: postData.id,
      author: authorSummary,
      text: newCommentText,
      date: new Date().toISOString(),
    };

    setPostData(prevPost => ({
      ...prevPost,
      comments: [...(prevPost.comments || []), optimisticComment],
    }));
    setNewCommentText('');
    setIsCommentModalOpen(false); // Close modal after optimistic update

    try {
      const updatedPost = await addComment({
        postId: postData.id,
        text: optimisticComment.text,
        authorId: user.id, 
        authorName: authorSummary.name,
        authorImageUrl: authorSummary.imageUrl,
      });

      if (updatedPost) {
        setPostData(updatedPost); // Sync with server
      } else {
        // Revert optimistic update on failure
        setPostData(prevPost => ({
           ...prevPost,
           comments: (prevPost.comments || []).filter(c => c.id !== optimisticCommentId)
        }));
        toast({ title: "Failed to add comment", variant: "destructive" });
        setIsCommentModalOpen(true); // Re-open modal on failure if desired
      }
    } catch (error) {
      // Revert optimistic update on error
      setPostData(prevPost => ({
           ...prevPost,
           comments: (prevPost.comments || []).filter(c => c.id !== optimisticCommentId)
      }));
      toast({ title: "Error adding comment", description: String(error), variant: "destructive" });
      setIsCommentModalOpen(true); // Re-open modal on error
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const authorLinkPath = postData.author?.id ? `/profile/${postData.author.id}` : '#';
  const postLinkPath = `/posts/${postData.id}/${generateSlug(postData.title)}`;

  return (
    <>
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card rounded-3xl">
        <CardHeader className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Link href={authorLinkPath} className="cursor-pointer">
                <Avatar className="h-10 w-10">
                <AvatarImage src={postData.author.imageUrl} alt={postData.author.name}  className="object-cover"/>
                <AvatarFallback>{postData.author?.name?.substring(0, 1) || 'A'}</AvatarFallback>
                </Avatar>
            </Link>
            <div>
              <Link href={authorLinkPath} className="text-sm font-semibold text-card-foreground hover:text-primary cursor-pointer">
                {postData.author.name}
              </Link>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                <span>{new Date(postData.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="mb-2 self-start bg-accent/10 text-black border-accent/50">{postData.category.charAt(0).toUpperCase() + postData.category.slice(1)}</Badge>
          <CardTitle className="text-2xl font-bold leading-tight hover:text-primary transition-colors">
            <Link href={postLinkPath}>{postData.title}</Link>
          </CardTitle>
        </CardHeader>
        
        {postData.imageUrl && postData.imageUrl.startsWith('http') && (
          <Link href={postLinkPath} className="block relative w-full h-64 md:h-72">
            <img
              src={postData.imageUrl}
              alt={postData.title}
              className="w-full h-full object-cover px-4 rounded-xl"
              data-ai-hint={postData.title.split(' ').slice(0,2).join(' ')}
            />
          </Link>
        )}
         {postData.imageUrl && postData.imageUrl.startsWith('data:image') && (
          <Link href={postLinkPath} className="block relative px-4 w-full h-64 md:h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={postData.imageUrl}
              alt={postData.title}
              className="w-full h-full object-cover rounded-xl"
              data-ai-hint={postData.title.split(' ').slice(0,2).join(' ')}
            />
          </Link>
        )}
        
        <CardContent className="p-4 flex-grow">
          <CardDescription className="text-md text-muted-foreground line-clamp-4">
            {postData.excerpt}
          </CardDescription>
        </CardContent>
        
        <CardFooter className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={cn(
                "flex items-center text-muted-foreground hover:bg-red-400",
                isLiked && "text-red-500 hover:text-red-600"
              )}
            >
              <Heart className={cn(
                "h-5 w-5 mr-1 group-hover:text-primary",
                isLiked ? "fill-current text-red-500" : "fill-none",
                showHeartAnimation && "animate-heartBeat"
                )}
              />
              {postData.likes || 0}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCommentModalOpen(true)}
              className="text-muted-foreground hover:bg-blue-400"
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              ({postData.comments?.length || 0})
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:bg-green-400"
              >
                <Share2 className="h-5 w-5 mr-1" />
                Share ({postData.shares || 0})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare('copyLink')}>
                <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('email')}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('twitter')}>
                <TwitterIcon /> <span className="ml-2">Twitter</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('facebook')}>
                <FacebookIcon /> <span className="ml-2">Facebook</span>
              </DropdownMenuItem>
               <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                <WhatsAppIcon /> <span className="ml-2">WhatsApp</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('messenger')}>
                 <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.499 1.728 6.595 4.428 8.572V24l3.432-1.895C9.246 22.705 10.59 23 12 23c6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.233 16.865L9.3 13.998l-3.567 2.574L10.03 11.11l3.967-2.865 3.567-2.573L9.267 11.11l-3.967 2.865.005.002z"></path></svg>
                 <span className="ml-1">Messenger</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('instagram')}>
                 <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                 <span className="ml-1">Instagram</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </CardFooter>
      </Card>

      <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add a comment to "{postData.title}"</DialogTitle>
            <DialogDescription>
              Share your thoughts on this post. {user ? `Commenting as ${user.firstName} ${user.lastName}`: "Please login to ensure your comment is saved."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              placeholder="Write your comment here..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmittingComment || !user}
            />
             {(postData.comments?.length || 0) > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2 border p-2 rounded-md">
                <h5 className="text-xs font-semibold text-muted-foreground">Previous Comments:</h5>
                {postData.comments?.slice(-3).map(comment => (
                  <div key={comment.id || comment._id?.toString()} className="text-xs p-1.5 bg-muted/50 rounded">
                     <div className="flex items-center gap-1 mb-0.5">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={comment.author.imageUrl} alt={comment.author.name}  className="object-cover"/>
                            <AvatarFallback className="text-xs">{comment.author.name.substring(0,1)}</AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-xs">{comment.author.name}:</p>
                    </div>
                    <p className="font-normal pl-6">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCommentModalOpen(false)} disabled={isSubmittingComment}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="button" onClick={handleAddComment} disabled={isSubmittingComment || !newCommentText.trim() || !user}>
              <Send className="mr-2 h-4 w-4" /> {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
