// src/components/create-post/add-link-popup.tsx
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
import { Loader2, Link as LinkIcon } from 'lucide-react';

interface AddLinkPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (linkText: string, linkUrl: string) => void;
}

export function AddLinkPopup({ isOpen, onClose, onSubmit }: AddLinkPopupProps) {
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleActualSubmit = async () => {
    if (!linkUrl.trim()) {
      toast({
        title: "Link URL Required",
        description: "Please enter the URL for the link.",
        variant: "destructive",
      });
      return;
    }
    if (!linkText.trim()) {
      // Default link text to URL if not provided
      setLinkText(linkUrl); 
    }

    setIsSubmitting(true);
    try {
      // Use linkText state if it's set, otherwise default to linkUrl for the text
      await onSubmit(linkText.trim() || linkUrl.trim(), linkUrl.trim());
      // onSubmit in parent should call onClose and reset form if successful
    } catch (error) {
       console.error("Error in AddLinkPopup submit:", error);
       toast({ title: "Error", description: "Could not process link information.", variant: "destructive"});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state when dialog is closed externally or by cancel button
      setLinkText('');
      setLinkUrl('');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
          <DialogDescription>
            Enter the text you want to display for the link and its URL.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link-text" className="text-right col-span-1">
              Link Text
            </Label>
            <Input
              id="link-text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Visit our website"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link-url" className="text-right col-span-1">
              URL
            </Label>
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="col-span-3"
              placeholder="e.g., example.com"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleActualSubmit} disabled={isSubmitting || !linkUrl.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" /> Add Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
