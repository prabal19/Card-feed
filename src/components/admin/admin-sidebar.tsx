// src/components/admin/admin-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Newspaper, Users, ListChecks, PlusSquare, LogOut, Settings, Home, Send, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Settings },
  { href: '/admin/users', label: 'Users List', icon: Users },
  { href: '/admin/blogs', label: 'Blogs List', icon: ListChecks },
  { href: '/admin/add-blog', label: 'Add Blog', icon: PlusSquare },
  { href: '/admin/send-notifications', label: 'Send Notifications', icon: Send },
  { href: '/admin/notifications-log', label: 'Notifications Log', icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout(); // AuthContext's logout now redirects to '/'
  };
  
  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <aside className="w-64 bg-card text-card-foreground p-4 border-r border-border flex flex-col">
      <div className="mb-6 p-2">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Newspaper className="h-7 w-7" />
          <span>CardFeed</span>
        </Link>
        <p className="text-xs text-muted-foreground ml-9">Admin Panel</p>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} passHref>
            <Button
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                pathname === item.href && 'bg-primary/10 text-primary'
              )}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={handleGoHome}>
          <Home className="mr-2 h-5 w-5" />
          Go to Site
        </Button>
        <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50 hover:border-red-500/50" onClick={handleLogout}>
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
