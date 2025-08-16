
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
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
import { Loader2, ShieldCheck, ShieldAlert, Slash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';

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

export function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanToggle = async (user: UserProfile) => {
    if (!session) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to perform this action.', variant: 'destructive' });
        return;
    }
    setUpdatingId(user.id);
    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
    const action = isBanned ? 'unban' : 'ban';

    try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ action }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || 'An unknown error occurred');
        }
        
        toast({
            title: `User ${action === 'ban' ? 'Banned' : 'Unbanned'}`,
            description: `${user.email} has been successfully ${action === 'ban' ? 'banned' : 'unbanned'}.`
        });
        
        fetchUsers();

    } catch (error: any) {
        toast({
            title: "Operation Failed",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Users ({users.length})</CardTitle>
        <CardDescription>A list of all users who have registered on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableCaption>{users.length > 0 ? `A list of all ${users.length} registered users.` : 'No users found.'}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                return (
                    <TableRow key={user.id}>
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
                    <TableCell>{format(new Date(user.created_at), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                        <Button
                            variant={isBanned ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleBanToggle(user)}
                            disabled={updatingId === user.id}
                        >
                            {updatingId === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Slash className="mr-2 h-4 w-4" />}
                            {isBanned ? 'Unban' : 'Ban'}
                        </Button>
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
