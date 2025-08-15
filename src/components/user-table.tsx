
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
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string | null;
  is_verified: boolean;
  created_at: string;
};

export function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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

    fetchUsers();
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Users</CardTitle>
        <CardDescription>A list of all users who have registered on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableCaption>{users.length > 0 ? 'A list of all registered users.' : 'No users found.'}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="text-right">Joined On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role ? (
                        <Badge variant="secondary">{user.role}</Badge>
                    ) : (
                        <span className="text-muted-foreground">User</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_verified ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1 text-xs">
                          <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                          <ShieldAlert className="h-3 w-3" /> Not Verified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{format(new Date(user.created_at), 'PPP')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
