import type { Post } from '@/types';
import { UserCircle } from 'lucide-react'; 
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface TrendingSidebarProps {
  trendingPosts: Post[]; 
}

export function TrendingSidebar({ trendingPosts }: TrendingSidebarProps) {
  const topTrending = trendingPosts.slice(0, 5);

  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">
        Trending Now
      </h3>
      <div>
        {topTrending.length > 0 ? (
          <ul className="space-y-0">
            {topTrending.map((post) => (
              <li key={post.id} >
                <Link 
                  href={`/posts/${post.id}/${generateSlug(post.title)}`}
                  className="flex items-start gap-3 p-3 -m-3 rounded-none hover:bg-accent transition-colors"
                >
                  {post.imageUrl ? (
                    <div className="relative w-24 h-16 bg-muted overflow-hidden shrink-0">
                      <Image 
                        src={post.imageUrl} 
                        alt={post.title} 
                        layout="fill" 
                        objectFit="cover" 
                      />
                    </div>
                  ) : (
                    <div className="relative w-24 h-16 bg-muted flex items-center justify-center shrink-0">
                       <UserCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-grow">
                    <p className="text-sm font-semibold hover:text-primary transition-colors line-clamp-3">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <span>{post.likes || 0} likes</span>
                      <span>•</span>
                      <span>{post.comments.length} comments</span>
                    </div>
                  </div>
                </Link>
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
