// src/components/admin/select-existing-author-dialog.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { User, UserSummary } from '@/types';
import { searchUsersByName } from '@/app/actions/user.actions'; // Assuming this can filter by role or provider
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SelectExistingAuthorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorSelected: (author: UserSummary) => void;
}

// A simple debounce hook (you might want a more robust one or use a library)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


export function SelectExistingAuthorDialog({ isOpen, onClose, onAuthorSelected }: SelectExistingAuthorDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [authors, setAuthors] = useState<User[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchAuthors() {
      if (!isOpen) return; // Don't fetch if dialog is closed
      setIsLoading(true);
      try {
        // Fetch users with authProvider 'admin_created' or role 'user'.
        // searchUsersByName might need to be adapted or a new action created if specific filtering is needed.
        // For now, it searches all users and we'll rely on admin's discretion.
        const results = await searchUsersByName(debouncedSearchTerm); 
        // Filter client-side for 'user' role or 'admin_created' provider for better fit
        const suitableAuthors = results.filter(u => u.role === 'user' || u.authProvider === 'admin_created');
        setAuthors(suitableAuthors.slice(0, 20)); // Limit initial display
      } catch (error) {
        console.error("Error fetching authors:", error);
        toast({ title: "Error", description: "Could not fetch authors.", variant: "destructive" });
        setAuthors([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuthors();
  }, [debouncedSearchTerm, isOpen, toast]);

  const handleSelectAndChoose = () => {
    const authorToSelect = authors.find(a => a.id === selectedAuthorId);
    if (authorToSelect) {
      onAuthorSelected({
        id: authorToSelect.id,
        name: `${authorToSelect.firstName} ${authorToSelect.lastName}`,
        imageUrl: authorToSelect.profileImageUrl,
      });
      onClose();
    } else {
      toast({ title: "Selection Error", description: "Please select an author.", variant: "destructive" });
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchTerm('');
      setSelectedAuthorId(undefined);
      setAuthors([]); // Clear authors when dialog closes
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Existing Author</DialogTitle>
          <DialogDescription>
            Search and choose an existing user to be the author of this post.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search authors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[300px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : authors.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No authors found matching "{debouncedSearchTerm || 'your criteria'}". Try creating a new author.
              </p>
            ) : (
              <RadioGroup value={selectedAuthorId} onValueChange={setSelectedAuthorId} className="p-2">
                {authors.map((author) => (
                  <Label
                    key={author.id}
                    htmlFor={`author-${author.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted cursor-pointer transition-colors border border-transparent has-[>[data-state=checked]]:border-primary has-[>[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={author.id} id={`author-${author.id}`} className="shrink-0" />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={author.profileImageUrl || `https://picsum.photos/seed/${author.id}/36/36`} alt={author.firstName} data-ai-hint="author avatar small"/>
                      <AvatarFallback>{author.firstName?.charAt(0)}{author.lastName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-foreground">{author.firstName} {author.lastName}</p>
                      <p className="text-xs text-muted-foreground">{author.email}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSelectAndChoose} disabled={!selectedAuthorId || isLoading}>
            <Users className="mr-2 h-4 w-4" /> Choose Author
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
