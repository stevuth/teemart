
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
  email: string; // Assuming email is on the auth user, but let's have it here
  nin_image_url: string;
  selfie_image_url: string;
};

// A new component to handle generating the signed URL and displaying the image
function VerificationImage({ path }: { path: string }) {
    const { supabase } = useAuth();
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (path && supabase) {
            const getSignedUrl = async () => {
                const { data, error } = await supabase.storage
                    .from('verification-documents')
                    .createSignedUrl(path, 60 * 5); // URL valid for 5 minutes

                if (error) {
                    console.error("Error creating signed URL:", error);
                    setImageUrl(null);
                } else {
                    setImageUrl(data.signedUrl);
                }
            };
            getSignedUrl();
        }
    }, [path, supabase]);

    if (!imageUrl) {
        return <div className="flex items-center justify-center h-full bg-secondary rounded-md"><Loader2 className="h-5 w-5 animate-spin" /></div>;
    }

    return (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
            <Image
                src={imageUrl}
                alt="Verification Document"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 40vw"
            />
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
      .update({ is_verified: isVerified })
      .eq('id', userId);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `User has been ${isVerified ? 'approved' : 'rejected'}.` });
      // Refresh list
      setProfiles(profiles.filter(p => p.id !== userId));
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
                 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">NIN Document</p>
                    <div className="relative aspect-video bg-secondary rounded-md overflow-hidden border">
                       {profile.nin_image_url && <VerificationImage path={profile.nin_image_url} />}
                    </div>
                  </div>
                   <div className="space-y-2">
                    <p className="text-sm font-medium">User Selfie</p>
                     <div className="relative aspect-square w-48 bg-secondary rounded-md overflow-hidden border">
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

    