
// src/app/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BellOff, CheckCheck, Trash2, Loader2, MessageSquare, Heart, ShieldCheck, ShieldX, ExternalLink, Info } from 'lucide-react';
import type { Notification } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '@/app/actions/notification.actions';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) {
        setIsLoadingNotifications(false);
        return;
      }
      setIsLoadingNotifications(true);
      try {
        const userNotifications = await getNotificationsForUser(user.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({ title: "Failed to load notifications", variant: "destructive" });
      } finally {
        setIsLoadingNotifications(false);
      }
    }

    if (!authLoading) {
      if (user) {
        fetchNotifications();
      } else {
        toast({ title: "Please log in to view notifications", variant: "destructive"});
        setIsLoadingNotifications(false);
      }
    }
  }, [user, authLoading, toast]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    setIsProcessing(true);
    const success = await markNotificationAsRead(notificationId, user.id);
    if (success) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      toast({ title: "Notification marked as read" });
    } else {
      toast({ title: "Failed to mark as read", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleMarkAllRead = async () => {
    if (!user || notifications.filter(n => !n.isRead).length === 0) return;
    setIsProcessing(true);
    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({ title: "All notifications marked as read" });
    } else {
      toast({ title: "Failed to mark all as read", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!user) return;
    setIsProcessing(true);
    const success = await deleteNotification(notificationId, user.id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({ title: "Notification deleted" });
    } else {
      toast({ title: "Failed to delete notification", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleDeleteAll = async () => {
    if (!user || notifications.length === 0) return;
    setIsProcessing(true);
    const success = await deleteAllNotifications(user.id);
    if (success) {
      setNotifications([]);
      toast({ title: "All notifications deleted" });
    } else {
      toast({ title: "Failed to delete all notifications", variant: "destructive" });
    }
    setIsProcessing(false);
  };
  
  if (authLoading || isLoadingNotifications) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8 text-center">
            <BellOff className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold">Access Denied</h1>
            <p className="text-muted-foreground">Please log in to view your notifications.</p>
            <Button asChild className="mt-6"><Link href="/signup">Login</Link></Button>
        </main>
      </div>
    );
  }

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <>
            <Link href={`/profile/${notification.actingUser.id}`} className="font-semibold hover:text-primary">{notification.actingUser.name}</Link>
            {' liked your post: '}
            <Link href={`/posts/${notification.postId}/${notification.postSlug}`} className="font-semibold hover:text-primary">
              &quot;{notification.postTitle}&quot;
            </Link>
            <Heart className="inline h-3 w-3 ml-1 text-red-500" />
          </>
        );
      case 'comment':
        return (
          <>
            <Link href={`/profile/${notification.actingUser.id}`} className="font-semibold hover:text-primary">{notification.actingUser.name}</Link>
            {' commented on your post: '}
            <Link href={`/posts/${notification.postId}/${notification.postSlug}`} className="font-semibold hover:text-primary">
              &quot;{notification.postTitle}&quot;
            </Link>
            <MessageSquare className="inline h-3 w-3 ml-1 text-blue-500" />
             {notification.commentText && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Comment: &quot;{notification.commentText}&quot;</p>}
          </>
        );
      case 'comment_like':
        return (
          <>
            <Link href={`/profile/${notification.actingUser.id}`} className="font-semibold hover:text-primary">{notification.actingUser.name}</Link>
            {' liked your comment on the post: '}
            <Link href={`/posts/${notification.postId}/${notification.postSlug}#comment-${notification.commentId}`} className="font-semibold hover:text-primary">
              &quot;{notification.postTitle}&quot;
            </Link>
            <Heart className="inline h-3 w-3 ml-1 text-red-500" />
            {notification.commentText && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Your comment: &quot;{notification.commentText}&quot;</p>}
          </>
        );
      case 'comment_reply':
         return (
          <>
            <Link href={`/profile/${notification.actingUser.id}`} className="font-semibold hover:text-primary">{notification.actingUser.name}</Link>
            {' replied to your comment on the post: '}
            <Link href={`/posts/${notification.postId}/${notification.postSlug}#comment-${notification.commentId}`} className="font-semibold hover:text-primary">
              &quot;{notification.postTitle}&quot;
            </Link>
            <MessageSquare className="inline h-3 w-3 ml-1 text-purple-500" />
            {notification.commentText && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Reply: &quot;{notification.commentText}&quot;</p>}
          </>
        );
      case 'post_status_change':
        const statusText = notification.newStatus === 'accepted' ? 'accepted' : 'rejected';
        const StatusIcon = notification.newStatus === 'accepted' ? ShieldCheck : ShieldX;
        const iconColor = notification.newStatus === 'accepted' ? "text-green-500" : "text-red-500";
        return (
          <>
            <span className="font-semibold">{notification.actingUser.name}</span>
            {` ${statusText} your post: `}
            <Link href={`/posts/${notification.postId}/${notification.postSlug}`} className="font-semibold hover:text-primary">
              &quot;{notification.postTitle}&quot;
            </Link>
            <StatusIcon className={cn("inline h-3 w-3 ml-1", iconColor)} />
          </>
        );
      case 'admin_announcement':
        return (
           <div className="flex flex-col">
            <div className="flex items-center">
              <Info className="inline h-4 w-4 mr-2 text-blue-500 shrink-0" />
              <span className="font-semibold text-primary">{notification.postTitle || 'Announcement'}</span>
            </div>
            {notification.commentText && <p className="text-sm text-foreground mt-1">{notification.commentText}</p>}
            {notification.externalLink && (
                <a href={notification.externalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1.5 inline-flex items-center">
                    Learn More <ExternalLink className="h-3 w-3 ml-1" />
                </a>
            )}
           </div>
        );
      default:
         const exhaustiveCheck: never = notification.type;
        return `Unknown notification type: ${exhaustiveCheck}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-3xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-3xl font-bold text-primary">Notifications</CardTitle>
              {notifications.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMarkAllRead} 
                    disabled={isProcessing || notifications.every(n => n.isRead)}
                  >
                    <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteAll} 
                    disabled={isProcessing}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete all
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-6">
                <BellOff className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No notifications yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Interactions with your posts or announcements will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Link href={notification.actingUser.id === 'admin_system' ? '#' : `/profile/${notification.actingUser.id}`}>
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarImage src={notification.actingUser.imageUrl} alt={notification.actingUser.name} data-ai-hint="user avatar" className="object-cover"/>
                          <AvatarFallback>{notification.actingUser.name.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-grow">
                        <div className="text-sm text-foreground">
                          {renderNotificationContent(notification)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-end sm:items-center shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isProcessing}
                            className="text-xs px-2 py-1 h-auto text-primary hover:text-primary/80"
                          >
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={isProcessing}
                          className="text-muted-foreground hover:text-destructive h-7 w-7"
                           title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete notification</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
