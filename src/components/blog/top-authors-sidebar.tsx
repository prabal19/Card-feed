// src/components/blog/top-authors-sidebar.tsx
'use client';

import type { TopAuthor } from '@/types';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';

interface TopAuthorsSidebarProps {
  authors: TopAuthor[];
}

function TopAuthorsSkeleton() {
    return (
        <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-grow space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function TopAuthorsSidebar({ authors }: TopAuthorsSidebarProps) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">
        Top Authors
      </h3>
      <div>
        {!authors || authors.length === 0 ? (
          <TopAuthorsSkeleton />
        ) : (
          <ul className="space-y-1">
            {authors.map(({ author, postCount }) => (
              <li key={author.id}>
                <Link
                  href={`/profile/${author.id}`}
                  className="flex items-center gap-3 p-2 -ml-2 rounded-none hover:bg-accent transition-colors cursor-pointer group"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={author.imageUrl} alt={author.name} className="object-cover" />
                    <AvatarFallback>{author.name?.substring(0, 1) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{author.name}</p>
                    <p className="text-xs text-muted-foreground">{postCount} {postCount === 1 ? 'post' : 'posts'}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
