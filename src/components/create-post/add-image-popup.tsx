
// src/components/create-post/add-image-popup.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImagePlus, UploadCloud } from 'lucide-react';
import { Editor } from '@tiptap/react';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface AddImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (altText: string, dataUri?: string) => void;
  editor: Editor | null;
}

export function AddImagePopup({ isOpen, onClose, onSubmit ,editor }: AddImagePopupProps) {
  const [altText, setAltText] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Image Too Large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        setImageFile(undefined);
        setImagePreviewUri(null);
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(undefined);
      setImagePreviewUri(null);
    }
  };

  const handleActualSubmit = async () => {
    if (!imageFile) {
      toast({
        title: "Image File Required",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUri = reader.result as string;
           if (editor) {
    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: 'image',
          attrs: {
            src: dataUri,
            alt: altText.trim(),
          },
        },
        {
          type: 'paragraph',
          content: [],
        },
      ])
      .scrollIntoView()
      .run();
  }
          onSubmit(altText.trim(), dataUri);
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          toast({ title: "File Read Error", description: "Could not read the image file.", variant: "destructive"});
          setIsSubmitting(false);
        };
        reader.readAsDataURL(imageFile);
    } catch (error) {
       console.error("Error in AddImagePopup submit:", error);
       toast({ title: "Error", description: "Could not process image information.", variant: "destructive"});
       setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setAltText('');
      setImageFile(undefined);
      setImagePreviewUri(null);
      const fileInput = document.getElementById('image-file-popup') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]"> {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          <DialogDescription>
            Select an image to insert into your post. Max 5MB. Alt text is optional but recommended for accessibility.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="image-file-popup" className="text-sm font-medium">Image File</Label>
            <label
              htmlFor="image-file-popup"
              className="mt-1 flex justify-center items-center w-full h-40 border-2 border-border border-dashed rounded-md cursor-pointer hover:border-primary transition-colors bg-muted/30 relative overflow-hidden"
            >
              {imagePreviewUri ? (
                <Image 
                  src={imagePreviewUri} 
                  alt="Selected image preview" 
                  layout="fill"
                  objectFit="contain" 
                  className="rounded-md"
                  data-ai-hint="image preview"
                />
              ) : (
                <div className="space-y-1 text-center p-4">
                  <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Click to browse or drag & drop an image
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
            </label>
            <Input
              id="image-file-popup"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only" // Hidden, label triggers it
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <Label htmlFor="alt-text-popup" className="text-sm font-medium">Alt Text (Optional)</Label>
            <Input
              id="alt-text-popup"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="mt-1"
              placeholder="e.g., A cute cat playing"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleActualSubmit} disabled={isSubmitting || !imageFile}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                Add Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
