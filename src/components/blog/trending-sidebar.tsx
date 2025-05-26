
import type { Post } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, UserCircle } from 'lucide-react'; 
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateSlug } from '@/lib/utils';

interface TrendingSidebarProps {
  trendingPosts: Post[]; 
}

export function TrendingSidebar({ trendingPosts }: TrendingSidebarProps) {
  const topTrending = trendingPosts.slice(0, 5);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topTrending.length > 0 ? (
          <ul className="space-y-0">
            {topTrending.map((post) => (
              <li 
                key={post.id} 
                className="flex items-start gap-3 p-3 border-b border-border last:border-b-0 rounded-md hover:bg-muted/50 transition-colors"
              >
                {post.imageUrl && post.imageUrl.startsWith('http') && (
                  <Link href={`/posts/${post.id}/${generateSlug(post.title)}`} passHref>
                    <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                      <Image 
                        src={post.imageUrl} 
                        alt={post.title} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="cursor-pointer object-cover"
                      />
                    </div>
                  </Link>
                )}
                {post.imageUrl && post.imageUrl.startsWith('data:image') && (
                   
                    <Link href={`/posts/${post.id}/${generateSlug(post.title)}`} passHref>
                      <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="cursor-pointer w-full h-full object-cover"
                      />
                      </div>
                    </Link>
                )}
                {!post.imageUrl && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                     <UserCircle className="h-8 w-8 text-muted-foreground" /> {/* Placeholder icon */}
                  </div>
                )}
                <div className="flex-grow">
                  <Link href={`/posts/${post.id}/${generateSlug(post.title)}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={post.author.imageUrl} alt={post.author.name} className="object-cover" />
                      <AvatarFallback>
                        {post.author.name ? post.author.name.charAt(0).toUpperCase() : <UserCircle className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${post.author.id}`} className="hover:underline">
                        {post.author.name}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(post.date).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No trending posts at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
}
