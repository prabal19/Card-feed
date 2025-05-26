// src/app/posts/[postId]/[slug]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { TrendingSidebar } from '@/components/blog/trending-sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Heart, Share2, Send, User as UserIcon, Loader2, LinkIcon, Mail ,Image as ImageIcon} from 'lucide-react';
import type { Post, Comment as CommentType, UserSummary } from '@/types';
import { getPostById, getPosts, likePost, sharePost, addComment } from '@/app/actions/post.actions';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn, generateSlug } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock social icons for dropdown (copied from blog-card for consistency)
const TwitterIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.733 4.568 4.69 4.69 0 0 1-2.104.08 4.661 4.661 0 0 0 4.35 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.49 9.49 0 0 0 2.323-2.41z"/></svg>;
const FacebookIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.046C18.343 21.128 22 16.991 22 12z"/></svg>;
const WhatsAppIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.34 3.43 16.84L2.05 22L7.32 20.63C8.75 21.39 10.35 21.81 12.04 21.81C17.5 21.81 21.95 17.36 21.95 11.9C21.95 6.44 17.5 2 12.04 2ZM12.04 20.13C10.56 20.13 9.12 19.75 7.89 19.03L7.53 18.82L4.44 19.65L5.29 16.64L5.06 16.26C4.26 14.94 3.83 13.42 3.83 11.91C3.83 7.39 7.52 3.69 12.04 3.69C16.56 3.69 20.25 7.39 20.25 11.9C20.25 16.41 16.56 20.13 12.04 20.13ZM17.37 14.52C17.13 14.24 16.05 13.68 15.82 13.59C15.58 13.5 15.42 13.46 15.25 13.73C15.08 14 14.66 14.52 14.53 14.69C14.4 14.85 14.27 14.87 14.02 14.78C13.78 14.69 12.93 14.41 11.92 13.54C11.14 12.86 10.64 12.05 10.49 11.81C10.34 11.57 10.45 11.44 10.57 11.32C10.68 11.21 10.82 11.03 10.95 10.88C11.08 10.74 11.12 10.62 11.21 10.45C11.3 10.28 11.25 10.13 11.19 10.02C11.12 9.91 10.66 8.76 10.47 8.31C10.29 7.86 10.11 7.91 9.96 7.91C9.82 7.91 9.66 7.9 9.5 7.9C9.33 7.9 9.08 7.95 8.88 8.22C8.69 8.49 8.13 9.01 8.13 10.13C8.13 11.25 8.91 12.33 9.04 12.49C9.17 12.66 10.65 15.01 12.96 15.92C15.27 16.83 15.27 16.54 15.59 16.5C15.91 16.45 16.92 15.85 17.13 15.28C17.34 14.71 17.34 14.31 17.37 14.52Z"/></svg>;


