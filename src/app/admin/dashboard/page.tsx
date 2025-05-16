// src/app/admin/dashboard/page.tsx
'use client'; 

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListChecks, PlusSquare } from "lucide-react";

export default function AdminDashboardPage() {

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        {/* You might want to fetch user's first name via useAuth if needed here */}
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
            <CardTitle>Quick Stats (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This area can be used to display important statistics like total users, total posts, etc.
              Implementation of these stats would require additional aggregation queries.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-sm text-muted-foreground">Posts Today</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-sm text-muted-foreground">Likes Today</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
