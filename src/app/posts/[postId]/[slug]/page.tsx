
import type { Metadata, ResolvingMetadata } from 'next'
import { AppHeader } from '@/components/layout/header';
import { TrendingSidebar } from '@/components/blog/trending-sidebar';
import { TopAuthorsSidebar } from '@/components/blog/top-authors-sidebar';
import { ResourcesSidebar } from '@/components/blog/resources-sidebar';
import { PopularCategories } from '@/components/blog/popular-categories';
import { Separator } from '@/components/ui/separator';
import { getPostById, getPosts, getCategoriesWithCounts } from '@/app/actions/post.actions';
import { getTopAuthors } from '@/app/actions/user.actions';
import { PostContent } from '@/components/post/post-content';
import { categories as staticCategories } from '@/lib/data';

type PageProps = {
  params: {
    postId: string;
    slug: string;
  };
  searchParams?: { [key: string]: string | string[] };
};

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const postId = params.postId
  const post = await getPostById(postId)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The post you are looking for does not exist.',
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const postImage = post.imageUrl || '/card.jpg';

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      authors: [post.author.name],
      images: [postImage, ...previousImages],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [postImage],
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  // Fetch all data for the page on the server
  const [initialPost, catCounts, topAuthors, trendingPostsResult] = await Promise.all([
    getPostById(params.postId),
    getCategoriesWithCounts(),
    getTopAuthors(5),
    getPosts(1, 5) // For trending sidebar
  ]);

  const popularCategoriesData = staticCategories.map(sc => {
    const dynamicCat = catCounts.find(dc => dc.category === sc.slug);
    return {
      ...sc,
      postCount: dynamicCat ? dynamicCat.count : 0,
    };
  }).sort((a, b) => b.postCount - a.postCount);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader popularCategoriesData={popularCategoriesData} />
      <main className="flex-grow container mx-auto px-4 py-8 pt-20 md:pt-8">
        <div className="flex justify-center gap-8">
            {/* Left Sidebar */}
            <aside className="hidden lg:block w-[270px] shrink-0">
               <div className="sticky top-20 space-y-6 h-[calc(100vh-6rem)] overflow-y-auto">
                  <PopularCategories categories={popularCategoriesData} />
                  <Separator />
                  <ResourcesSidebar />
              </div>
            </aside>

            {/* Main Content */}
            <section className="flex-grow max-w-2xl flex flex-col gap-4">
               <PostContent initialPost={initialPost} />
            </section>

            {/* Right Sidebar */}
            <aside className="hidden lg:block w-[310px] shrink-0">
               <div className="sticky top-20 space-y-6 h-[calc(100vh-6rem)] overflow-y-auto">
                  <TrendingSidebar trendingPosts={trendingPostsResult.posts} />
                  <Separator />
                  <TopAuthorsSidebar authors={topAuthors} />

               </div>
            </aside>
        </div>
      </main>
    </div>
  );
}
