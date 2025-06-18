
// src/app/admin/notifications-log/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { AdminAnnouncementLogEntry } from '@/types';
import { getAdminAnnouncementLog } from '@/app/actions/notification.actions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Copy, ExternalLinkIcon, AlertTriangle, CheckCircle2, XCircle as XCircleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

function NotificationLogTableSkeleton({ rows = 5 }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead className="w-[180px]">Description</TableHead>
          <TableHead>External Link</TableHead>
          <TableHead>Target Audience</TableHead>
          <TableHead>Sent At</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(rows)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><div className="h-4 bg-muted rounded w-3/4"></div></TableCell>
            <TableCell><div className="h-8 bg-muted rounded w-24"></div></TableCell>
            <TableCell><div className="h-4 bg-muted rounded w-1/2"></div></TableCell>
            <TableCell><div className="h-4 bg-muted rounded w-20"></div></TableCell>
            <TableCell><div className="h-4 bg-muted rounded w-24"></div></TableCell>
            <TableCell><div className="h-6 bg-muted rounded w-16 mx-auto"></div></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminNotificationsLogPage() {
  const [logEntries, setLogEntries] = useState<AdminAnnouncementLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLog() {
      setIsLoading(true);
      try {
        const logs = await getAdminAnnouncementLog();
        setLogEntries(logs);
      } catch (error) {
        console.error("Failed to fetch notification log:", error);
        toast({ title: "Error", description: "Failed to load notification log.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchLog();
  }, [toast]);

  const handleCopyDescription = (description: string) => {
    navigator.clipboard.writeText(description)
      .then(() => {
        toast({ title: "Description Copied", description: "The announcement description has been copied to your clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy description: ', err);
        toast({ title: "Copy Failed", description: "Could not copy description.", variant: "destructive" });
      });
  };

  const renderTargetAudience = (entry: AdminAnnouncementLogEntry) => {
    switch (entry.targetingType) {
      case 'all':
        return <Badge variant="secondary">All Users</Badge>;
      case 'specific':
        const userCount = Array.isArray(entry.targetIdentifier) ? entry.targetIdentifier.length : 0;
        return <Badge variant="outline">Specific Users ({userCount})</Badge>;
      case 'category':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Category: {entry.targetIdentifier}</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const renderStatus = (entry: AdminAnnouncementLogEntry) => {
    let icon = <AlertTriangle className="mr-1 h-3 w-3" />;
    let text = `Sent: ${entry.successCount}/${entry.totalTargeted}`;
    if (entry.errorCount > 0) text += `, Errors: ${entry.errorCount}`;

    if (entry.status === 'completed') {
      icon = <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />;
      return <Badge variant="default" className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200">{icon}{text}</Badge>;
    } else if (entry.status === 'partial_failure') {
      icon = <AlertTriangle className="mr-1 h-3 w-3 text-yellow-600" />;
      return <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100">{icon}{text}</Badge>;
    } else if (entry.status === 'failed') {
      icon = <XCircleIcon className="mr-1 h-3 w-3 text-red-500" />;
       return <Badge variant="destructive">{icon}{text}</Badge>;
    }
     return <Badge variant="outline">{icon}{text}</Badge>;
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Admin Notifications Log</CardTitle>
        <CardDescription>History of announcements sent by administrators.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <NotificationLogTableSkeleton />
        ) : logEntries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No admin announcements have been sent yet.</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]"> {/* Adjust height as needed */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead className="w-[180px]">Description</TableHead>
                  <TableHead>External Link</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead className="min-w-[150px]">Sent At</TableHead>
                  <TableHead className="text-center min-w-[200px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.title}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleCopyDescription(entry.description)}>
                        <Copy className="mr-2 h-3.5 w-3.5" /> Copy
                      </Button>
                    </TableCell>
                    <TableCell>
                      {entry.externalLink ? (
                        <a href={entry.externalLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                          View Link <ExternalLinkIcon className="ml-1 h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{renderTargetAudience(entry)}</TableCell>
                    <TableCell>{format(new Date(entry.sentAt), 'PPp')}</TableCell>
                    <TableCell className="text-center">{renderStatus(entry)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