export default function PostPage() {
  const params = useParams<{ postId: string; slug: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!params.postId) return;
      setIsLoadingPage(true);
      try {
        const [fetchedPost, fetchedTrendingPostsData] = await Promise.all([
          getPostById(params.postId),
          getPosts(1, 5) // Fetch 5 trending posts for sidebar
        ]);

        if (fetchedPost) {
          setPost(fetchedPost);
          if (user && fetchedPost.likedBy) {
            setIsLiked(fetchedPost.likedBy.includes(user.id));
          }
          
        } else {
          toast({ title: "Post not found", variant: "destructive" });
          router.push('/');
        }
        setTrendingPosts(fetchedTrendingPostsData.posts);
      } catch (error) {
        console.error("Error fetching post data:", error);
        toast({ title: "Failed to load post", description: String(error), variant: "destructive" });
      } finally {
        setIsLoadingPage(false);
      }
    }
    fetchData();
  }, [params.postId, params.slug, user, router, toast]);

  const handleLike = async () => {
    if (!user || !post) {
      toast({ title: "Please login to like posts", variant: "destructive" });
      return;
    }
    const newLikedState = !isLiked;
    const newLikeCount = newLikedState ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);

    setIsLiked(newLikedState);
    setPost(p => p ? { ...p, likes: newLikeCount, likedBy: newLikedState ? [...(p.likedBy || []), user.id] : (p.likedBy || []).filter(id => id !== user.id) } : null);
    if (newLikedState) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 300);
    }

    try {
      const updatedPost = await likePost(post.id, user.id);
      if (updatedPost) {
        setPost(updatedPost);
        if (user && updatedPost.likedBy) setIsLiked(updatedPost.likedBy.includes(user.id));
      } else throw new Error("Failed to update like on server");
    } catch (error) {
      setIsLiked(!newLikedState); // Revert
      setPost(p => p ? { ...p, likes: newLikedState ? (p.likes || 1) - 1 : (p.likes || 0) + 1, likedBy: newLikedState ? (p.likedBy || []).filter(id => id !== user.id) : [...(p.likedBy || []), user.id] } : null);
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
      // Simplified Messenger and Instagram share handling
      case 'messenger': toast({ title: "Messenger Share", description: "Please share manually or copy the link." }); break;
      case 'instagram': toast({ title: "Instagram Share", description: "Please share via mobile app or copy the link." }); break;
      default: return;
    }

    if (platform !== 'copyLink') {
      try {
        const updatedPost = await sharePost(post.id);
        if (updatedPost) setPost(updatedPost);
      } catch (error) { console.error("Error updating share count", error); }
    }
  };

  const handleAddComment = async () => {
    if (!user || !post) {
      toast({ title: "Please login to comment", variant: "destructive" });
      return;
    }
    if (!newCommentText.trim()) {
      toast({ title: "Comment cannot be empty", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    const authorSummary: UserSummary = { id: user.id, name: `${user.firstName} ${user.lastName}`, imageUrl: user.profileImageUrl || undefined };
    const optimisticComment: CommentType = { id: `temp-${Date.now()}`, _id: undefined, postId: post.id, author: authorSummary, text: newCommentText, date: new Date().toISOString() };
    
    setPost(p => p ? { ...p, comments: [...(p.comments || []), optimisticComment] } : null);
    setNewCommentText('');

    try {
      const updatedPost = await addComment({ postId: post.id, text: optimisticComment.text, authorId: user.id, authorName: authorSummary.name, authorImageUrl: authorSummary.imageUrl });
      if (updatedPost) setPost(updatedPost);
      else throw new Error("Failed to add comment on server");
    } catch (error) {
      setPost(p => p ? { ...p, comments: (p.comments || []).filter(c => c.id !== optimisticComment.id) } : null);
      toast({ title: "Error adding comment", description: String(error), variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const sortedComments = useMemo(() => {
    if (!post || !post.comments) return [];
    return [...post.comments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [post]);


  if (isLoadingPage || authLoading) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow container mx-auto px-6 lg:px-8 py-8 pt-28 md:pt-8">
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow container mx-auto px-6 lg:px-8 py-8 pt-28 md:pt-8 text-center">
          <UserIcon className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold">Post not found</h1>
          <p className="text-muted-foreground">The post you are looking for does not exist.</p>
          <Button asChild className="mt-6">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </main>
      </>
    );
  }
  
  const authorLinkPath = post.author?.id ? `/profile/${post.author.id}` : '#';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-6 lg:px-8 py-8 pt-28 md:pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Post Content Area */}
          <article className="w-full lg:w-2/3 bg-card shadow-xl rounded-lg p-6 md:p-8">
            {post.imageUrl && post.imageUrl.startsWith('http') && (
              <div className="relative w-full h-80 md:h-[500px] mb-6 rounded-md overflow-hidden">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  layout="fill"
                  objectFit="cover"
                  priority
                />
              </div>
            )}
             {post.imageUrl && post.imageUrl.startsWith('data:image') && (
              <div className="relative w-full h-80 md:h-[500px] mb-6 rounded-md overflow-hidden">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />
              </div>
            )}
            {!post.imageUrl && (
                <div className="relative w-full h-80 md:h-[500px] mb-6 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    <ImageIcon className="h-24 w-24 text-muted-foreground" />
                </div>
            )}
            <header className="mb-6">
              <Badge variant="outline" className="mb-2 self-start bg-accent/10 text-black border-accent/50">{post.category.charAt(0).toUpperCase() + post.category.slice(1)}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">{post.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Link href={authorLinkPath} className="flex items-center gap-2 hover:text-primary">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={post.author.imageUrl} alt={post.author.name}  className="object-cover"/>
                    <AvatarFallback>{post.author.name?.substring(0,1) || 'A'}</AvatarFallback>
                  </Avatar>
                  <span>{post.author.name}</span>
                </Link>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
              </div>
            </header>

            <Separator className="my-6" />
            
            {/* Post Content - using whitespace-pre-wrap to respect newlines from plain text */}
            <div className="prose max-w-none prose-p:text-foreground prose-headings:text-primary text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: post.content }} />
            
            <Separator className="my-8" />

            {/* Action Buttons */}
            <div className="flex items-center justify-start gap-2 sm:gap-4 mb-8">
              <Button variant="ghost" size="sm" onClick={handleLike} className={cn("text-muted-foreground hover:bg-red-400", isLiked && "text-red-500 hover:text-red-600")}>
                <Heart className={cn("h-5 w-5 mr-1.5", isLiked ? "fill-current text-red-500" : "fill-none", showHeartAnimation && "animate-heartBeat")} />
                {post.likes || 0} Likes
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-green-400">
                    <Share2 className="h-5 w-5 mr-1.5" /> Share ({post.shares || 0})
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

            {/* Comments Section */}
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">Comments ({sortedComments.length})</h2>
              {user && (
                <div className="mb-6">
                  <Textarea
                    placeholder="Write your comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="min-h-[100px] mb-2"
                    disabled={isSubmittingComment}
                  />
                  <Button onClick={handleAddComment} disabled={isSubmittingComment || !newCommentText.trim()}>
                    {isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Comment
                  </Button>
                </div>
              )}
              {!user && <p className="text-muted-foreground mb-4">Please <Link href="/login" className="text-primary hover:underline">login</Link> to add a comment.</p>}

              <div className="space-y-4">
                {sortedComments.length > 0 ? sortedComments.map(comment => (
                  <Card key={comment.id || comment._id?.toString()} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Link href={comment.author.id ? `/profile/${comment.author.id}` : '#'}>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={comment.author.imageUrl} alt={comment.author.name} className="object-cover"/>
                            <AvatarFallback>{comment.author.name?.substring(0,1) || 'U'}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Link href={comment.author.id ? `/profile/${comment.author.id}` : '#'}>
                                <span className="font-semibold text-sm text-card-foreground hover:text-primary">{comment.author.name}</span>
                            </Link>
                            <span className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </section>
          </article>

          {/* Trending Sidebar */}
          <aside className="w-full lg:w-1/3 lg:sticky lg:top-[calc(theme(spacing.4)_+_65px_+_env(safe-area-inset-top))] h-fit">
            <TrendingSidebar trendingPosts={trendingPosts} />
          </aside>
        </div>
      </main>
    </div>
  );
}
