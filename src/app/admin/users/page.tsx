
// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { User, UserWithPostCount } from '@/types';
import { getAllUsers, updateUserByAdmin, deleteUserByAdmin } from '@/app/actions/user.actions';
import { getPostsByAuthorId } from '@/app/actions/post.actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, isSameDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, ChevronLeft, ChevronRight, CalendarIcon, XCircle, Edit, ShieldX, Trash2, ShieldCheck, Loader2, Search ,UserCircle} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { EditUserDialog } from '@/components/admin/edit-user-dialog';


type UserFilterType = 'all' | 'actual_google' | 'admin_role' | 'admin_created';

function UserTableSkeleton({ rows = 5 }: { rows?: number}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Avatar</TableHead>
          <TableHead>User ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-center">Posts</TableHead>
          <TableHead className="text-right">Joined</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(rows)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<UserWithPostCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null); // Store user _id for deletion
  const [isBlockingUser, setIsBlockingUser] = useState<string | null>(null); // Store user _id for blocking


  const fetchUsersAndPostCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUsers();
      const usersWithCounts: UserWithPostCount[] = await Promise.all(
        fetchedUsers.map(async (user) => {
          const posts = await getPostsByAuthorId(user.id); // getPostsByAuthorId uses user.id (custom or _id string)
          return { ...user, postCount: posts.length, isBlocked: user.isBlocked || false };
        })
      );
      setAllUsers(usersWithCounts);
    } catch (error) {
      console.error("Failed to fetch users and post counts:", error);
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    fetchUsersAndPostCounts();
  }, [fetchUsersAndPostCounts]);

  const filteredUsers = useMemo(() => {
    let usersToFilter = [...allUsers];

    if (filter === 'actual_google') {
      usersToFilter = usersToFilter.filter(user => user.authProvider === 'google' && user.role === 'user');
    } else if (filter === 'admin_role') {
      usersToFilter = usersToFilter.filter(user => user.role === 'admin');
    } else if (filter === 'admin_created') {
      // Show users created by admin (typically email auth) and regular users
      usersToFilter = usersToFilter.filter(user => user.authProvider === 'admin_created' && user.role === 'user');
    }

    if (selectedDate) {
      usersToFilter = usersToFilter.filter(user => {
        if (!user.createdAt) return false;
        return isSameDay(new Date(user.createdAt), selectedDate);
      });
    }

    if (searchQuery.trim()) {
        const lowerCaseQuery = searchQuery.trim().toLowerCase();
        usersToFilter = usersToFilter.filter(user =>
            (user.firstName?.toLowerCase().includes(lowerCaseQuery)) ||
            (user.lastName?.toLowerCase().includes(lowerCaseQuery)) ||
            (user.email?.toLowerCase().includes(lowerCaseQuery))
        );
    }

    return usersToFilter.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [allUsers, filter, selectedDate, searchQuery]);
  
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filter, selectedDate, searchQuery, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const currentUsersToDisplay = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId)
      .then(() => {
        toast({ title: "User ID Copied", description: "User ID has been copied to your clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy user ID: ', err);
        toast({ title: "Copy Failed", description: "Could not copy User ID.", variant: "destructive" });
      });
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUserForEdit(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setAllUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser, postCount: u.postCount } : u));
    // Ensure user in auth context is updated if it's the same user
  };

  const handleToggleBlockUser = async (user: UserWithPostCount) => {
     if (!user._id) {
        toast({ title: "Error", description: "User ID missing for block/unblock operation.", variant: "destructive" });
        return;
     }
     if (user.role === 'admin' && allUsers.filter(u => u.role === 'admin' && !u.isBlocked).length === 1 && !user.isBlocked) {
      toast({ title: "Action Restricted", description: "Cannot block the last active admin.", variant: "destructive" });
      return;
    }
    setIsBlockingUser(user._id);
    try {
      const newBlockedStatus = !user.isBlocked;
      const updatedUser = await updateUserByAdmin(user._id, { isBlocked: newBlockedStatus });
      if (updatedUser) {
        toast({ title: `User ${newBlockedStatus ? 'Blocked' : 'Unblocked'}`, description: `${user.firstName} ${user.lastName} has been ${newBlockedStatus ? 'blocked' : 'unblocked'}.` });
        handleUserUpdated(updatedUser); 
      } else {
        throw new Error("Failed to update user block status.");
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update user block status.", variant: "destructive" });
    } finally {
      setIsBlockingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string) => { // Expecting _id string
    setIsDeletingUser(userId);
    try {
      const success = await deleteUserByAdmin(userId); // Pass _id string
      if (success) {
        toast({ title: "User Deleted", description: `User (ID: ${userId}) and their posts have been deleted.` });
        setAllUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
      } else {
        throw new Error("Failed to delete user from server.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Delete Failed", description: error instanceof Error ? error.message : "Could not delete user.", variant: "destructive" });
    } finally {
      setIsDeletingUser(null);
    }
  };


  return (
    <>
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-primary">Users List</CardTitle>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search by name/email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
                />
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={filter} onValueChange={(value) => { setFilter(value as UserFilterType); }}>
                    <SelectTrigger id="user-filter">
                    <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="actual_google">Users</SelectItem>
                    <SelectItem value="admin_role">Admin</SelectItem>
                    <SelectItem value="admin_created">Sub-users</SelectItem>
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
                        onSelect={(date) => { setSelectedDate(date); }}
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
          <UserTableSkeleton rows={rowsPerPage} />
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No users found for the selected filters.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead className="w-[120px]">User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Posts</TableHead>
                    <TableHead className="text-right min-w-[150px]">Joined</TableHead>
                    <TableHead className="text-center w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsersToDisplay.map((user) => (
                    <TableRow key={user.id} className={cn(user.isBlocked && "bg-destructive/10 opacity-70")}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profileImageUrl ||undefined} alt={`${user.firstName} ${user.lastName}`} data-ai-hint="user avatar" className="object-cover"/>
                          <AvatarFallback><UserCircle className="h-full w-full text-muted-foreground p-1"/> </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyUserId(user.id)} className="px-2 text-xs">
                          <Copy className="h-3 w-3 mr-1.5" /> Copy ID
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                         {user.isBlocked && <Badge variant="outline" className="ml-2 border-destructive text-destructive">Blocked</Badge>}
                      </TableCell>
                      <TableCell className="text-center">{user.postCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        {user.createdAt ? format(new Date(user.createdAt), 'PPp') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenEditDialog(user)} title="Edit User" disabled={isDeletingUser === user._id || isBlockingUser === user._id}>
                            <Edit className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit User</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn("h-7 w-7", user.isBlocked ? "hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-600" : "hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:text-yellow-600")}
                            onClick={() => handleToggleBlockUser(user)}
                            title={user.isBlocked ? "Unblock User" : "Block User"}
                            disabled={isDeletingUser === user._id || isBlockingUser === user._id}
                          >
                            {isBlockingUser === user._id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : (user.isBlocked ? <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> : <ShieldX className="h-3.5 w-3.5 text-yellow-600" />)}
                            <span className="sr-only">{user.isBlocked ? "Unblock User" : "Block User"}</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-7 w-7" title="Delete User" disabled={isDeletingUser === user._id || isBlockingUser === user._id || (user.role === 'admin' && allUsers.filter(u => u.role === 'admin').length <=1) }>
                                {isDeletingUser === user._id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Trash2 className="h-3.5 w-3.5" />}
                                <span className="sr-only">Delete User</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user
                                  ({user.firstName} {user.lastName}), all their posts, and related notifications.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => user._id && handleDeleteUser(user._id)}>
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
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
    {selectedUserForEdit && (
        <EditUserDialog
            user={selectedUserForEdit} // This `user` object contains both `id` and `_id`
            isOpen={isEditUserDialogOpen}
            onClose={() => {
                setIsEditUserDialogOpen(false);
                setSelectedUserForEdit(null);
            }}
            onUserUpdated={handleUserUpdated}
        />
    )}
    </>
  );
}

