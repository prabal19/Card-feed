
// src/app/admin/add-blog/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePostContent } from '@/app/create-post/page'; 
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import type { UserSummary } from '@/types'; 
import { Button } from '@/components/ui/button';
import { UserPlus, Users, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddNewAuthorDialog } from '@/components/admin/add-new-author-dialog';
import { SelectExistingAuthorDialog } from '@/components/admin/select-existing-author-dialog';
import { Separator } from '@/components/ui/separator';

export default function AdminAddBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: adminUserFromAuthContext, isLoading: authIsLoading, isAdmin } = useAuth();

  const [selectedAuthor, setSelectedAuthor] = useState<UserSummary | null>(null);
  const [isAddNewAuthorDialogOpen, setIsAddNewAuthorDialogOpen] = useState(false);
  const [isSelectExistingAuthorDialogOpen, setIsSelectExistingAuthorDialogOpen] = useState(false);

  useEffect(() => {
    if (!authIsLoading && !isAdmin) {
      toast({ title: "Unauthorized", description: "You are not authorized to access this page.", variant: "destructive" });
      router.push('/admin');
    }
  }, [isAdmin, authIsLoading, router, toast]);
  
  const handleAuthorSelected = (author: UserSummary) => {
    setSelectedAuthor(author);
    setIsAddNewAuthorDialogOpen(false);
    setIsSelectExistingAuthorDialogOpen(false);
  };

  if (authIsLoading) {
    return <div className="flex-grow flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!isAdmin) {
      return <div className="flex-grow flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2">Verifying admin access...</p></div>;
  }


  return (
    <div className="flex flex-col h-full">
      <div className="bg-card p-4 border-b sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-primary mb-4">Add New Blog Post (Admin)</h1>
        
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-3 text-foreground">1. Choose Author for this Post</h2>
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
      </div>
      
      <Separator className="my-0" />

      <div className={!selectedAuthor ? "opacity-50 pointer-events-none flex-grow overflow-y-auto" : "flex-grow overflow-y-auto"}>
        {selectedAuthor ? (
          <Suspense fallback={<div className="flex-grow flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <CreatePostContent isForAdmin={true} adminSelectedAuthor={selectedAuthor} /> 
          </Suspense>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>Please select or add an author above before creating the blog post.</p>
          </div>
        )}
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
    </div>
  );
}

