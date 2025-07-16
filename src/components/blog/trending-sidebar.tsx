// src/components/blog/trending-sidebar.tsx
'use client';

import type { Post } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

interface TrendingSidebarProps {
  trendingPosts: Post[]; 
}

export function TrendingSidebar({ trendingPosts }: TrendingSidebarProps) {
  const topTrending = trendingPosts.slice(0, 5);

  return (
    <div className="bg-secondary p-4 rounded-[12px]">
      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">
        Trending Now
      </h3>
      <div>
        {topTrending.length > 0 ? (
          <ul className="space-y-3">
            {topTrending.map((post, index) => (
              <li key={post.id}>
                <Link 
                  href={`/posts/${post.id}/${generateSlug(post.title)}`}
                  className="flex items-start gap-3 p-2 -m-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex-grow space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.author.imageUrl} alt={post.author.name} className="object-cover"/>
                        <AvatarFallback>{post.author.name?.substring(0, 1) || 'A'}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground hover:underline truncate">{post.author.name}</span>
                      <span>•</span>
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-base font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <span>{post.likes || 0} likes</span>
                      <span>•</span>
                      <span>{post.comments.length} comments</span>
                    </div>
                  </div>

                  {post.imageUrl && (
                    <div className="relative w-20 h-14 bg-muted overflow-hidden shrink-0 rounded-md">
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
                {index < topTrending.length - 1 && <Separator className="mt-3" />}
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
