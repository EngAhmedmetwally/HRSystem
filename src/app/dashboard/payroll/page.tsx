'use client';

import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';
import { handlePayrollGeneration } from './actions';
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
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const initialState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          جاري الإنشاء...
        </>
      ) : (
        'إنشاء كشف المرتبات'
      )}
    </Button>
  );
}

export default function PayrollPage() {
  const [state, formAction] = useActionState(handlePayrollGeneration, initialState);
  const { toast } = useToast();
  const [payrollPeriod, setPayrollPeriod] = useState('');

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: state.error,
      });
    } else if (state.message && state.payrollDetails) {
       toast({
        title: 'نجاح',
        description: state.message,
      });
    }
  }, [state, toast]);

  useEffect(() => {
    const today = new Date();
    const month = today.toLocaleString('ar-EG', { month: 'long' });
    const year = today.getFullYear();
    setPayrollPeriod(`${month} ${year}`);
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          إنشاء كشف المرتبات بالذكاء الاصطناعي
        </h2>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <form action={formAction}>
            <CardHeader>
              <CardTitle>إنشاء كشف مرتبات جديد</CardTitle>
              <CardDescription>
                حدد الشهر المطلوب ثم اضغط على زر الإنشاء. سيقوم النظام بتحليل
                بيانات الحضور والانصراف وحساب الرواتب تلقائيًا مع معالجة
                الحالات الاستثنائية.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payroll-period">فترة كشف المرتبات</Label>
                <Input
                  id="payroll-period"
                  name="payrollPeriod"
                  value={payrollPeriod}
                  onChange={(e) => setPayrollPeriod(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        </Card>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>نتائج كشف المرتبات</CardTitle>
            <CardDescription>
              سيتم عرض تفاصيل الرواتب التي تم إنشاؤها هنا.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.payrollDetails ? (
              <pre className="mt-2 w-full overflow-auto rounded-md bg-secondary p-4 text-sm text-secondary-foreground">
                {JSON.stringify(state.payrollDetails, null, 2)}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                لم يتم إنشاء أي كشوفات بعد.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
