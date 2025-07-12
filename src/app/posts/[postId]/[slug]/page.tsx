
// src/app/posts/[postId]/[slug]/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { TrendingSidebar } from '@/components/blog/trending-sidebar';
import { TopAuthorsSidebar } from '@/components/blog/top-authors-sidebar';
import { ResourcesSidebar } from '@/components/blog/resources-sidebar';
import { PopularCategories } from '@/components/blog/popular-categories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Heart, Share2, MessageCircle, Send, User as UserIcon, Loader2, LinkIcon, Mail, Image as ImageIcon, CornerDownRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import type { Post, Comment as CommentType, UserSummary, TopAuthor } from '@/types';
import { getPostById, getPosts, likePost, sharePost, addComment, likeComment, getCategoriesWithCounts } from '@/app/actions/post.actions';
import { getTopAuthors } from '@/app/actions/user.actions';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn, generateSlug } from '@/lib/utils';
import { categories as staticCategories } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TwitterIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.733 4.568 4.69 4.69 0 0 1-2.104.08 4.661 4.661 0 0 0 4.35 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.49 9.49 0 0 0 2.323-2.41z"/></svg>;
const FacebookIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.046C18.343 21.128 22 16.991 22 12z"/></svg>;
const WhatsAppIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.34 3.43 16.84L2.05 22L7.32 20.63C8.75 21.39 10.35 21.81 12.04 21.81C17.5 21.81 21.95 17.36 21.95 11.9C21.95 6.44 17.5 2 12.04 2ZM12.04 20.13C10.56 20.13 9.12 19.75 7.89 19.03L7.53 18.82L4.44 19.65L5.29 16.64L5.06 16.26C4.26 14.94 3.83 13.42 3.83 11.91C3.83 7.39 7.52 3.69 12.04 3.69C16.56 3.69 20.25 7.39 20.25 11.9C20.25 16.41 16.56 20.13 12.04 20.13ZM17.37 14.52C17.13 14.24 16.05 13.68 15.82 13.59C15.58 13.5 15.42 13.46 15.25 13.73C15.08 14 14.66 14.52 14.53 14.69C14.4 14.85 14.27 14.87 14.02 14.78C13.78 14.69 12.93 14.41 11.92 13.54C11.14 12.86 10.64 12.05 10.49 11.81C10.34 11.57 10.45 11.44 10.57 11.32C10.68 11.21 10.82 11.03 10.95 10.88C11.08 10.74 11.12 10.62 11.21 10.45C11.3 10.28 11.25 10.13 11.19 10.02C11.12 9.91 10.66 8.76 10.47 8.31C10.29 7.86 10.11 7.91 9.96 7.91C9.82 7.91 9.66 7.9 9.5 7.9C9.33 7.9 9.08 7.95 8.88 8.22C8.69 8.49 8.13 9.01 8.13 10.13C8.13 11.25 8.91 12.33 9.04 12.49C9.17 12.66 10.65 15.01 12.96 15.92C15.27 16.83 15.27 16.54 15.59 16.5C15.91 16.45 16.92 15.85 17.13 15.28C17.34 14.71 17.34 14.31 17.37 14.52Z"/></svg>;

const COMMENTS_INITIAL_LIMIT = 5;
const REPLIES_INITIAL_LIMIT = 2;


