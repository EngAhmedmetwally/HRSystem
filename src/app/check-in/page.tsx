'use client';

import Link from 'next/link';
import { CameraScanner } from '@/components/check-in/camera-scanner';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckInContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      <CameraScanner qrToken={token} />
      <Button asChild variant="link" className="mt-8 text-primary-foreground">
        <Link href="/dashboard">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة إلى لوحة التحكم
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
