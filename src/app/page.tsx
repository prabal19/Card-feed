
// src/app/page.tsx
'use client'; // Keep 'use client' for useState, useEffect, and event handlers

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppHeader as AppHeaderComponent } from '@/components/layout/header';
import { BlogCard } from '@/components/blog/blog-card';
import { TrendingSidebar } from '@/components/blog/trending-sidebar';
import { PopularCategories } from '@/components/blog/popular-categories';
import { TopAuthorsSidebar } from '@/components/blog/top-authors-sidebar';
import { ResourcesSidebar } from '@/components/blog/resources-sidebar';
import { Button } from '@/components/ui/button';
import { categories as staticCategories } from '@/lib/data';
import type { Post, Category, TopAuthor } from '@/types';
import { PlusCircle, Loader2 } from 'lucide-react';
import { getPosts, getCategoriesWithCounts } from '@/app/actions/post.actions';
import { getTopAuthors } from '@/app/actions/user.actions';
import { Separator } from '@/components/ui/separator';

const POSTS_PER_PAGE = 8;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ category: string, count: number }>>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchPosts = async (page: number, loadMore = false) => {
    if (loadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const { posts: newPosts, hasMore } = await getPosts(page, POSTS_PER_PAGE, selectedCategory || undefined);
      setPosts(prevPosts => loadMore ? [...prevPosts, ...newPosts] : newPosts);
      setHasMorePosts(hasMore);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      if (loadMore) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  };
  
  const fetchSidebarData = async () => {
     try {
      const [catCounts, authors] = await Promise.all([
        getCategoriesWithCounts(),
        getTopAuthors(5)
      ]);
      setDynamicCategories(catCounts);
      setTopAuthors(authors);
    } catch (error) {
      console.error("Failed to fetch sidebar data:", error);
    }
  };

  useEffect(() => {
    fetchPosts(1);
    fetchSidebarData();
  }, [selectedCategory]);

  const handleLoadMore = () => {
    if (hasMorePosts && !isLoadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [posts]);

  const popularCategoriesData = useMemo(() => {
    return staticCategories.map(sc => {
      const dynamicCat = dynamicCategories.find(dc => dc.category === sc.slug);
      return {
        ...sc,
        postCount: dynamicCat ? dynamicCat.count : 0,
      };
    }).sort((a,b) => b.postCount - a.postCount);
  }, [dynamicCategories]);


  if (isLoading && currentPage === 1) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeaderComponent popularCategoriesData={popularCategoriesData} />
        <main className="flex-grow container mx-auto px-4 py-8 pt-28 md:pt-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeaderComponent popularCategoriesData={popularCategoriesData} />
      <main className="flex-grow container mx-auto px-4 py-8 pt-20 md:pt-8">
        <div className="grid grid-cols-12 gap-8 relative">
          
          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
             <div className="sticky top-20"> {/* Header height approx 5rem = 80px */}
                <div className="space-y-6 h-[calc(100vh-6rem)] overflow-y-auto pr-4">
                    <Link href="/create-post" passHref>
                        <Button className="w-full">
                            <PlusCircle className="mr-2 h-5 w-5" /> Create Post
                        </Button>
                    </Link>
                    <Separator />
                    <PopularCategories categories={popularCategoriesData} />
                    <Separator />
                    <ResourcesSidebar />
                </div>
            </div>
          </aside>

          {/* Separator */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-[25%] w-px bg-border"></div>

          {/* Main Content */}
          <section className="col-span-12 lg:col-span-6 flex flex-col gap-4">
            {posts.length > 0 ? (
              posts.map((post: Post) => (
                <BlogCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-12 border border-border">
                <h2 className="text-2xl font-semibold mb-2">No posts found</h2>
                <p className="text-muted-foreground">
                  Check back later for new content or try a different category!
                </p>
              </div>
            )}

            {hasMorePosts && (
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="mt-4 self-center"
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Posts'
                )}
              </Button>
            )}
          </section>

          {/* Separator */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-[75%] w-px bg-border"></div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
             <div className="sticky top-20"> {/* Header height approx 5rem = 80px */}
                <div className="space-y-6 h-[calc(100vh-6rem)] overflow-y-auto pl-4 overflow-x-hidden">
                    <TrendingSidebar trendingPosts={trendingPosts} />
                    <Separator />
                    <TopAuthorsSidebar authors={topAuthors} />
                </div>
             </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
