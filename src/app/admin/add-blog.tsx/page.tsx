// src/app/admin/add-blog/page.tsx
'use client';

import { CreatePostContent } from '@/app/create-post/page'; // Import the content part
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminAddBlogPage() {
  return (
    // The AdminLayout will provide the overall structure including the sidebar
    // We only need to render the core content creation UI here.
    <Suspense fallback={<div className="flex-grow flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <CreatePostContent isForAdmin={true} />
    </Suspense>
  );
}
