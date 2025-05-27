// src/app/create-post/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useRef }  from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import HardBreak from '@tiptap/extension-hard-break';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history';
import { TextSelection } from 'prosemirror-state';
import { Button } from '@/components/ui/button';
import { PostSubmissionPopup } from '@/components/blog/post-submission-popup';
import { AddImagePopup } from '@/components/create-post/add-image-popup';
import { AddLinkPopup } from '@/components/create-post/add-link-popup';
import { FormattingToolbar } from '@/components/create-post/formatting-toolbar';
import { categories as allCategories } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AddEmbedPopup } from '@/components/create-post/add-embed-popup';
import { Loader2, Newspaper, Bell, Check, Plus, X, ImagePlus as ImagePlusIcon, Link as LinkIcon, User as UserIcon, LogOut, Minus, Code2 } from 'lucide-react';
import { createPost, type CreatePostActionInput as CreatePostInput , getPostById, updatePostAndSetPending} from '@/app/actions/post.actions';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn, generateSlug } from '@/lib/utils';
import type { User, UserSummary,Post,UpdatePostData } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUnreadNotificationCount } from '@/app/actions/notification.actions';
import { LinkPreviewNode } from '@/extensions/LinkPreviewNode'



export function CreatePostContent({ isForAdmin = false, adminSelectedAuthor = null }: { isForAdmin?: boolean, adminSelectedAuthor?: UserSummary | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { user, isLoading: authIsLoading , logout} = useAuth();
  const [isEmbedPopupOpen, setIsEmbedPopupOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPostSubmissionPopupOpen, setIsPostSubmissionPopupOpen] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showQuickInsertButton, setShowQuickInsertButton] = useState(false);
  const [isQuickInsertMenuOpen, setIsQuickInsertMenuOpen] = useState(false);
  const [blurTimeoutId, setBlurTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [quickInsertButtonTop, setQuickInsertButtonTop] = useState<number | null>(null);
  const editorContentWrapperRef = useRef<HTMLDivElement>(null);
 const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
 const [firstImageFromContentForPopup, setFirstImageFromContentForPopup] = useState<string | null>(null);
  const [currentEditingPostId, setCurrentEditingPostId] = useState<string | null>(null);
  const [initialPostDataForEdit, setInitialPostDataForEdit] = useState<Post | null>(null);
  const [isLoadingPostForEdit, setIsLoadingPostForEdit] = useState(false);

  const editor = useEditor({
    extensions: [
      Document, Paragraph, Text, History, 
      StarterKit.configure({ document: false, paragraph: false, text: false, history: false, heading: false, bulletList: false, orderedList: false, hardBreak: false, horizontalRule: false, strike: false, }),
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
      LinkExtension.configure({ openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } }),
      ImageExtension.configure({ // Using Tiptap's image extension
        inline: false, // Ensures the image is a block element
        allowBase64: true, // Crucial for data URIs
        HTMLAttributes: {
          class: 'w-full object-cover rounded-md my-4 transition-all hover:border-2 hover:border-green-500', // Styling for block-like appearance with margin
        },
      }),
       BulletList, ListItem, OrderedList, HardBreak, HorizontalRule, Strike, LinkPreviewNode
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none w-full min-h-[300px] relative',
      },
    },
   onUpdate: ({ editor }) => {
  const { selection } = editor.state;

  // Ensure it's a TextSelection and has a cursor
  if (editor.isFocused && selection instanceof TextSelection && selection.$cursor) {
    const { $cursor } = selection;

    if ($cursor.parent.content.size === 0 && $cursor.depth > 0) {
      const currentBlockDomNode = editor.view.nodeDOM($cursor.start(-1)) as HTMLElement;

      if (currentBlockDomNode && editorContentWrapperRef.current) {
        let topPosition = currentBlockDomNode.offsetTop;

        const buttonHeight = 32;
        const lineHeight = parseFloat(getComputedStyle(currentBlockDomNode).lineHeight) || 24;
        topPosition = topPosition + (lineHeight / 2) - (buttonHeight / 2);

        setQuickInsertButtonTop(topPosition);
        setShowQuickInsertButton(true);
      } else {
        setShowQuickInsertButton(false);
      }
    } else {
      setShowQuickInsertButton(false);
      if (isQuickInsertMenuOpen) setIsQuickInsertMenuOpen(false);
    }
  } else {
    setShowQuickInsertButton(false);
    if (isQuickInsertMenuOpen) setIsQuickInsertMenuOpen(false);
  }
},
    onFocus: ({editor}) => {
      if (blurTimeoutId) clearTimeout(blurTimeoutId);
       const { selection } = editor.state;
      if (editor.isFocused && selection instanceof TextSelection && selection.$cursor) {
          const { $cursor } = selection;
        if (editor.isFocused && $cursor && $cursor.parent.content.size === 0 && $cursor.depth > 0) {  
            // Logic similar to onUpdate to show button on focus
            const currentBlockDomNode = editor.view.nodeDOM($cursor.start($cursor.depth) -1 ) as HTMLElement;
            if (currentBlockDomNode && editorContentWrapperRef.current) {
                 let topPosition = currentBlockDomNode.offsetTop;
                 const buttonHeight = 32;
                 const lineHeight = parseFloat(getComputedStyle(currentBlockDomNode).lineHeight) || 24;
                 topPosition = topPosition + (lineHeight / 2) - (buttonHeight / 2);
                 setQuickInsertButtonTop(topPosition);
                 setShowQuickInsertButton(true);
            }
        }
      }  
    },
    onBlur: () => {
        const newTimeoutId = setTimeout(() => {
            if (!isQuickInsertMenuOpen && !isImagePopupOpen && !isLinkPopupOpen && !isEmbedPopupOpen) { 
                setShowQuickInsertButton(false);
                setIsQuickInsertMenuOpen(false);
            }
        }, 200); 
        setBlurTimeoutId(newTimeoutId);
    },
  });

  useEffect(() => {
    return () => { if (blurTimeoutId) clearTimeout(blurTimeoutId); };
  }, [blurTimeoutId]);



  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';

    return () => {
      if (footer) footer.style.display = '';
    };
  }, []);

  useEffect(() => {
    if (!authIsLoading && !user && !isForAdmin && !currentEditingPostId) {
      toast({ title: "Authentication Required", description: "You need to be logged in to create a post.", variant: "destructive" });
      router.push('/signup');
    }
    if (isForAdmin && !authIsLoading && (!user?.role?.includes('admin') && !adminSelectedAuthor) ) {
        toast({ title: "Unauthorized", description: "Admin access or author selection required.", variant: "destructive"});
        if (!adminSelectedAuthor) router.push('/admin/add-blog'); // Stay on page if author not selected yet by admin
        else router.push('/admin'); // Redirect if admin context is generally missing
    }
  }, [user, authIsLoading, router, toast, isForAdmin, adminSelectedAuthor, currentEditingPostId]);

  useEffect(() => {
    const saveDraft = () => {
      if (title || (editor && !editor.isEmpty)) {
        console.log("Simulating draft save:", { title, content: editor?.getHTML() });
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      }
    };
    const debouncedSave = setTimeout(saveDraft, 3000);
    return () => clearTimeout(debouncedSave);
  }, [title, editor?.getHTML(), editor]);

    useEffect(() => {
    if (user && !isForAdmin) {
      const fetchUnreadCount = async () => {
        try {
          const count = await getUnreadNotificationCount(user.id);
          setUnreadNotifications(count);
        } catch (error) {
          console.error("Failed to fetch unread notification count:", error);
        }
      };
      fetchUnreadCount();

    }
  }, [user, isForAdmin]);

  useEffect(() => {
    const editPostIdQuery = searchParams.get('editPostId');
    if (editPostIdQuery) {
      setCurrentEditingPostId(editPostIdQuery);
      setIsLoadingPostForEdit(true);
      const fetchPostForEdit = async () => {
        try {
          const postToEdit = await getPostById(editPostIdQuery);
          if (postToEdit) {
            if (user && (user.id === postToEdit.author.id || isForAdmin)) {
              setTitle(postToEdit.title);
              if(titleTextareaRef.current) {
                titleTextareaRef.current.value = postToEdit.title; // Set value directly for textarea
                titleTextareaRef.current.style.height = 'auto';
                titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
              }
              editor?.commands.setContent(postToEdit.content);
              setInitialPostDataForEdit(postToEdit);
              const contentHTML = postToEdit.content;
              const match = contentHTML.match(/<img[^>]+src\s*=\s*['"]([^'"]+)['"]/i);
              setFirstImageFromContentForPopup(match ? match[1] : postToEdit.imageUrl || null);

            } else {
              toast({ title: "Unauthorized", description: "You are not authorized to edit this post.", variant: "destructive" });
              router.push('/');
            }
          } else {
            toast({ title: "Post Not Found", description: "The post you are trying to edit could not be found.", variant: "destructive" });
            router.push('/');
          }
        } catch (error) {
          toast({ title: "Error Loading Post", description: "Could not load the post for editing.", variant: "destructive" });
          router.push('/');
        } finally {
          setIsLoadingPostForEdit(false);
        }
      };
      if (user || isForAdmin) { // Only fetch if user is loaded or if it's admin context
          fetchPostForEdit();
      }
    } else {
        // Reset state if not in edit mode
        setTitle('');
        editor?.commands.setContent('');
        setCurrentEditingPostId(null);
        setInitialPostDataForEdit(null);
        setFirstImageFromContentForPopup(null);
        if(titleTextareaRef.current) {
            titleTextareaRef.current.value = '';
            titleTextareaRef.current.style.height = 'auto';
        }
    }
  }, [searchParams, editor, user, isForAdmin, router, toast]);

  const handlePublishClick = () => {
    const authorToSubmitId = isForAdmin ? adminSelectedAuthor?.id : user?.id;
    if (!authorToSubmitId) {
      toast({ title: "Author Missing", description: isForAdmin ? "Please select an author." : "Please log in.", variant: "destructive" });
      if (!isForAdmin) router.push('/signup');
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title Required", variant: "destructive" }); return;
    }
    if (!editor || editor.isEmpty) {
      toast({ title: "Content Required", variant: "destructive" }); return;
    }
    const contentHTML = editor.getHTML();
    if (!firstImageFromContentForPopup && !initialPostDataForEdit?.imageUrl) {

        const match = contentHTML.match(/<img[^>]+src\s*=\s*['"]([^'"]+)['"]/i);
        setFirstImageFromContentForPopup(match ? match[1] : null);
    } else if (initialPostDataForEdit?.imageUrl && !firstImageFromContentForPopup) {
        setFirstImageFromContentForPopup(initialPostDataForEdit.imageUrl);
    }


    setIsPostSubmissionPopupOpen(true);
  };


  const handleFinalSubmit = async (formData: { coverImageDataUri?: string; categorySlug: string, excerpt: string }) => {
    const authorToSubmitId = isForAdmin ? adminSelectedAuthor?.id : user?.id;
    if (!authorToSubmitId || !editor) return;
    
    setIsDraftSaved(false); // Clear draft saved status

    try {
        if (currentEditingPostId) {
            const postUpdateData: UpdatePostData = {
                title,
                content: editor?.getHTML(),
                excerpt: formData.excerpt,
                categorySlug: formData.categorySlug,
                imageUrl: formData.coverImageDataUri,
            };
            const updatedPost = await updatePostAndSetPending(currentEditingPostId, postUpdateData);
            if (updatedPost) {
                toast({ title: "Post Updated!", description: `"${updatedPost.title}" has been submitted for review.` });
                router.push(isForAdmin ? `/admin/blogs` : `/profile/${authorToSubmitId}`);
            } else {
                throw new Error("Failed to update post.");
            }
        } else {
            const postData: CreatePostInput = {
                title,
                content: editor.getHTML(),
                excerpt: formData.excerpt, 
                categorySlug: formData.categorySlug,
                authorId: authorToSubmitId,
                imageUrl: formData.coverImageDataUri, 
                status: isForAdmin ? 'accepted' : 'pending', 
            };
            const newPost = await createPost(postData);
            if (newPost) {
                toast({ title: "Post Submitted!", description: `"${newPost.title}" ${newPost.status === 'pending' ? 'submitted for review' : 'published'}.` });
                if (isForAdmin) router.push(`/admin/blogs`); 
                else router.push(`/posts/${newPost.id}/${generateSlug(newPost.title)}`);
            } else throw new Error("Failed to create post.");
        }
        // Reset form state for new post or after edit
        setTitle(''); 
        if(titleTextareaRef.current) {
          titleTextareaRef.current.value = '';
          titleTextareaRef.current.style.height = 'auto'; 
        }
        editor.commands.setContent(''); 
        setIsPostSubmissionPopupOpen(false);
        setCurrentEditingPostId(null);
        setInitialPostDataForEdit(null);
        setFirstImageFromContentForPopup(null);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        if (errorMessage.toLowerCase().includes("blocked")) {
            toast({ title: "Action Failed", description: "Your account has been suspended.", variant: "destructive" });
        } else {
            toast({ title: currentEditingPostId ? "Update Failed" : "Submission Failed", description: String(error), variant: "destructive" });
        }
    }
  };



  const handleLinkInsert = (linkText: string, linkUrl: string) => {
    if (!editor) return;
    let fullUrl = linkUrl;
    if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) fullUrl = 'https://' + linkUrl;
    const textToUse = linkText.trim() || fullUrl;
    
    const chain = editor.chain().focus();
    if (editor.state.selection.empty) {
        chain.insertContent({ type: 'text', text: textToUse, marks: [ { type: 'link', attrs: { href: fullUrl, target: '_blank', rel: 'noopener noreferrer nofollow' } } ] });
    } else {
        chain.extendMarkRange('link').setLink({ href: fullUrl, target: '_blank', rel: 'noopener noreferrer nofollow' });
    }
    chain.run();
    setIsLinkPopupOpen(false);
  };
  
  const handleQuickInsertCommand = (command: string) => {
    if (!editor) return;
    editor.commands.focus(); 
    switch (command) {
      case 'insertImage': setIsImagePopupOpen(true); break;
      case 'insertLink': setIsLinkPopupOpen(true); break;
      case 'insertEmbed': setIsEmbedPopupOpen(true); break;
      case 'horizontalRule': editor.chain().focus().setHorizontalRule().run(); break;
      default: break;
    }
    setIsQuickInsertMenuOpen(false); 
  };

    const handleFormattingCommand = (command: string) => {
    if (!editor) return;

    switch (command) {
      case 'insertImage': setIsImagePopupOpen(true); break;
      case 'insertLink': setIsLinkPopupOpen(true); break;
      case 'insertEmbed': setIsEmbedPopupOpen(true); break;
      case 'horizontalRule': editor.chain().focus().setHorizontalRule().run(); break;
      default: break; 
    }
    
    if (command !== 'insertImage' && command !== 'insertLink' && command !== 'insertEmbed') {
        setIsQuickInsertMenuOpen(false); 
        setShowQuickInsertButton(false);
    }
  };

