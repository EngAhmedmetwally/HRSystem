'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { PayrollHistory } from '@/lib/types';

function PayrollHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  )
}

export default function PayrollHistoryPage() {
  const firestore = useFirestore();
  
  const payrollsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'payrollHistory'), orderBy('year', 'desc'), orderBy('month', 'desc')) : null,
    [firestore]
  );
  
  const { data: payrollHistory, isLoading } = useCollection<PayrollHistory>(payrollsQuery);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          سجل كشوفات المرتبات
        </h2>
      </div>

      {isLoading && <PayrollHistorySkeleton />}

      {!isLoading && !payrollHistory?.length && (
          <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                  لا توجد سجلات لكشوفات مرتبات سابقة.
              </CardContent>
          </Card>
      )}

      {payrollHistory && payrollHistory.length > 0 && (
         <Card>
             <CardHeader>
                <CardTitle>الكشوفات المحفوظة</CardTitle>
                <CardDescription>هنا قائمة بجميع كشوفات المرتبات التي تم صرفها.</CardDescription>
             </CardHeader>
             <CardContent>
                <Accordion type="single" collapsible className="w-full">
                {payrollHistory.map((payroll) => (
                    <AccordionItem value={payroll.id} key={payroll.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4">
                            <span className="font-bold text-lg">كشف مرتبات شهر {payroll.month} {payroll.year}</span>
                            <div className="flex flex-col items-end text-sm">
                               <span>إجمالي الصرف: <Badge variant="secondary">{payroll.totalNetPay.toLocaleString()} ج.م</Badge></span>
                               <span className="text-xs text-muted-foreground mt-1">
                                   تم الإنشاء في: {format(payroll.generatedAt.toDate(), 'PPP p', { locale: ar })}
                                </span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم الموظف</TableHead>
                                    <TableHead>الراتب الإجمالي</TableHead>
                                    <TableHead>الإضافي</TableHead>
                                    <TableHead>الخصومات</TableHead>
                                    <TableHead className="font-bold text-primary">صافي الراتب</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payroll.records.map((record) => (
                                <TableRow key={record.employeeId}>
                                    <TableCell>{record.name}</TableCell>
                                    <TableCell>{record.grossPay.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="text-green-600">{record.overtime.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="text-destructive">{record.deductions.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="font-bold">{record.netPay.toLocaleString()} ج.م</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
             </CardContent>
         </Card>
      )}
    </div>
  );
}
