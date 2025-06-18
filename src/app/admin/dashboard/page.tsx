
// src/app/admin/dashboard/page.tsx
'use client'; 

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListChecks, PlusSquare, Activity, BarChart3, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { getTotalUserCount } from "@/app/actions/user.actions";
import { getTotalPostCount } from "@/app/actions/post.actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // setIsLoadingStats(true);
      try {
        const [userCount, postCount] = await Promise.all([
          getTotalUserCount(),
          getTotalPostCount(),
        ]);
        setTotalUsers(userCount);
        setTotalPosts(postCount);
        console.log(userCount)
      } catch (error) {
        console.error("Failed to fetch admin dashboard stats:", error);
        setTotalUsers(0); // Default to 0 on error
        setTotalPosts(0);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  });

  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the CardFeed Admin Panel.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Manage Users
            </CardTitle>
            <CardDescription>View and manage registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/users">Go to Users List</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              Manage Blogs
            </CardTitle>
            <CardDescription>View and manage all blog posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/blogs">Go to Blogs List</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusSquare className="h-6 w-6 text-primary" />
              Add New Blog
            </CardTitle>
            <CardDescription>Create and publish a new blog post.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/add-blog">Create Blog Post</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? (
                             <Skeleton className="h-8 w-1/3" />
                        ) : (
                            <div className="text-2xl font-bold text-primary">
                                {totalUsers !== null ? totalUsers : 'N/A'}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Registered users on the platform.
                        </p>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {isLoadingStats ? (
                            <Skeleton className="h-8 w-1/3" />
                        ) : (
                            <div className="text-2xl font-bold text-primary">
                                {totalPosts !== null ? totalPosts : 'N/A'}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Total posts created on the platform.
                        </p>
                    </CardContent>
                </Card>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

