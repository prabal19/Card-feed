
// src/components/admin/user-multi-select.tsx
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getAllUsers } from '@/app/actions/user.actions';
import type { User } from '@/types';

interface UserMultiSelectProps {
  selectedUserIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function UserMultiSelect({ selectedUserIds, onChange, disabled }: UserMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Failed to fetch users for multi-select:", error);
        // Consider adding a toast here in a real app
      }
      setIsLoading(false);
    }
    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  const handleSelect = (userId: string) => {
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId];
    onChange(newSelectedIds);
  };

  const selectedUsers = allUsers.filter(user => selectedUserIds.includes(user.id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
            disabled={disabled || isLoading}
          >
            <span className="flex flex-wrap gap-1 items-center">
              {selectedUsers.length > 0
                ? selectedUsers.map(user => (
                    <Badge
                      variant="secondary"
                      key={user.id}
                      className="mr-1 mb-1" // Added mb-1 for better wrapping
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent popover from closing
                        handleSelect(user.id);
                      }}
                    >
                      {user.firstName} {user.lastName}
                      <X className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" />
                    </Badge>
                  ))
                : "Select users..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search users..." disabled={disabled || isLoading} />
            <CommandList>
              <CommandEmpty>{isLoading ? "Loading users..." : "No users found."}</CommandEmpty>
              <CommandGroup>
                {allUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    // Construct value string more robustly for searching
                    value={`${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`.trim().toLowerCase()}
                    onSelect={() => {
                      handleSelect(user.id);
                      // setOpen(false); // Keep popover open for multi-selection
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {user.firstName} {user.lastName} 
                    <span className="text-xs text-muted-foreground ml-1">({user.email})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedUsers.length > 0 && !open && (
         <p className="text-xs text-muted-foreground mt-1">{selectedUsers.length} user(s) selected.</p>
      )}
    </div>
  );
}
