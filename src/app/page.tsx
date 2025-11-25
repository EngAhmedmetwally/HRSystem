'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000); // 3-second delay before redirecting

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary p-4 text-primary-foreground">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <Fingerprint className="h-32 w-32 animate-pulse text-primary-foreground/50 duration-2000" />
           <div className="absolute inset-0 flex items-center justify-center">
             <Landmark className="h-10 w-10 text-primary-foreground" />
           </div>
        </div>
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight font-headline">HighClass HR</h1>
            <p className="mt-2 text-lg text-primary-foreground/80">نظام ذكي للحضور والانصراف والرواتب</p>
        </div>
      </div>
    </main>
  );
}
