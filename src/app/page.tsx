// src/app/page.tsx
'use client'; // Keep 'use client' for useState, useEffect, and event handlers

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppHeader as AppHeaderComponent } from '@/components/layout/header';
import { BlogCard } from '@/components/blog/blog-card';
import { TrendingSidebar } from '@/components/blog/trending-sidebar';
import { PopularCategories } from '@/components/blog/popular-categories';
import { Button } from '@/components/ui/button';
import { categories as staticCategories } from '@/lib/data';
import type { Post, Category } from '@/types';
import { PlusCircle, Loader2 } from 'lucide-react';
import { getPosts, getCategoriesWithCounts } from '@/app/actions/post.actions'; // Import server action

const POSTS_PER_PAGE = 8;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ category: string, count: number }>>([]);

  // This selectedCategory state might be used for future category filtering.
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
      // Handle error state in UI if necessary
    } finally {
      if (loadMore) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  };
  
  const fetchCategoryData = async () => {
    try {
      const catCounts = await getCategoriesWithCounts();
      setDynamicCategories(catCounts);
    } catch (error) {
      console.error("Failed to fetch category counts:", error);
    }
  };

  useEffect(() => {
    fetchPosts(1);
    fetchCategoryData();
  }, [selectedCategory]); // Refetch when category changes

  const handleLoadMore = () => {
    if (hasMorePosts && !isLoadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Memoize trending posts based on likes from the fetched posts
  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [posts]);

  const popularCategoriesData = useMemo(() => {
    // Map dynamic category counts to the structure PopularCategories expects
    return staticCategories.map(sc => {
      const dynamicCat = dynamicCategories.find(dc => dc.category === sc.slug);
      return {
        ...sc,
        postCount: dynamicCat ? dynamicCat.count : 0,
      };
    }).sort((a,b) => b.postCount - a.postCount);
  }, [dynamicCategories, staticCategories]);


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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar: Create Post & Popular Categories (PopularCategories hidden on <lg screens, moved to drawer) */}
          <aside className="w-full lg:w-1/4 space-y-6 order-1 lg:sticky lg:top-[calc(theme(spacing.4)_+_65px_+_env(safe-area-inset-top))] h-fit"> {/* Adjusted sticky top */}
            <Link href="/create-post" passHref>
              <Button className="w-full rounded-3xl">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Post
              </Button>
            </Link>
            <div className="hidden lg:block">
              <PopularCategories categories={popularCategoriesData} />
            </div>
          </aside>

          {/* Middle Content: Ask/Share Input (hidden on <lg screens), Blog Feed, Load More */}
          <section className="w-full lg:w-2/4 order-2 flex flex-col gap-6">
            
            
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {posts.map((post: Post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
                className="mt-8 self-center text-black bg-green-300 hover:bg-green-400"
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

          {/* Right Sidebar: Trending Posts */}
          <aside className="w-full lg:w-1/4 order-3 lg:sticky lg:top-[calc(theme(spacing.4)_+_65px_+_env(safe-area-inset-top))] h-fit"> {/* Adjusted sticky top */}
            <TrendingSidebar trendingPosts={trendingPosts} />
          </aside>
        </div>
      </main>
    </div>
  );
}
