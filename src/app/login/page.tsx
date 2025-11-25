'use client';

import { useState } from 'react';
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
import { Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, initiateEmailSignIn } from '@/firebase'; // Use non-blocking sign-in
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth(); // Get auth instance from provider
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Special case for hardcoded admin user - should be migrated to Firestore roles
    if (email === 'admin@highclass.com' && password === 'admin102030') {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بعودتك أيها المدير!',
        });
        // The onAuthStateChanged listener in the provider will handle the redirect
        router.push('/dashboard');
      } catch (error: any) {
        console.error("Admin login failed", error)
        // Handle case where admin user doesn't exist in Firebase Auth
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
           toast({
              variant: 'destructive',
              title: 'فشل تسجيل الدخول',
              description: 'بيانات اعتماد المدير غير صحيحة.',
           });
        } else {
             toast({
              variant: 'destructive',
              title: 'خطأ غير متوقع',
              description: error.message,
           });
        }
        setIsLoading(false);
      }
      return;
    }

    try {
        // Use standard Firebase sign-in
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'تم تسجيل الدخول بنجاح',
        });
        router.push('/dashboard');
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
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
