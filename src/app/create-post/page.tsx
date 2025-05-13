// src/app/create-post/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/header';
import { FormattingToolbar } from '@/components/create-post/formatting-toolbar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PostSubmissionPopup } from '@/components/blog/post-submission-popup';
import { categories as allCategories } from '@/lib/data'; 
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { createPost, type CreatePostInput } from '@/app/actions/post.actions';
import { useAuth } from '@/contexts/auth-context';

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authIsLoading } = useAuth();

  const [title, setTitle] = useState('');
  
  // Initialize content with the value from query parameter only on first meaningful load or if param changes.
  const initialContentFromQuery = searchParams.get('initialContent') || '';
  const [content, setContent] = useState(() => decodeURIComponent(initialContentFromQuery));
  // Stores the last query parameter value that was used to set the content.
  const [processedInitialContentQuery, setProcessedInitialContentQuery] = useState(initialContentFromQuery);

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    if (!authIsLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to create a post.",
        variant: "destructive",
      });
      router.push('/login');
    }
  }, [user, authIsLoading, router, toast]);

  useEffect(() => {
    // This effect runs if the `initialContent` query parameter changes to a new value.
    // This allows the content to be updated if the user navigates to this page
    // with a different `initialContent` (e.g., from another "Share" action).
    // It avoids overwriting user's current edits if the query parameter hasn't changed
    // from the one that initially populated the textarea.
    const newInitialContentFromQuery = searchParams.get('initialContent') || '';
    if (newInitialContentFromQuery !== processedInitialContentQuery) {
      setContent(decodeURIComponent(newInitialContentFromQuery));
      setProcessedInitialContentQuery(newInitialContentFromQuery);
    }
  }, [searchParams, processedInitialContentQuery]);


  const handleFormattingCommand = (command: string) => {
    console.log(`Command: ${command}`);
    // Basic markdown formatting (can be enhanced with cursor position awareness)
    let selectedText = ""; // In a real editor, this would be the selected text
    // For Textarea, we append. A proper editor would wrap selected text.
    if (command === 'bold') setContent(prev => prev + `**${selectedText}**`);
    if (command === 'italic') setContent(prev => prev + `*${selectedText}*`);
    // More commands can be added here
  };

  const handleSubmitClick = () => {
    if (!user) {
      toast({ title: "Not Logged In", description: "Please log in to create a post.", variant: "destructive" });
      router.push('/login');
      return;
    }
    if (!title.trim()) {
       toast({ title: "Title Required", description: "Please enter a title for your post.", variant: "destructive" });
       return;
    }
    if (!content.trim()) {
      toast({ title: "Content Required", description: "Please enter some content for your post.", variant: "destructive" });
      return;
    }
    setIsPopupOpen(true);
  };

  const handleFinalSubmit = async (formData: { coverImage?: File; categorySlug: string }) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "User not found. Please log in again.", variant: "destructive" });
      return;
    }

    let imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/600/400`;
    if (formData.coverImage) {
        console.log("Simulating upload for:", formData.coverImage.name);
        // In a real app: actual upload logic here
        // const uploadedUrl = await uploadImageToServer(formData.coverImage);
        // imageUrl = uploadedUrl;
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}-${Date.now()}/600/400`;
        toast({ title: "Image Uploaded (Mock)", description: "Cover image processed." });
    }

    const postData: CreatePostInput = {
      title,
      content,
      categorySlug: formData.categorySlug,
      authorId: user.id,
      imageUrl: imageUrl,
    };

    try {
      const newPost = await createPost(postData);
      if (newPost) {
        toast({
          title: "Post Submitted!",
          description: `Your post "${newPost.title}" has been submitted.`,
        });
        setTitle('');
        setContent('');
        setProcessedInitialContentQuery(''); // Reset processed query state
        setIsPopupOpen(false);
        router.push(`/posts/${newPost.id}/${newPost.title.toLowerCase().replace(/\s+/g, '-')}`); 
      } else {
        throw new Error("Failed to create post on server.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authIsLoading) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }
  
  if (!user) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8 text-center">
        <p>Redirecting to login...</p>
      </main>
    );
  }

  return (
    <>
      <FormattingToolbar onCommand={handleFormattingCommand} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-card p-6 sm:p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">Create New Post</h1>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="post-title" className="block text-sm font-medium text-foreground mb-1">
                Post Title
              </label>
              <Input
                id="post-title"
                type="text"
                placeholder="Enter your post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg"
              />
            </div>

            <Separator />

            <div>
              <label htmlFor="post-content" className="block text-sm font-medium text-foreground mb-1">
                Post Content
              </label>
              <Textarea
                id="post-content"
                placeholder="Write your amazing content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] text-base"
              />
            </div>

            <Button onClick={handleSubmitClick} size="lg" className="w-full">
              <Send className="mr-2 h-5 w-5" />
              Proceed to Publish
            </Button>
          </div>
        </div>
      </main>

      <PostSubmissionPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        postTitle={title}
        categories={allCategories}
        onSubmit={handleFinalSubmit}
      />
    </>
  );
}


export default function CreatePostPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <Suspense fallback={<div className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <CreatePostContent />
      </Suspense>
    </div>
  );
}

