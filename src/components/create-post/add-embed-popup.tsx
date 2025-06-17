// src/components/create-post/add-embed-popup.tsx
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Link as LinkIcon } from 'lucide-react'; // Using LinkIcon for embed URL

interface AddEmbedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (embedUrl: string) => void;
}

export function AddEmbedPopup({ isOpen, onClose, onSubmit }: AddEmbedPopupProps) {
  const [embedUrl, setEmbedUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleActualSubmit = async () => {
    if (!embedUrl.trim()) {
      toast({
        title: "Embed URL Required",
        description: "Please enter the URL for the content you want to embed.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic URL validation (you might want a more robust check)
    try {
      new URL(embedUrl); // Will throw error if invalid
    } catch (_) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(embedUrl.trim());
      // Parent's onSubmit should call onClose and reset form if successful
    } catch (error) {
       console.error("Error in AddEmbedPopup submit:", error);
       toast({ title: "Error", description: "Could not process embed information.", variant: "destructive"});
    } finally {
      setEmbedUrl('');
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setEmbedUrl('');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Embed</DialogTitle>
          <DialogDescription>
            Enter the URL of the content you want to embed (e.g., YouTube, Vimeo, Twitter).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="embed-url-popup" className="text-right col-span-1">
              Embed URL
            </Label>
            <Input
              id="embed-url-popup"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              className="col-span-3"
              placeholder="e.g., https://www.youtube.com/watch?v=..."
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleActualSubmit} disabled={isSubmitting || !embedUrl.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" /> Add Embed
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