const handleEmbedInsert = async (embedUrl: string) => {
  if (!editor || !embedUrl.trim()) return;

  const res = await fetch('/api/fetchLinkPreview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: embedUrl }),
  })

  const result = await res.json()

  if (result.success) {
    const { title, description, image, url } = result.preview

    editor
  .chain()
  .focus()
  .insertContent([
    {
      type: 'linkPreview',
      attrs: {
        title,
        description,
        image,
        url,
      },
    },
    {
      type: 'paragraph',
      content: [],
    },
  ])
  .scrollIntoView()
  .run();


    toast({ title: 'Link Preview Added', description: `Preview inserted for ${url}` })
  } else {
    editor.chain().focus().insertContent(`<p><a href="${embedUrl}">${embedUrl}</a></p>`).run()
    toast({ title: 'Fallback Link Inserted', description: 'Could not fetch preview.' })
  }

  setIsEmbedPopupOpen(false)
  setIsQuickInsertMenuOpen(false)
  setShowQuickInsertButton(false)
}


const isFullUser = (author: User | UserSummary): author is User =>
  "firstName" in author && "lastName" in author;

const authorForHeader = isForAdmin ? adminSelectedAuthor : user;
const currentAuthorId = isForAdmin ? adminSelectedAuthor?.id : user?.id;
const editorHasContent = editor && !editor.isEmpty;


  if ((authIsLoading && !isForAdmin && !currentEditingPostId) || isLoadingPostForEdit) {
      return <div className="flex-grow flex items-center justify-center h-[calc(100vh-130px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!user && !isForAdmin && !currentEditingPostId) { 
      return <div className="flex-grow flex items-center justify-center h-[calc(100vh-130px)]"><p>Redirecting to signup...</p></div>;
  }


  const handleTitleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    textarea.style.height = 'auto'; // Reset height to recalculate
    textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    setTitle(textarea.value);
  };
  
  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in title
      editor?.commands.focus(); // Move focus to editor
      
    }
    // Shift+Enter will behave normally (new line in textarea)
  };

  return (
    <div
    className={cn(
      "flex flex-col h-full",
      isForAdmin ? "flex-grow" : " px-0 min-h-screen"
    )}
  >
    {!isForAdmin && authorForHeader && (
      <div className="bg-card border-b sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-black">
            <Newspaper className="h-6 w-6 text-black" /> CardFeed
          </Link>
          <div className="flex items-center gap-2">
            <p className="text-sm  text-muted-foreground hidden sm:block">
              {currentEditingPostId ? 'Editing in ' : 'Draft in '}
              {isFullUser(authorForHeader)
                ? `${authorForHeader.firstName} ${authorForHeader.lastName}`
                : authorForHeader.name}
              {isDraftSaved && (
                <span className="text-xs text-green-600 flex items-center">
                  <Check className="h-3 w-3 mr-0.5" />
                  Saved
                </span>
              )}
            </p>

            <Button
              variant="ghost"
              size="sm"
              className=" rounded-xl bg-green-400 hover:bg-green-700 text-white"
              onClick={handlePublishClick}
              disabled={!title.trim() || !editorHasContent}>
              {currentEditingPostId ? 'Update' : 'Publish'}
            </Button>

         
              <Button variant="ghost" size="icon" className="rounded-full relative" asChild>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Link>
              </Button>
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.profileImageUrl || undefined } alt={user.firstName}  className="object-cover"/>
                        <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.id}`}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>
      </div>
    )}


      {!isForAdmin && <FormattingToolbar editor={editor} isForAdmin={isForAdmin} onCommand={handleFormattingCommand}/>}

      <div className={cn("flex-grow w-full relative", !isForAdmin && "bg-white px-3 sm:py-2 lg:py-4 md:py-6", isForAdmin && "bg-white overflow-y-auto p-4 flex-grow")}>
        <div ref={editorContentWrapperRef} className={cn("max-w-2xl mx-auto relative", isForAdmin && "")}>
          {showQuickInsertButton && editor && (
            <div
              data-quick-insert-button
              className="absolute flex items-center gap-1 z-20" 
              style={{ 
                left: isForAdmin ? '-30px' : '-60px', 
                top: quickInsertButtonTop !== null ? `${quickInsertButtonTop}px` : '0px', 
              }}
            >
              <Button
                data-quick-insert-menu-item 
                variant="outline"
                size="icon"
                className="rounded-full h-8 w-8 shadow-md bg-background hover:bg-muted"
                onClick={() => {
                  setIsQuickInsertMenuOpen(!isQuickInsertMenuOpen);
                  if (blurTimeoutId) clearTimeout(blurTimeoutId); 
                  editor?.commands.focus();
                }}
                onMouseDown={(e) => { e.preventDefault(); editor?.commands.focus();}} 
              >
                {isQuickInsertMenuOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
              {isQuickInsertMenuOpen && (
                <div data-quick-insert-menu className="flex items-center gap-1 p-1 bg-card border rounded-lg shadow-md">
                  {[
                    { cmd: 'insertImage', title: 'Add Image', icon: ImagePlusIcon },
                    { cmd: 'insertLink', title: 'Add Link', icon: LinkIcon },
                    { cmd: 'insertEmbed', title: 'Add Embed', icon: Code2 },
                    { cmd: 'horizontalRule', title: 'Horizontal Rule', icon: Minus },                    
                  ].map(item => (
                    <Button 
                      key={item.cmd} 
                      data-quick-insert-menu-item
                      variant="ghost" 
                      size="icon" 
                      title={item.title} 
                      onClick={() => handleQuickInsertCommand(item.cmd)}
                      onMouseDown={(e) => { e.preventDefault(); editor?.commands.focus();}}
                    >
                      <item.icon className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            ref={titleTextareaRef}
            placeholder="Title"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            className="text-3xl sm:text-4xl font-bold w-full border-none focus:outline-none focus:ring-0 py-2 mb-4 placeholder-muted-foreground/50 bg-transparent resize-none overflow-hidden"
            disabled={isForAdmin && !currentAuthorId}
            rows={1} // Start with one row, auto-resize will handle more
          />
          <EditorContent editor={editor} />
        </div>
      </div>

      {isForAdmin && currentAuthorId && (
        <div className="p-4 border-t bg-card sticky bottom-0 z-10">
          <Button onClick={handlePublishClick} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={!title.trim() || (editor?.isEmpty ?? true) || !currentAuthorId}>
            {currentEditingPostId ? 'Update Post' : 'Publish Post'}</Button>
        </div>
      )}

      <PostSubmissionPopup 
        isOpen={isPostSubmissionPopupOpen} 
        onClose={() => setIsPostSubmissionPopupOpen(false)} 
        postTitle={title} 
        postContent={editor?.getText() || ''} // Pass text content for default excerpt
        categories={allCategories} 
        onSubmit={handleFinalSubmit}
        authorSummary={isForAdmin ? adminSelectedAuthor : (user ? {id: user.id, name: `${user.firstName} ${user.lastName}`, imageUrl: user.profileImageUrl} : null)}
        initialPreviewImageFromContent={firstImageFromContentForPopup|| initialPostDataForEdit?.imageUrl || null}
        initialCategorySlug={initialPostDataForEdit?.category}
        initialExcerpt={initialPostDataForEdit?.excerpt}
        isEditing={!!currentEditingPostId}
       />
      <AddImagePopup
        isOpen={isImagePopupOpen}
        onClose={() => setIsImagePopupOpen(false)}
        onSubmit={(alt, dataUri) => {
          // optional tracking if you need
          setIsImagePopupOpen(false);
        }}
        editor={editor}
      />
     <AddLinkPopup 
        isOpen={isLinkPopupOpen} 
        onClose={() => { setIsLinkPopupOpen(false); if(editor) editor.commands.focus();}} 
        onSubmit={handleLinkInsert} 
      />
      <AddEmbedPopup
        isOpen={isEmbedPopupOpen}
        onClose={() => { setIsEmbedPopupOpen(false); if (editor) editor.commands.focus(); }}
        onSubmit={handleEmbedInsert}
      />
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background"> 
      <Suspense fallback={<main className="flex-grow flex items-center justify-center h-[calc(100vh-130px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></main>}>
        <CreatePostContent /> 
      </Suspense>
    </div>
  );
}
