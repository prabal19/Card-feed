// src/app/admin/blogs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Post } from '@/types';
import { getAllPostsForAdmin } from '@/app/actions/post.actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';

function BlogTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Image</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-center">Interactions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-16 w-24 rounded-md object-cover" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="space-y-1 text-center">
                <Skeleton className="h-3 w-12 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      try {
        const fetchedPosts = await getAllPostsForAdmin();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Failed to fetch posts for admin:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Blogs List</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <BlogTableSkeleton />
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No blog posts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Likes</TableHead>
                  <TableHead className="text-center">Comments</TableHead>
                  <TableHead className="text-center">Shares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        width={80}
                        height={64}
                        className="rounded-md object-cover h-16 w-20"
                        data-ai-hint="blog post thumbnail"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                        <Link href={`/posts/${post.id}/${generateSlug(post.title)}`} className="hover:text-primary hover:underline">
                         {post.title}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/profile/${post.author.id}`} className="hover:text-primary hover:underline">
                            {post.author.name}
                        </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.category}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(post.date), 'PPP')}</TableCell>
                    <TableCell className="text-center">{post.likes}</TableCell>
                    <TableCell className="text-center">{post.comments.length}</TableCell>
                    <TableCell className="text-center">{post.shares}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
