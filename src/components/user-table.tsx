
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Ban, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { updateUserBanAction } from '@/app/actions/user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  is_verified: boolean;
  created_at: string;
  banned_until: string | null;
};

type VerificationFilter = 'all' | 'verified' | 'unverified';

export function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VerificationFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { supabase, user: adminUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_users');
    
    if (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Could not fetch the list of users.",
        variant: "destructive"
      });
      setUsers([]);
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    if (supabase) {
      fetchUsers();
    }
  }, [fetchUsers, supabase]);

  const handleBanUser = async (userId: string, durationDays: number | null) => {
    console.log(`[Client] handleBanUser called for userId: ${userId} with duration: ${durationDays}`);
    setUpdatingId(userId);
    const result = await updateUserBanAction(userId, durationDays);
    console.log(`[Client] Ban action result for ${userId}:`, result);
    if (result.success) {
        toast({ title: 'Success', description: `User status has been updated.` });
        await fetchUsers(); // Refresh the user list
    } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setUpdatingId(null);
  };
  
  const filteredUsers = useMemo(() => {
    if (filter === 'all') {
      return users;
    }
    return users.filter(user => {
      if (filter === 'verified') return user.is_verified;
      if (filter === 'unverified') return !user.is_verified;
      return true;
    });
  }, [users, filter]);

  const BanUserDialog = ({ user }: { user: UserProfile }) => {
    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={updatingId === user.id || user.id === adminUser?.id}>
                    {updatingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{isBanned ? 'Unban' : 'Ban'} User: {user.full_name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isBanned
                        ? 'This will immediately restore the user\'s access to their account.'
                        : 'Select a ban duration. The user will be unable to log in until the duration expires or they are manually unbanned.'
                      }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                 <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {isBanned ? (
                         <AlertDialogAction onClick={() => handleBanUser(user.id, null)}>Unban User</AlertDialogAction>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                             <AlertDialogAction onClick={() => handleBanUser(user.id, 7)}>Ban for 7 Days</AlertDialogAction>
                             <AlertDialogAction onClick={() => handleBanUser(user.id, 30)}>Ban for 30 Days</AlertDialogAction>
                             <AlertDialogAction onClick={() => handleBanUser(user.id, 36500)}>Ban Permanently</AlertDialogAction>
                        </div>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <CardTitle>Registered Users ({filteredUsers.length})</CardTitle>
                <CardDescription>A list of all users who have registered on the platform.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
                <Button size="sm" variant={filter === 'verified' ? 'default' : 'outline'} onClick={() => setFilter('verified')}>Verified</Button>
                <Button size="sm" variant={filter === 'unverified' ? 'default' : 'outline'} onClick={() => setFilter('unverified')}>Not Verified</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableCaption>{filteredUsers.length > 0 ? `Showing ${filteredUsers.length} of ${users.length} total users.` : 'No users found for this filter.'}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Joined On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                return (
                    <TableRow key={user.id} className={isBanned ? 'bg-destructive/10' : ''}>
                    <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      {isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </TableCell>
                     <TableCell>
                        {user.is_verified ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>
                        ) : (
                            <Badge variant="outline">Unverified</Badge>
                        )}
                    </TableCell>
                    <TableCell>{format(new Date(user.created_at), 'PPP')}</TableCell>
                     <TableCell className="text-right">
                        {user.id !== adminUser?.id && <BanUserDialog user={user} />}
                    </TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
