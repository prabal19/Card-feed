// src/components/blog/post-submission-popup.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PostSubmissionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
  categories: Category[];
  onSubmit: (formData: { coverImage?: File; categorySlug: string }) => Promise<void> | void;
}

export function PostSubmissionPopup({
  isOpen,
  onClose,
  postTitle,
  categories,
  onSubmit,
}: PostSubmissionPopupProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCoverImageFile(event.target.files[0]);
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
    setIsSubmitting(true);
    try {
      await onSubmit({ coverImage: coverImageFile, categorySlug: selectedCategory });
      // Parent's onSubmit should handle closing and resetting form if needed
      // Reset local state for next time popup opens (if parent doesn't unmount/re-key)
      // setSelectedCategory(undefined);
      // setCoverImageFile(undefined);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      // onClose will be called by the parent component's handleFinalSubmit
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state when dialog is closed externally
      setSelectedCategory(undefined);
      setCoverImageFile(undefined);
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalize Your Post</DialogTitle>
          <DialogDescription>
            Add a cover image and select a category for: "{postTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="post-title-popup" className="text-right col-span-1">
              Title
            </Label>
            <Input id="post-title-popup" value={postTitle} readOnly className="col-span-3 bg-muted" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cover-image" className="text-right col-span-1">
              Cover Image
            </Label>
            <Input 
              id="cover-image" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="col-span-3" 
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category-popup" className="text-right col-span-1">
              Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isSubmitting}>
              <SelectTrigger id="category-popup-trigger" className="col-span-3">
                <SelectValue placeholder="Select a category" />
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleActualSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Post'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
