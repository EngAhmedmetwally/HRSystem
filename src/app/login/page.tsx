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
import { employees } from '@/lib/mock-data';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Special case for hardcoded admin user
      if (username === 'admin@highclass.com' && password === 'admin102030') {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بعودتك أيها المدير!',
        });
         // In a real app, you'd set a session/token here.
        // For now, we'll store a mock user in localStorage.
        localStorage.setItem('currentUser', JSON.stringify({
            name: 'Admin',
            role: 'Administrator',
            allowedScreens: ['dashboard', 'attendance', 'employees', 'qr-code', 'payroll', 'settings']
        }));
        router.push('/dashboard');
        return;
      }
      
      // Find user in mock data
      const user = employees.find(
        (emp) => emp.username === username && emp.password === password
      );

      if (user) {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: `مرحباً بعودتك، ${user.name}!`,
        });
        localStorage.setItem('currentUser', JSON.stringify(user));
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'فشل تسجيل الدخول',
          description: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
        });
        setIsLoading(false);
      }
    }, 1000);
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
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="اسم المستخدم الخاص بك"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
