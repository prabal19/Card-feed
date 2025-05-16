
// src/app/admin/blogs/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Post } from '@/types';
import { getAllPostsForAdmin, updatePostStatus } from '@/app/actions/post.actions';
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
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import Link from 'next/link';
import { generateSlug, cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarIcon, ChevronLeft, ChevronRight, XCircle, Copy, CheckCircle, AlertTriangle, XOctagon, Loader2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { categories as staticCategories } from '@/lib/data';

type PostStatus = 'accepted' | 'pending' | 'rejected';
type StatusCounts = { accepted: number; pending: number; rejected: number; all: number };

function BlogTableSkeleton({ rows = 5 }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Status</TableHead>
          <TableHead>Image</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Post ID</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-center">Likes</TableHead>
          <TableHead className="text-center">Comments</TableHead>
          <TableHead className="text-center">Shares</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(rows)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-10 w-28" /></TableCell>
            <TableCell><Skeleton className="h-16 w-24 rounded-md object-cover" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminBlogsPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | 'all'>('all');
  const { toast } = useToast();
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ accepted: 0, pending: 0, rejected: 0, all: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [updatingStatusPostId, setUpdatingStatusPostId] = useState<string | null>(null);


  const fetchAdminPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { posts: fetchedPosts, counts } = await getAllPostsForAdmin(selectedStatus === 'all' ? undefined : selectedStatus);
      setAllPosts(fetchedPosts);
      setStatusCounts(counts);
      console.log('[AdminBlogsPage] Fetched', fetchedPosts.length, 'posts from backend with status filter:', selectedStatus);
      console.log('[AdminBlogsPage] Received counts:', counts);
    } catch (error) {
      console.error("Failed to fetch posts for admin:", error);
      toast({ title: "Error", description: "Failed to load blog posts.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedStatus]); 

  useEffect(() => {
    fetchAdminPosts();
  }, [fetchAdminPosts]);

  const filteredPosts = useMemo(() => {
    let postsToFilter = [...allPosts]; 
    
    if (selectedCategory && selectedCategory !== 'all') {
        postsToFilter = postsToFilter.filter(post => post.category === selectedCategory);
    }
    if (selectedDate) {
      postsToFilter = postsToFilter.filter(post => {
        if (!post.date) return false;
        return isSameDay(new Date(post.date), selectedDate);
      });
    }
    if (searchQuery.trim()) {
      postsToFilter = postsToFilter.filter(post =>
        post.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }
    return postsToFilter.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allPosts, selectedDate, selectedCategory, searchQuery]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedStatus, selectedCategory, selectedDate, searchQuery, rowsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / rowsPerPage);
  const currentPostsToDisplay = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, currentPage, rowsPerPage]);

  const handleCopyPostId = (postId: string) => {
    navigator.clipboard.writeText(postId)
      .then(() => {
        toast({ title: "Post ID Copied", description: "Post ID has been copied to your clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy post ID: ', err);
        toast({ title: "Copy Failed", description: "Could not copy Post ID.", variant: "destructive" });
      });
  };

  const handleStatusChange = async (postId: string, newStatus: PostStatus) => {
    setUpdatingStatusPostId(postId);
    try {
      const updatedPost = await updatePostStatus(postId, newStatus);
      if (updatedPost) {
        // Update local state for immediate UI feedback
        setAllPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, status: newStatus } : p));
        // Refetch counts and potentially posts if the filter was on a specific status
        await fetchAdminPosts(); 
        toast({ title: "Status Updated", description: `Post "${updatedPost.title}" status changed to ${newStatus}.` });
      } else {
        throw new Error("Failed to update status on server.");
      }
    } catch (error) {
      console.error("Error updating post status:", error);
      toast({ title: "Update Failed", description: "Could not update post status.", variant: "destructive" });
    } finally {
      setUpdatingStatusPostId(null);
    }
  };
  
  const getStatusBadge = (status?: PostStatus) => {
    switch (status) {
      case 'accepted': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Accepted</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><AlertTriangle className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'rejected': return <Badge variant="destructive"><XOctagon className="mr-1 h-3 w-3" />Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };


  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-primary">Blogs List</CardTitle>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
                />
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="w-full sm:w-auto sm:min-w-[200px]">
                 <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value as PostStatus | 'all'); }}>
                    <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                        <SelectItem value="accepted">Accepted ({statusCounts.accepted})</SelectItem>
                        <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                        <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={selectedCategory || 'all'} onValueChange={(value) => { setSelectedCategory(value === 'all' ? undefined : value); }}>
                    <SelectTrigger id="category-filter">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {staticCategories.map(cat => (
                            <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-1">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        size="icon"
                        className={cn(
                            "h-10 w-10 shrink-0", 
                            !selectedDate && "text-muted-foreground"
                        )}
                        title={selectedDate ? `Filtering by ${format(selectedDate, "PPP")}` : "Filter by date"}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        <span className="sr-only">{selectedDate ? format(selectedDate, "PPP") : "Filter by date"}</span>
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => { setSelectedDate(date);}}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {selectedDate && (
                    <Button variant="ghost" size="icon" onClick={() => {setSelectedDate(undefined);}} title="Clear date filter" className="h-10 w-10">
                        <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                         <span className="sr-only">Clear date filter</span>
                    </Button>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <BlogTableSkeleton rows={rowsPerPage} />
        ) : filteredPosts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No blog posts found for the selected filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Status</TableHead>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead className="min-w-[200px] max-w-[250px]">Title</TableHead>
                    <TableHead className="w-[120px]">Post ID</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Likes</TableHead>
                    <TableHead className="text-center">Comments</TableHead>
                    <TableHead className="text-center">Shares</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPostsToDisplay.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={post.status}
                            onValueChange={(newStatus) => handleStatusChange(post.id, newStatus as PostStatus)}
                            disabled={updatingStatusPostId === post.id}
                          >
                            <SelectTrigger className="h-9 w-full text-xs">
                              <SelectValue placeholder="Set Status">
                                 {getStatusBadge(post.status)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accepted">{getStatusBadge('accepted')}</SelectItem>
                              <SelectItem value="pending">{getStatusBadge('pending')}</SelectItem>
                              <SelectItem value="rejected">{getStatusBadge('rejected')}</SelectItem>
                            </SelectContent>
                          </Select>
                           {updatingStatusPostId === post.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                      </TableCell>
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
                      <TableCell className="font-medium">
                          <Link href={`/posts/${post.id}/${generateSlug(post.title)}`} className="hover:text-primary hover:underline line-clamp-2" target="_blank" rel="noopener noreferrer">
                          {post.title}
                          </Link>
                      </TableCell>
                       <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyPostId(post.id)} className="px-2 text-xs">
                          <Copy className="h-3 w-3 mr-1.5" /> Copy ID
                        </Button>
                      </TableCell>
                      <TableCell>
                          <Link href={`/profile/${post.author.id}`} className="hover:text-primary hover:underline">
                              {post.author.name}
                          </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{staticCategories.find(c => c.slug === post.category)?.name || post.category}</Badge>
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

            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</Label>
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                  }}
                >
                  <SelectTrigger id="rows-per-page" className="w-20 h-9">
                    <SelectValue placeholder={rowsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map(num => (
                      <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-9"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

