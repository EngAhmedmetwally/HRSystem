'use client';

import Link from 'next/link';
import { CameraScanner } from '@/components/check-in/camera-scanner';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function CheckInContent() {
  const router = useRouter();
  
  // This is a conceptual cleanup. In App Router, direct `router.events` are not available.
  // The cleanup is better handled inside the CameraScanner component via its own `useEffect` return function.
  // This ensures the camera is turned off when the component unmounts.
  useEffect(() => {
    return () => {
      // The actual camera stop logic is now inside CameraScanner's unmount effect.
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
       <Suspense fallback={<div className="text-white">جاري تحميل الكاميرا...</div>}>
          <CameraScanner />
       </Suspense>
      <Button asChild variant="link" className="mt-8 text-primary-foreground">
        <Link href="/">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة إلى الشاشة الرئيسية
        </Link>
      </Button>
    </main>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckInContent />
    </Suspense>
  );
}
