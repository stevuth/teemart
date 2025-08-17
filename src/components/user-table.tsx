
"use client";

import { useEffect, useState, useMemo } from 'react';
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
  const { toast } = useToast();
  const { supabase } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
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
    };
    fetchUsers();
  }, [supabase, toast]);

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
