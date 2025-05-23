
// src/components/blog/post-submission-popup.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category, UserSummary } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImageUp, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context'; 

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface PostSubmissionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
  postContent: string; 
  categories: Category[];
  onSubmit: (formData: { coverImageDataUri: string; categorySlug: string; excerpt: string }) => Promise<void> | void;
  authorSummary?: UserSummary | null; 
}

export function PostSubmissionPopup({
  isOpen,
  onClose,
  postTitle,
  postContent,
  categories,
  onSubmit,
  authorSummary,
}: PostSubmissionPopupProps) {
  const { user: loggedInUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [coverImageDataUri, setCoverImageDataUri] = useState<string | null>(null);
  const [previewSubtitle, setPreviewSubtitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const authorToDisplay = authorSummary || loggedInUser;

  useEffect(() => {
    if (isOpen) {
      if (postContent && !previewSubtitle) {
        const defaultExcerpt = postContent.substring(0, 150) + (postContent.length > 150 ? '...' : '');
        setPreviewSubtitle(defaultExcerpt);
      }
    }
  }, [isOpen, postContent, previewSubtitle]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Image Too Large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        setCoverImageDataUri(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverImageDataUri(null);
    }
  };

  const handleActualSubmit = async () => {
    if (!selectedCategory) {
      toast({
        title: "Category Required",
        description: "Please select a category for your post.",
        variant: "destructive",
      });
      return;
    }
    if (!previewSubtitle.trim()) {
         toast({
        title: "Preview Subtitle Required",
        description: "Please write a short preview subtitle.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        coverImageDataUri: coverImageDataUri || '',
        categorySlug: selectedCategory,
        excerpt: previewSubtitle.trim(),
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedCategory(undefined);
      setCoverImageDataUri(null);
      setPreviewSubtitle('');
      setIsSubmitting(false);
      const fileInput = document.getElementById('cover-image-upload-popup') as HTMLInputElement; // Ensure unique ID
      if (fileInput) fileInput.value = '';
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
        </DialogHeader>
        <div className="grid md:grid-cols-[2fr_1fr] gap-8 p-6 pt-2">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Story Preview</h3>
              <label
                htmlFor="cover-image-upload-popup"
                className="mt-1 flex justify-center items-center w-full h-48 border-2 border-border border-dashed rounded-md cursor-pointer hover:border-primary transition-colors bg-muted/30 relative overflow-hidden"
              >
                {coverImageDataUri ? (
                  <Image 
                    src={coverImageDataUri} 
                    alt="Cover preview" 
                    layout="fill"
                    objectFit="cover" // Ensures the image covers the area, maintaining aspect ratio
                    className="rounded-md"
                    data-ai-hint="cover preview"
                  />
                ) : (
                  <div className="space-y-1 text-center p-6">
                    <ImageUp className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Include a high-quality image in your story (Max 5MB).
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF</p>
                  </div>
                )}
              </label>
              <Input id="cover-image-upload-popup" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" disabled={isSubmitting} />
            </div>

            <div>
              <Label htmlFor="preview-title-popup" className="text-base font-semibold text-foreground">Write a preview title</Label>
              <Input id="preview-title-popup" value={postTitle} readOnly className="mt-1 bg-muted cursor-not-allowed" />
            </div>

            <div>
              <Label htmlFor="preview-subtitle-popup" className="text-base font-semibold text-foreground">Write a preview subtitle...</Label>
              <Textarea
                id="preview-subtitle-popup"
                value={previewSubtitle}
                onChange={(e) => setPreviewSubtitle(e.target.value)}
                placeholder="Write a short preview of your story..."
                className="mt-1 min-h-[80px]"
                maxLength={200}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">{previewSubtitle.length}/200 characters</p>
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Changes here will affect how your story appears in public places like CardFeed&apos;s homepage.
            </p>
          </div>

          <div className="space-y-6">
            <p className="text-sm text-foreground">
              Publishing to: <span className="font-semibold text-primary">CardFeed Community</span>
            </p>
            
            <div>
              <Label htmlFor="category-select-popup" className="text-sm font-medium text-foreground">
                Add a topic so readers know what your story is about
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isSubmitting}>
                <SelectTrigger id="category-select-popup-trigger" className="mt-1 w-full">
                  <SelectValue placeholder="Add a topic..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground"> 
              Learn more about what happens to your post when you publish.
            </p>

            <div className="flex items-center gap-4">
              <Button 
                type="button" 
                onClick={handleActualSubmit} 
                disabled={isSubmitting || !selectedCategory || !previewSubtitle.trim()}
                className="bg-green-600 hover:bg-green-700 text-white flex-grow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4"/>
                     Publish now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