function PostContent() {
  const params = useParams<{ postId: string; slug: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const [isPostLikedByCurrentUser, setIsPostLikedByCurrentUser] = useState(false);
  const [showPostLikeAnimation, setShowPostLikeAnimation] = useState(false);

  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [visibleCommentsCount, setVisibleCommentsCount] = useState(COMMENTS_INITIAL_LIMIT);
  const [expandedRepliesMap, setExpandedRepliesMap] = useState<Record<string, boolean>>({});
  const [visibleRepliesCountMap, setVisibleRepliesCountMap] = useState<Record<string, number>>({});


  useEffect(() => {
    async function fetchData() {
      if (!params.postId) return;
      setIsLoadingPage(true);
      try {
        const fetchedPost = await getPostById(params.postId);

        if (fetchedPost) {
          // Redirect if slug is incorrect for SEO
          const correctSlug = generateSlug(fetchedPost.title);
          if (params.slug !== correctSlug) {
            router.replace(`/posts/${fetchedPost.id}/${correctSlug}`);
          }

          setPost(fetchedPost);
          if (user && fetchedPost.likedBy) {
            setIsPostLikedByCurrentUser(fetchedPost.likedBy.includes(user.id));
          }
        } else {
          toast({ title: "Post not found", variant: "destructive" });
          router.push('/');
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
        toast({ title: "Failed to load post", description: String(error), variant: "destructive" });
      } finally {
        setIsLoadingPage(false);
      }
    }
    fetchData();
  }, [params.postId, params.slug, user, router, toast]);


  const handlePostLike = async () => {
    if (!user || !post) {
      toast({ title: "Please login to like posts", variant: "destructive" });
      return;
    }
    const newLikedState = !isPostLikedByCurrentUser;
    const currentLikes = post.likes || 0;
    const newLikeCount = newLikedState ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    setIsPostLikedByCurrentUser(newLikedState);
    setPost(p => p ? { ...p, likes: newLikeCount } : null);
    if (newLikedState) {
      setShowPostLikeAnimation(true);
      setTimeout(() => setShowPostLikeAnimation(false), 300);
    }

    try {
      const updatedPost = await likePost(post.id, user.id);
      if (updatedPost) {
        setPost(updatedPost); 
        if (user && updatedPost.likedBy) setIsPostLikedByCurrentUser(updatedPost.likedBy.includes(user.id));
      } else throw new Error("Failed to update like on server");
    } catch (error) {
      setIsPostLikedByCurrentUser(!newLikedState);
      setPost(p => p ? { ...p, likes: currentLikes } : null);
      toast({ title: "Error updating like", description: String(error), variant: "destructive" });
    }
  };

  const handleShare = async (platform: string) => {
    if (!post) return;
    const postUrl = `${window.location.origin}/posts/${post.id}/${generateSlug(post.title)}`;
    const postTitle = post.title;
    let shareUrl = '';

    switch (platform) {
      case 'copyLink':
        navigator.clipboard.writeText(postUrl).then(() => toast({ title: "Link Copied!" })).catch(() => toast({ title: "Copy Failed", variant: "destructive" }));
        break;
      case 'email': shareUrl = `mailto:?subject=${encodeURIComponent(postTitle)}&body=${encodeURIComponent(postUrl)}`; window.open(shareUrl, '_blank'); break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`; window.open(shareUrl, '_blank'); break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`; window.open(shareUrl, '_blank'); break;
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(postTitle + " " + postUrl)}`; window.open(shareUrl, '_blank'); break;
      default: return;
    }

    if (platform !== 'copyLink') {
      try {
        const updatedPost = await sharePost(post.id);
        if (updatedPost) setPost(updatedPost);
      } catch (error) { console.error("Error updating share count", error); }
    }
  };

  const handleAddCommentOrReply = async (text: string, parentId?: string) => {
    if (!user || !post) {
      toast({ title: "Please login to comment", variant: "destructive" });
      return;
    }
    if (!text.trim()) {
      toast({ title: "Comment cannot be empty", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    const authorSummary: UserSummary = { id: user.id, name: `${user.firstName} ${user.lastName}`, imageUrl: user.profileImageUrl || undefined };

    try {
      const updatedPost = await addComment({ postId: post.id, text, authorId: user.id, authorName: authorSummary.name, authorImageUrl: authorSummary.imageUrl, parentId });
      if (updatedPost) {
        setPost(updatedPost);
        if (parentId) {
          setReplyToCommentId(null); 
          setReplyText('');
        } else {
          setNewCommentText('');
        }
      } else throw new Error("Failed to add comment/reply on server");
    } catch (error) {
      toast({ title: "Error adding comment/reply", description: String(error), variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const handleCommentLike = async (commentId: string) => {
    if (!user || !post) {
        toast({ title: "Please login to like comments", variant: "destructive" });
        return;
    }
    
    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;

    const comment = post.comments[commentIndex];
    const isCurrentlyLiked = comment.likedBy?.includes(user.id) || false;
    const currentLikes = comment.likes || 0;
    const newLikes = isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1;

    setPost(prevPost => {
        if (!prevPost) return null;
        const updatedComments = prevPost.comments.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    likes: newLikes,
                    likedBy: isCurrentlyLiked
                        ? (c.likedBy || []).filter(id => id !== user.id)
                        : [...(c.likedBy || []), user.id],
                };
            }
            return c;
        });
        return { ...prevPost, comments: updatedComments };
    });


    try {
        const updatedPostFromServer = await likeComment(post.id, commentId, user.id);
        if (updatedPostFromServer) {
            setPost(updatedPostFromServer);
        } else {
            throw new Error("Failed to update comment like on server.");
        }
    } catch (error) {
         setPost(prevPost => {
            if (!prevPost) return null;
            const commentToRevert = post.comments.find(c => c.id === commentId); // Find original comment state before optimistic update
            if (!commentToRevert) return prevPost; // Should not happen

            const revertedComments = prevPost.comments.map(c => {
                if (c.id === commentId) {
                    return { ...c, likes: commentToRevert.likes, likedBy: commentToRevert.likedBy };
                }
                return c;
            });
            return { ...prevPost, comments: revertedComments };
        });
        toast({ title: "Error liking comment", description: String(error), variant: "destructive" });
    }
  };


  const toggleRepliesVisibility = (commentId: string) => {
    setExpandedRepliesMap(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    if (!visibleRepliesCountMap[commentId]) {
        setVisibleRepliesCountMap(prev => ({ ...prev, [commentId]: REPLIES_INITIAL_LIMIT }));
    }
  };

  const loadMoreReplies = (commentId: string) => {
    setVisibleRepliesCountMap(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || REPLIES_INITIAL_LIMIT) + REPLIES_INITIAL_LIMIT
    }));
  };

  const topLevelComments = useMemo(() => {
    if (!post || !post.comments) return [];
    return post.comments.filter(comment => !comment.parentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [post]);

  const getRepliesForComment = useCallback((commentId: string) => {
    if (!post || !post.comments) return [];
    return post.comments.filter(reply => reply.parentId === commentId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [post]);


  if (isLoadingPage || authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-10">
        <UserIcon className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold">Post not found</h1>
        <p className="text-muted-foreground">The post you are looking for does not exist.</p>
        <Button asChild className="mt-6">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  const authorLinkPath = post.author?.id ? `/profile/${post.author.id}` : '#';
  const visibleTopLevelComments = topLevelComments.slice(0, visibleCommentsCount);

  return (
    <article className="bg-secondary rounded-lg p-3 sm:p-4">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={authorLinkPath} className="flex items-center gap-2 hover:underline">
              <Avatar className="h-5 w-5">
                <AvatarImage src={post.author.imageUrl} alt={post.author.name} className="object-cover"/>
                <AvatarFallback>{post.author.name?.substring(0,1) || 'A'}</AvatarFallback>
              </Avatar>
              <span className="font-bold text-foreground">{post.author.name}</span>
            </Link>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="ml-12 space-y-2">
            <Badge variant="outline" className="self-start">{staticCategories.find(c => c.slug === post.category)?.name || post.category}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">{post.title}</h1>
        </div>
      </header>

      <div className="ml-12 mt-4 space-y-4">
        {post.imageUrl && post.imageUrl.startsWith('http') && (
          <div className="relative w-full max-h-[70vh] rounded-md overflow-hidden">
            <Image src={post.imageUrl} alt={post.title} width={800} height={600} className="w-full h-auto object-contain" priority data-ai-hint="blog post image"/>
          </div>
        )}
        {post.imageUrl && post.imageUrl.startsWith('data:image') && (
          <div className="relative w-full max-h-[70vh] rounded-md overflow-hidden">
            <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} data-ai-hint="blog post image"/>
          </div>
        )}

        <div className="prose max-w-none prose-p:text-foreground prose-headings:text-primary text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: post.content }} />
        
        <Separator className="my-4" />

        <div className="flex items-center justify-start gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={handlePostLike} className={cn("text-muted-foreground hover:text-primary hover:bg-accent", isPostLikedByCurrentUser && "text-red-500 hover:text-red-600")}>
            <Heart className={cn("h-5 w-5 mr-1.5", isPostLikedByCurrentUser ? "fill-current text-red-500" : "fill-none", showPostLikeAnimation && "animate-heartBeat")} />
            {post.likes || 0} Likes
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-accent">
                <Share2 className="h-5 w-5 mr-1.5" /> Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleShare('copyLink')}><LinkIcon className="mr-2 h-4 w-4" /> Copy Link</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('email')}><Mail className="mr-2 h-4 w-4" /> Email</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('twitter')}><TwitterIcon /> <span className="ml-2">Twitter</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('facebook')}><FacebookIcon /> <span className="ml-2">Facebook</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('whatsapp')}><WhatsAppIcon /> <span className="ml-2">WhatsApp</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <section id="comments-section" className="scroll-mt-24 pt-4">
          <h2 className="text-xl font-semibold text-primary mb-4">Comments ({topLevelComments.length})</h2>
          {user && (
            <div className="mb-6">
              <Textarea placeholder="Add a public comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} className="min-h-[80px] mb-2 bg-background" disabled={isSubmittingComment}/>
              <Button onClick={() => handleAddCommentOrReply(newCommentText)} disabled={isSubmittingComment || !newCommentText.trim()}>
                {isSubmittingComment && !replyToCommentId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Comment
              </Button>
            </div>
          )}
          {!user && <p className="text-muted-foreground mb-4">Please <Link href="/signup" className="text-primary hover:underline">login or sign up</Link> to comment.</p>}

          <div className="space-y-4">
            {visibleTopLevelComments.length > 0 ? visibleTopLevelComments.map(comment => {
              const replies = getRepliesForComment(comment.id);
              const isCommentLikedByCurrentUser = user ? comment.likedBy?.includes(user.id) : false;
              const visibleReplies = expandedRepliesMap[comment.id] ? replies.slice(0, visibleRepliesCountMap[comment.id] || REPLIES_INITIAL_LIMIT) : [];

              return (
                <div key={comment.id} className="py-2">
                  <div className="flex items-start gap-3">
                    <Link href={comment.author.id ? `/profile/${comment.author.id}` : '#'}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.imageUrl} alt={comment.author.name} className="object-cover"/>
                        <AvatarFallback>{comment.author.name?.substring(0,1) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={comment.author.id ? `/profile/${comment.author.id}` : '#'}><span className="font-semibold text-sm text-card-foreground hover:text-primary">{comment.author.name}</span></Link>
                        <span className="text-xs text-muted-foreground">• {new Date(comment.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{comment.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={() => handleCommentLike(comment.id)} className={cn("text-xs px-1 py-0.5 h-auto text-muted-foreground hover:text-primary", isCommentLikedByCurrentUser && "text-red-500")}>
                          <Heart className={cn("h-3.5 w-3.5 mr-1", isCommentLikedByCurrentUser && "fill-current")}/> {comment.likes || 0}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id)} className="text-xs px-1 py-0.5 h-auto text-muted-foreground hover:text-primary">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>

                  {replyToCommentId === comment.id && (
                    <div className="ml-12 mt-2 p-3 bg-background border rounded-md shadow-sm">
                      <Textarea placeholder={`Replying to ${comment.author.name}...`} value={replyText} onChange={(e) => setReplyText(e.target.value)} className="min-h-[60px] mb-2 text-sm" disabled={isSubmittingComment}/>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {setReplyToCommentId(null); setReplyText('');}} disabled={isSubmittingComment}>Cancel</Button>
                        <Button size="sm" onClick={() => handleAddCommentOrReply(replyText, comment.id)} disabled={isSubmittingComment || !replyText.trim()}>
                          {isSubmittingComment && replyToCommentId === comment.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}

                  {replies.length > 0 && (
                    <div className="ml-10 mt-2 pl-2 border-l-2 border-border">
                      <Button variant="link" size="sm" onClick={() => toggleRepliesVisibility(comment.id)} className="px-0 py-1 text-xs text-muted-foreground hover:text-primary">
                        {expandedRepliesMap[comment.id] ? <EyeOff className="mr-1 h-3.5 w-3.5"/> : <Eye className="mr-1 h-3.5 w-3.5"/>}
                        {expandedRepliesMap[comment.id] ? 'Hide' : `View ${replies.length}`} replies
                      </Button>
                      {expandedRepliesMap[comment.id] && visibleReplies.map(reply => {
                        const isReplyLiked = user ? reply.likedBy?.includes(user.id) : false;
                        return (
                          <div key={reply.id} className="flex items-start gap-2.5 my-2">
                            <CornerDownRight className="h-4 w-4 text-muted-foreground mt-1.5 shrink-0"/>
                            <Link href={reply.author.id ? `/profile/${reply.author.id}` : '#'}>
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={reply.author.imageUrl} alt={reply.author.name} className="object-cover"/>
                                <AvatarFallback className="text-xs">{reply.author.name?.substring(0,1) || 'U'}</AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Link href={reply.author.id ? `/profile/${reply.author.id}` : '#'}><span className="font-semibold text-xs text-card-foreground hover:text-primary">{reply.author.name}</span></Link>
                                <span className="text-xs text-muted-foreground">• {new Date(reply.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{reply.text}</p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Button variant="ghost" size="sm" onClick={() => handleCommentLike(reply.id)} className={cn("text-xs px-1 py-0.5 h-auto text-muted-foreground hover:text-primary", isReplyLiked && "text-red-500")}>
                                  <Heart className={cn("h-3 w-3 mr-0.5", isReplyLiked && "fill-current")}/> {reply.likes || 0}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {expandedRepliesMap[comment.id] && replies.length > visibleReplies.length && (
                          <Button variant="link" size="sm" onClick={() => loadMoreReplies(comment.id)} className="px-0 py-1 text-xs text-muted-foreground hover:text-primary">
                              View more replies
                          </Button>
                      )}
                    </div>
                  )}
                </div>
              )}) : (
                <p className="text-muted-foreground text-center py-6">No comments yet. Be the first to comment!</p>
              )}
              {topLevelComments.length > visibleCommentsCount && (
                 <Button variant="link" onClick={() => setVisibleCommentsCount(topLevelComments.length)} className="w-full justify-start px-0 text-sm text-muted-foreground hover:text-primary">
                      View all {topLevelComments.length} comments
                  </Button>
              )}
          </div>
          </section>
        </div>
    </article>
  );
}


export default function PostPage() {
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ category: string, count: number }>>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  
  const popularCategoriesData = useMemo(() => {
    return staticCategories.map(sc => {
      const dynamicCat = dynamicCategories.find(dc => dc.category === sc.slug);
      return {
        ...sc,
        postCount: dynamicCat ? dynamicCat.count : 0,
      };
    }).sort((a,b) => b.postCount - a.postCount);
  }, [dynamicCategories]);
  
  useEffect(() => {
    async function fetchSidebarData() {
       try {
        const [catCounts, authors, trending] = await Promise.all([
          getCategoriesWithCounts(),
          getTopAuthors(5),
          getPosts(1, 5) // For trending sidebar
        ]);
        setDynamicCategories(catCounts);
        setTopAuthors(authors);
        setTrendingPosts(trending.posts);
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error);
      }
    }
    fetchSidebarData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader popularCategoriesData={popularCategoriesData} />
      <main className="flex-grow container mx-auto px-4 py-8 pt-20 md:pt-8">
        <div className="grid grid-cols-12 gap-8">
            <aside className="hidden lg:block col-span-3">
               <div className="sticky top-20 space-y-6 h-[calc(100vh-6rem)] overflow-y-auto pr-4 border-r">
                  <PopularCategories categories={popularCategoriesData} />
                  <Separator />
                  <ResourcesSidebar />
              </div>
            </aside>

            <section className="col-span-12 lg:col-span-6 flex flex-col gap-4">
               <PostContent />
            </section>

            <aside className="hidden lg:block col-span-3">
               <div className="sticky top-20 space-y-6 h-[calc(100vh-6rem)] overflow-y-auto pl-4">
                  <TrendingSidebar trendingPosts={trendingPosts} />
                  <Separator />
                  <TopAuthorsSidebar authors={topAuthors} />
               </div>
            </aside>
        </div>
      </main>
    </div>
  );
}
