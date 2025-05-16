// src/app/admin/add-blog/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { FormattingToolbar } from '@/components/create-post/formatting-toolbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PostSubmissionPopup } from '@/components/blog/post-submission-popup';
import { categories as allCategories } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, UserPlus, Users, XCircle } from 'lucide-react';
import { createPost, type CreatePostActionInput as CreatePostInput } from '@/app/actions/post.actions';
import { useAuth } from '@/contexts/auth-context';
import type { UserSummary } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddNewAuthorDialog } from '@/components/admin/add-new-author-dialog';
import { SelectExistingAuthorDialog } from '@/components/admin/select-existing-author-dialog';

export default function AdminAddBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: adminUser, isLoading: authIsLoading, isAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<UserSummary | null>(null);
  const [isPostSubmissionPopupOpen, setIsPostSubmissionPopupOpen] = useState(false);
  const [isAddNewAuthorDialogOpen, setIsAddNewAuthorDialogOpen] = useState(false);
  const [isSelectExistingAuthorDialogOpen, setIsSelectExistingAuthorDialogOpen] = useState(false);

  const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1],
      },
    }),
    Underline,
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'tiptap-link', // Optional class for styling
      },
    }),
    Image,
  ],
});


  useEffect(() => {
    if (!authIsLoading && !isAdmin) { // Use isAdmin from useAuth hook
      toast({ title: "Unauthorized", description: "You are not authorized to access this page.", variant: "destructive" });
      router.push('/admin'); // Redirect to admin login page
    }
  }, [isAdmin, authIsLoading, router, toast]);


  
  const handleSubmitClick = () => {
    if (!selectedAuthor) {
      toast({ title: "Author Not Selected", description: "Please select or add an author for this post.", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title for your post.", variant: "destructive" });
      return;
    }
    if (!editor || editor.isEmpty) {
      toast({ title: "Content Required", description: "Please enter some content for your post.", variant: "destructive" });
      return;
    }
    setIsPostSubmissionPopupOpen(true);
  };

  const handleFinalSubmit = async (formData: { coverImage?: File; categorySlug: string }) => {
    if (!adminUser || !selectedAuthor || !editor) {
      toast({ title: "Error", description: "Missing critical information for submission.", variant: "destructive" });
      return;
    }

    let imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/600/400`;
    if (formData.coverImage) {
      console.log("Simulating upload for:", formData.coverImage.name);
      await new Promise(resolve => setTimeout(resolve, 1000));
      imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}-${Date.now()}/600/400`;
      toast({ title: "Image Uploaded (Mock)", description: "Cover image processed." });
    }

    const postData: CreatePostInput = {
      title,
      content: editor.getHTML(), // Get HTML content from Tiptap
      categorySlug: formData.categorySlug,
      authorId: selectedAuthor.id, // Use selected author's ID
      imageUrl: imageUrl,
      status: 'pending', // Posts created by admin also start as pending
    };

    try {
      const newPost = await createPost(postData);
      if (newPost) {
        toast({ title: "Post Submitted!", description: `Post "${newPost.title}" is pending review.` });
        setTitle('');
        editor.commands.setContent('');
        setSelectedAuthor(null); // Reset selected author
        setIsPostSubmissionPopupOpen(false);
        router.push(`/admin/blogs`);
      } else {
        throw new Error("Failed to create post on server.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({ title: "Submission Failed", description: String(error), variant: "destructive" });
    }
  };
  
  const handleAuthorSelected = (author: UserSummary) => {
    setSelectedAuthor(author);
    setIsAddNewAuthorDialogOpen(false);
    setIsSelectExistingAuthorDialogOpen(false);
  };

  if (authIsLoading) {
    return <div className="flex-grow flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) { // Ensure content isn't rendered if not admin, even before redirect kicks in
      return <div className="flex-grow flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2">Verifying admin access...</p></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card p-4 border-b sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-primary mb-4">Add New Blog Post</h1>
        
        {/* Section 1: Author Selection */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-3 text-foreground">1. Choose Author</h2>
          {selectedAuthor ? (
            <div className="flex items-center justify-between p-3 bg-background rounded-md shadow">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedAuthor.imageUrl || `https://picsum.photos/seed/${selectedAuthor.id}/40/40`} alt={selectedAuthor.name} data-ai-hint="author avatar"/>
                  <AvatarFallback>{selectedAuthor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedAuthor.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedAuthor.id}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAuthor(null)} title="Clear selected author">
                <XCircle className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button onClick={() => setIsAddNewAuthorDialogOpen(true)} variant="outline">
                <UserPlus className="mr-2 h-4 w-4" /> Add New Author
              </Button>
              <Button onClick={() => setIsSelectExistingAuthorDialogOpen(true)} variant="outline">
                <Users className="mr-2 h-4 w-4" /> Use Existing Author
              </Button>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        <h2 className="text-lg font-semibold mb-3 text-foreground">2. Blog Details & Content</h2>
         <div className="mb-4">
            <label htmlFor="post-title-admin" className="block text-sm font-medium text-foreground mb-1">
            Post Title
            </label>
            <Input
            id="post-title-admin"
            type="text"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
            disabled={!selectedAuthor}
            />
        </div>
      </div>

      {/* Formatting Toolbar - pass editor instance */}
      <FormattingToolbar editor={editor} />

      {/* Section 2: Blog Editor */}
      <div className="flex-grow p-4 bg-card">
        <EditorContent editor={editor} className={!selectedAuthor ? "opacity-50 pointer-events-none" : ""} />
        {!selectedAuthor && (
            <p className="text-center text-muted-foreground mt-4 text-sm">Please select an author before writing the post.</p>
        )}
      </div>
      
      <div className="p-4 border-t bg-card sticky bottom-0 z-10">
        <Button onClick={handleSubmitClick} size="lg" className="w-full" disabled={!selectedAuthor || !title.trim() || (editor?.isEmpty ?? true)}>
          <Send className="mr-2 h-5 w-5" />
          Proceed to Publish
        </Button>
      </div>

      <AddNewAuthorDialog
        isOpen={isAddNewAuthorDialogOpen}
        onClose={() => setIsAddNewAuthorDialogOpen(false)}
        onAuthorCreated={handleAuthorSelected}
      />
      <SelectExistingAuthorDialog
        isOpen={isSelectExistingAuthorDialogOpen}
        onClose={() => setIsSelectExistingAuthorDialogOpen(false)}
        onAuthorSelected={handleAuthorSelected}
      />
      <PostSubmissionPopup
        isOpen={isPostSubmissionPopupOpen}
        onClose={() => setIsPostSubmissionPopupOpen(false)}
        postTitle={title}
        categories={allCategories}
        onSubmit={handleFinalSubmit}
      />
      
    </div>
  );
}
