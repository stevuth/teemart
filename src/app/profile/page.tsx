
import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProfilePageContent } from './content';
import { AppLoader } from '@/components/app-loader';

function ProfilePageFallback() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow flex justify-center items-center">
                <AppLoader />
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
