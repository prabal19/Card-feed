// src/app/search/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { BlogCard } from '@/components/blog/blog-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, SearchX } from 'lucide-react';
import type { Post, User } from '@/types';
import { searchPostsByTitleOrContent } from '@/app/actions/post.actions';
import { searchUsersByName } from '@/app/actions/user.actions';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      if (!query) {
        setPosts([]);
        setUsers([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [postResults, userResults] = await Promise.all([
          searchPostsByTitleOrContent(query),
          searchUsersByName(query),
        ]);
        setPosts(postResults);
        setUsers(userResults);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setPosts([]);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [query]);

  if (isLoading) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8 pt-28 md:pt-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

  if (!query) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8 pt-28 md:pt-8 text-center min-h-[calc(100vh-200px)]">
        <h1 className="text-2xl font-semibold mb-4">Search CardFeed</h1>
        <p className="text-muted-foreground">Enter a term in the search bar above to find posts and authors.</p>
      </main>
    );
  }

  const noResults = posts.length === 0 && users.length === 0;

  return (
    <main className="flex-grow container mx-auto px-4 py-8 pt-28 md:pt-8">
      <h1 className="text-3xl font-bold mb-8 text-primary">
        Search Results for: <span className="text-foreground">&quot;{query}&quot;</span>
      </h1>

      {noResults && (
        <div className="text-center py-12">
          <SearchX className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
          <p className="text-muted-foreground">
            We couldn&apos;t find any posts or authors matching your search. Try a different term.
          </p>
        </div>
      )}

      {users.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-primary border-b pb-2">Authors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user) => (
              <Link key={user.id} href={`/profile/${user.id}`} passHref>
                <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                  <CardContent className="p-4 flex flex-col items-center text-center flex-grow">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                      <AvatarImage src={user.profileImageUrl || `https://picsum.photos/seed/${user.id}/100/100`} alt={`${user.firstName} ${user.lastName}`} data-ai-hint="author profile large"/>
                      <AvatarFallback className="text-3xl">{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg mb-1">{user.firstName} {user.lastName}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate w-full">{user.email}</p>
                    {user.description && <CardDescription className="text-xs mt-2 text-muted-foreground line-clamp-2">{user.description}</CardDescription>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-primary border-b pb-2">Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Display 2 posts per row on md screens and up */}
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <Suspense fallback={
        <main className="flex-grow container mx-auto px-4 py-8 pt-28 md:pt-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      }>
        <SearchResultsContent />
      </Suspense>
      {/* Footer is now part of RootLayout, no need to add it here explicitly if SearchPage is a top-level route */}
    </div>
  );
}
