
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

type ProfileForVerification = {
  id: string;
  full_name: string;
  email: string;
  nin_image_url: string;
  selfie_image_url: string;
};

function VerificationImage({ path }: { path: string }) {
    const { supabase } = useAuth();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (path && supabase) {
            const getSignedUrl = async () => {
                setLoading(true);
                // Use a short-lived signed URL for security
                const { data, error } = await supabase.storage
                    .from('verification-documents')
                    .createSignedUrl(path, 60 * 5); // 5 minutes validity

                if (error) {
                    console.error("Error creating signed URL:", error);
                    setImageUrl(null);
                } else {
                    setImageUrl(data.signedUrl);
                }
                setLoading(false);
            };
            getSignedUrl();
        }
    }, [path, supabase]);

    if (loading) {
        return <div className="flex items-center justify-center h-full bg-secondary rounded-md"><Loader2 className="h-5 w-5 animate-spin" /></div>;
    }
    
    if (!imageUrl) {
        return <div className="flex items-center justify-center h-full bg-destructive/10 text-destructive text-xs p-2 text-center rounded-md">Image not found or access denied.</div>;
    }

    return (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
            <Image
                src={imageUrl}
                alt="Verification Document"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 40vw"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                Click to Enlarge
            </div>
        </a>
    );
}

export function VerificationQueue() {
  const [profiles, setProfiles] = useState<ProfileForVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { supabase } = useAuth();

  const fetchVerificationRequests = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, nin_image_url, selfie_image_url')
      .eq('is_verified', false)
      .not('nin_image_url', 'is', null)
      .not('selfie_image_url', 'is', null);

    if (error) {
      console.error('Error fetching profiles for verification:', error);
      toast({ title: 'Error', description: 'Could not fetch verification requests.', variant: 'destructive' });
    } else {
      setProfiles(data as ProfileForVerification[]);
    }
    setLoading(false);
  }, [toast, supabase]);

  useEffect(() => {
    fetchVerificationRequests();
  }, [fetchVerificationRequests]);

  const handleVerification = async (userId: string, isVerified: boolean) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: isVerified, nin_image_url: null, selfie_image_url: null }) // Set to verified and clear image paths
      .eq('id', userId);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `User has been ${isVerified ? 'approved' : 'rejected'}.` });
      setProfiles(profiles.filter(p => p.id !== userId)); // Refresh list by removing the processed user
    }
    setUpdatingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification Queue</CardTitle>
        <CardDescription>Review and approve or reject user verification submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : profiles.length === 0 ? (
          <p className="text-center text-muted-foreground p-8">No pending verification requests.</p>
        ) : (
          <div className="space-y-6">
            {profiles.map(profile => (
              <Card key={profile.id} className="overflow-hidden">
                <div className="p-4 bg-muted/50 border-b">
                    <h3 className="font-semibold">{profile.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{profile.id}</p>
                </div>
                 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-center md:text-left">NIN Document</p>
                    <div className="relative aspect-[16/10] bg-secondary rounded-md overflow-hidden border">
                       {profile.nin_image_url && <VerificationImage path={profile.nin_image_url} />}
                    </div>
                  </div>
                   <div className="space-y-2">
                    <p className="text-sm font-medium text-center md:text-left">User Selfie</p>
                     <div className="relative aspect-[16/10] bg-secondary rounded-md overflow-hidden border">
                       {profile.selfie_image_url && <VerificationImage path={profile.selfie_image_url} />}
                    </div>
                  </div>
                </div>
                <CardFooter className="flex justify-end gap-2 bg-muted/50 p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerification(profile.id, false)}
                    disabled={updatingId === profile.id}
                  >
                    {updatingId === profile.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleVerification(profile.id, true)}
                    disabled={updatingId === profile.id}
                  >
                    {updatingId === profile.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Approve
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
