import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CreatePostContent } from '@/components/create-post/create-post-content';

export default function CreatePostPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background"> 
      <Suspense fallback={<main className="flex-grow flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></main>}>
        <CreatePostContent /> 
      </Suspense>
    </div>
  );
}