// src/components/layout/header.tsx
'use client';

import { Search, UserPlus, LogOut, User as UserIcon, Menu, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PopularCategories } from '@/components/blog/popular-categories';
import type { Category as CategoryType } from '@/types';
import { getUnreadNotificationCount } from '@/app/actions/notification.actions';



interface AppHeaderProps {
  popularCategoriesData?: Array<CategoryType & { postCount: number }>;
}

export function AppHeader({ popularCategoriesData = [] }: AppHeaderProps) {
  const { user, logout, isLoading, isAdmin } = useAuth(); // Added isAdmin
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user && !isLoading) {
      const fetchUnreadCount = async () => {
        try {
          if (!user?.id) {
          // Optional: handle missing user or redirect
          console.error("User ID is undefined");
          return;
          }
          const count = await getUnreadNotificationCount(user.id);
          setUnreadNotifications(count);
        } catch (error) {
          console.error("Failed to fetch unread notification count:", error);
        }
      };
      fetchUnreadCount();
      
      const intervalId = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(intervalId);
    } else {
      setUnreadNotifications(0);
    }
  }, [user, isLoading, pathname]);


  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          <img src="/card.jpg" alt="CardFeed Logo" className="h-10 w-10 rounded object-cover" />
          <span>CardFeed</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles, topics, or authors..."
              className="pl-10 w-full rounded-xl bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <div className="lg:hidden">
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open categories</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-primary">Categories</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <PopularCategories categories={popularCategoriesData} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {isLoading ? (
            <div className="h-8 w-20 bg-muted rounded-md animate-pulse ml-1"></div>
          ) : user ? (
            <>
              <Button variant="ghost" className="rounded-full relative" asChild>
                <Link href="/notifications">
                    <svg  fill="#181C1F" height="20" icon-name="notification-outline" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 18h1a2 2 0 0 1-4 0h3Zm8-3.792v.673A1.12 1.12 0 0 1 17.883 16H2.117A1.12 1.12 0 0 1 1 14.881v-.673a3.947 3.947 0 0 1 1.738-3.277A2.706 2.706 0 0 0 3.926 8.7V7.087a6.07 6.07 0 0 1 12.138 0l.01 1.613a2.7 2.7 0 0 0 1.189 2.235A3.949 3.949 0 0 1 19 14.208Zm-1.25 0a2.7 2.7 0 0 0-1.188-2.242A3.956 3.956 0 0 1 14.824 8.7V7.088a4.819 4.819 0 1 0-9.638 0v1.615a3.956 3.956 0 0 1-1.738 3.266 2.7 2.7 0 0 0-1.198 2.239v.542h15.5v-.542Z"></path>
                  </svg>
                    {unreadNotifications > 0 && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 hover:text-black">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName}  className=" object-cover"/>
                      <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up / Login
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full sm:hidden" asChild>
                <Link href="/signup">
                  <UserPlus className="h-5 w-5" />
                   <span className="sr-only">Sign Up or Login</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="md:hidden px-4 pb-3 border-t md:border-t-0">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}
