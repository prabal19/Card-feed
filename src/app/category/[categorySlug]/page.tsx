// src/app/category/[categorySlug]/page.tsx
'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { BlogCard } from '@/components/blog/blog-card';
import { Button } from '@/components/ui/button';
import { Loader2, Tag, LayoutGrid, PlusCircle } from 'lucide-react';
import type { Post } from '@/types';
import { getPosts, getCategoriesWithCounts } from '@/app/actions/post.actions';
import { categories as staticCategories } from '@/lib/data';
import { PopularCategories } from '@/components/blog/popular-categories';
import { TrendingSidebar } from '@/components/blog/trending-sidebar';
import { BlogCardSkeleton } from '@/components/blog/blog-card-skeleton'; // Import skeleton

const POSTS_PER_PAGE = 8;

function CategoryPageContent() {
  const params = useParams<{ categorySlug: string }>();
  const categorySlug = params.categorySlug;

  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const categoryName = useMemo(() => {
    const foundCategory = staticCategories.find(cat => cat.slug === categorySlug);
    return foundCategory ? foundCategory.name : categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }, [categorySlug]);

  const fetchCategoryPosts = async (page: number, loadMore = false) => {
    if (!categorySlug) return;

    if (loadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const { posts: newPosts, hasMore } = await getPosts(page, POSTS_PER_PAGE, categorySlug);
      setPosts(prevPosts => loadMore ? [...prevPosts, ...newPosts] : newPosts);
      setHasMorePosts(hasMore);
      // Update current page if new posts were loaded or it's an initial load (page 1)
      // This ensures currentPage reflects the page number of the displayed posts.
      if (newPosts.length > 0 || page === 1) {
        setCurrentPage(page);
      }
    } catch (error) {
      console.error(`Failed to fetch posts for category ${categorySlug}:`, error);
      // Optionally set an error state to display to the user
    } finally {
      if (loadMore) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  };

  useEffect(() => {
    if (categorySlug) {
      // Reset state for new category
      setPosts([]);
      setCurrentPage(1); // Important to reset to 1 for fetchCategoryPosts
      setHasMorePosts(true);
      setIsLoading(true); // Ensure loading state is true for initial fetch
      fetchCategoryPosts(1);
    }
  }, [categorySlug]); // Dependency on categorySlug ensures this runs when category changes

  if (isLoading && currentPage === 1 && posts.length === 0) {
    // Initial loading state: Show skeleton cards
    return (
      <>
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-bold text-primary flex items-center justify-center md:justify-start">
            <Tag className="mr-3 h-10 w-10" />
            Category: {categoryName}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(4)].map((_, index) => ( // Show 4 skeleton cards, for example
            <BlogCardSkeleton key={index} />
          ))}
        </div>
      </>
    );
  }
  
  if (!isLoading && posts.length === 0) {
    // Loaded, but no posts found
    return (
      <>
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-bold text-primary flex items-center justify-center md:justify-start">
            <Tag className="mr-3 h-10 w-10" />
            Category: {categoryName}
          </h1>
        </div>
        <div className="text-center py-12 min-h-[300px] flex flex-col justify-center items-center">
           <LayoutGrid className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No posts found in this category yet.</h2>
          <p className="text-muted-foreground">
            Check back later or explore other <Link href="/" className="text-primary hover:underline">categories</Link>.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-bold text-primary flex items-center justify-center md:justify-start">
          <Tag className="mr-3 h-10 w-10" />
          Category: {categoryName}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6"> {/* Changed to single column layout */}
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {hasMorePosts && (
        <div className="text-center mt-12">
          <Button
            onClick={() => fetchCategoryPosts(currentPage + 1, true)}
            variant="outline"
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
        </div>
      )}
    </>
  );
}


export default function CategoryPage() {
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ category: string, count: number }>>([]);
  const [trendingPostsData, setTrendingPostsData] = useState<Post[]>([]);
  const [isLoadingSidebars, setIsLoadingSidebars] = useState(true);

  useEffect(() => {
    async function fetchSidebarData() {
      setIsLoadingSidebars(true);
      try {
        const [catCounts, trending] = await Promise.all([
          getCategoriesWithCounts(),
          getPosts(1, 5) // Fetch 5 trending posts
        ]);
        setDynamicCategories(catCounts);
        setTrendingPostsData(trending.posts);
      } catch (error) {
        console.error("Failed to fetch sidebar data for category page:", error);
      } finally {
        setIsLoadingSidebars(false);
      }
    }
    fetchSidebarData();
  }, []);

  const popularCategoriesForSidebar = useMemo(() => {
    return staticCategories.map(sc => {
      const dynamicCat = dynamicCategories.find(dc => dc.category === sc.slug);
      return {
        ...sc,
        postCount: dynamicCat ? dynamicCat.count : 0,
      };
    }).sort((a,b) => b.postCount - a.postCount);
  }, [dynamicCategories]);


    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader popularCategoriesData={popularCategoriesForSidebar} />
            <main className="flex-grow container mx-auto px-4 py-8 pt-28 md:pt-8">
                 <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar: Create Post & Popular Categories */}
                    <aside className="w-full lg:w-1/4 space-y-6 order-1 lg:sticky lg:top-[calc(theme(spacing.4)_+_65px_+_env(safe-area-inset-top))] h-fit">
                        <Link href="/create-post" passHref>
                        <Button className="w-full">
                            <PlusCircle className="mr-2 h-5 w-5" /> Create Post
                        </Button>
                        </Link>
                        {isLoadingSidebars ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-md animate-pulse"></div>)}
                            </div>
                        ) : (
                           <div className="hidden lg:block">
                             <PopularCategories categories={popularCategoriesForSidebar} />
                           </div>
                        )}
                    </aside>

                    {/* Middle Content: Category Posts Feed */}
                    <section className="w-full lg:w-2/4 order-2 lg:order-2 flex flex-col gap-6">
                        <Suspense fallback={
                            <div className="flex items-center justify-center min-h-[calc(100vh-400px)] py-10">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        }>
                            <CategoryPageContent />
                        </Suspense>
                    </section>

                    {/* Right Sidebar: Trending Posts */}
                     <aside className="w-full lg:w-1/4 order-3 lg:order-3 lg:sticky lg:top-[calc(theme(spacing.4)_+_65px_+_env(safe-area-inset-top))] h-fit">
                         {isLoadingSidebars ? (
                             <div className="space-y-2">
                                <div className="h-10 bg-muted rounded-md animate-pulse mb-2"></div>
                                {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-md animate-pulse"></div>)}
                            </div>
                         ) : (
                            <TrendingSidebar trendingPosts={trendingPostsData} />
                         )}
                    </aside>
                </div>
            </main>
            {/* Footer is in RootLayout */}
        </div>
    );
}
