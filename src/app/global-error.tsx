'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
            <div className="max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong!</h2>
                <p className="mb-6">An unexpected error occurred. You can try to recover from this error by resetting the application state.</p>
                <Button onClick={() => reset()}>Try again</Button>
                
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-muted rounded-lg text-left text-sm text-muted-foreground overflow-auto">
                        <h3 className="font-bold text-foreground mb-2">Error Details:</h3>
                        <pre className="whitespace-pre-wrap font-mono">
                            <code>{error.stack || error.message}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
      </body>
    </html>
  );
}
