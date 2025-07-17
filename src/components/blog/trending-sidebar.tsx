// src/components/blog/trending-sidebar.tsx
'use client';

import type { Post } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug, formatDateAgo, formatNumber } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

interface TrendingSidebarProps {
  trendingPosts: Post[]; 
}

export function TrendingSidebar({ trendingPosts }: TrendingSidebarProps) {
  const topTrending = trendingPosts.slice(0, 5);

  return (
    <div className="bg-secondary p-4 rounded-lg">
      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-4">
        Trending Now
      </h3>
      <div>
        {topTrending.length > 0 ? (
          <ul className="space-y-4">
            {topTrending.map((post, index) => (
              <li key={post.id}>
                <Link 
                  href={`/posts/${post.id}/${generateSlug(post.title)}`}
                  className="flex items-start justify-between gap-3 p-2 -m-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {/* Meta info: Avatar, Author, Date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.author.imageUrl} alt={post.author.name} className="object-cover"/>
                        <AvatarFallback>{post.author.name?.substring(0, 1) || 'A'}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground hover:underline truncate">{post.author.name}</span>
                      <span className="flex-shrink-0">•</span>
                      <span className="truncate">{formatDateAgo(post.date)}</span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h4>

                    {/* Stats: Likes and Comments */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pt-1">
                      <span>{formatNumber(post.likes || 0)} likes</span>
                      <span>•</span>
                      <span>{formatNumber(post.comments.length)} comments</span>
                    </div>
                  </div>
                  
                  {/* Thumbnail */}
                  {post.imageUrl && (
                    <div className="relative w-16 h-16 bg-muted overflow-hidden shrink-0 rounded-md">
                      <Image 
                        src={post.imageUrl} 
                        alt={post.title} 
                        layout="fill" 
                        objectFit="cover"
                        data-ai-hint="post thumbnail" 
                      />
                    </div>
                  )}
                </Link>
                {index < topTrending.length - 1 && <Separator className="mt-4" />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No trending posts at the moment.</p>
        )}
      </div>
    </div>
  );
}
