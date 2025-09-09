import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Loader } from '@/components/ui/loader';
import { ProfilePageContent } from './content';

function ProfilePageFallback() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow flex justify-center items-center">
                <Loader />
            </div>
            <Footer />
        </div>
    );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageContent />
    </Suspense>
  );
}
