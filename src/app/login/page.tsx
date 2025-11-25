'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({ variant: "destructive", title: "خطأ", description: "خدمة المصادقة غير متاحة." });
        return;
    }
    setIsLoading(true);

    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'تم تسجيل الدخول بنجاح',
        });
        // The useUser hook will detect the new user state and the useEffect above will redirect
      } catch (error: any) {
        let description = 'حدث خطأ غير متوقع.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        }
        toast({
          variant: 'destructive',
          title: 'فشل تسجيل الدخول',
          description,
        });
      } finally {
        setIsLoading(false);
      }
  };

  // Show a loading state while checking for existing user
  if (isUserLoading || user) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="p-2 bg-primary text-primary-foreground rounded-md">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
          <CardTitle>HighClass HR</CardTitle>
          <CardDescription>
            تسجيل الدخول إلى حسابك
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : 'تسجيل الدخول'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
