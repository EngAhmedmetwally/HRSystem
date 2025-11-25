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
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Employee, PayrollRecord, PayrollHistory } from '@/lib/types';
import { Download, Calculator, Banknote, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';


const getPayrollData = (employees: Employee[]): PayrollRecord[] => {
  return employees.map(emp => {
    // In a real app, this would involve complex calculations based on attendance.
    // For now, we use random data.
    const deductions = Math.floor(Math.random() * 500); 
    const overtime = Math.floor(Math.random() * 1000); 
    const grossPay = emp.salary.base + emp.salary.allowances;
    const netPay = grossPay - deductions + overtime;
    return {
      employeeId: emp.id,
      name: emp.name,
      deductions,
      overtime,
      grossPay,
      netPay,
    };
  });
};

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const employeesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesCollectionRef);

  const handleGeneratePayroll = () => {
    if (selectedMonth && employees) {
      setPayrollData(getPayrollData(employees));
    }
  };

  const handleDisburseSalaries = () => {
     if (payrollData.length > 0 && firestore) {
        const payrollHistoryRef = collection(firestore, 'payrollHistory');
        const totalNetPay = payrollData.reduce((acc, record) => acc + record.netPay, 0);

        const newPayrollHistory: Omit<PayrollHistory, 'id'> = {
            month: selectedMonth,
            year: selectedYear,
            generatedAt: Timestamp.now(),
            totalNetPay: totalNetPay,
            records: payrollData
        };

        addDocumentNonBlocking(payrollHistoryRef, newPayrollHistory);
        
        toast({
            title: 'تم صرف الرواتب بنجاح',
            description: `تم حفظ وتأكيد صرف رواتب شهر ${selectedMonth}.`,
        });
        
        // Optionally clear current payroll
        setPayrollData([]);
        setSelectedMonth('');
     }
  };
  
  const handleRowClick = (employeeId: string) => {
    if (!selectedMonth || !selectedYear) return;

    const monthIndex = months.findIndex(m => m.value === selectedMonth);
    if(monthIndex === -1) return;

    const date = new Date(selectedYear, monthIndex, 1);
    
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const query = new URLSearchParams({
        employeeId: employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
    }).toString();

    router.push(`/dashboard/attendance?${query}`);
  };

  const totalNetPay = useMemo(() => {
    return payrollData.reduce((acc, record) => acc + record.netPay, 0);
  }, [payrollData]);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(currentYear, i).toLocaleString('ar-EG', { month: 'long' });
    return { value: monthName, label: monthName };
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          كشف المرتبات
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>إنشاء كشف المرتبات</CardTitle>
              <CardDescription>اختر الشهر لإنشاء كشف المرتبات للموظفين.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Select onValueChange={(value) => setSelectedYear(parseInt(value))} value={selectedYear.toString()} dir="rtl">
                <SelectTrigger>
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setSelectedMonth} value={selectedMonth} dir="rtl">
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGeneratePayroll} disabled={!selectedMonth || employeesLoading} className="w-full">
                {employeesLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <Calculator className="ml-2 h-4 w-4" />}
                إنشاء الكشف
              </Button>
            </CardFooter>
          </Card>
           {payrollData.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">إجمالي صافي الرواتب</CardTitle>
                   <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalNetPay.toLocaleString()} ج.م
                  </div>
                   <p className="text-xs text-muted-foreground pt-1">
                      المبلغ الإجمالي المستحق لهذا الشهر
                   </p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleDisburseSalaries} className="w-full">
                        <Banknote className="ml-2 h-4 w-4" />
                        تأكيد صرف الرواتب
                    </Button>
                </CardFooter>
              </Card>
           )}
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>نتائج كشف المرتبات {selectedMonth && `لشهر ${selectedMonth}`}</CardTitle>
                  <CardDescription>تفاصيل رواتب الموظفين. اضغط على أي موظف لعرض سجل حضوره.</CardDescription>
                </div>
                {payrollData.length > 0 && (
                   <Button variant="outline">
                     <Download className="ml-2 h-4 w-4" />
                     تصدير كـ PDF
                   </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {payrollData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>الراتب الإجمالي</TableHead>
                      <TableHead>الإضافي</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead className="font-bold">صافي الراتب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.map((record) => (
                      <TableRow key={record.employeeId} onClick={() => handleRowClick(record.employeeId)} className="cursor-pointer">
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.grossPay.toLocaleString()} ج.م</TableCell>
                        <TableCell className="text-green-600">{record.overtime.toLocaleString()} ج.م</TableCell>
                        <TableCell className="text-destructive">{record.deductions.toLocaleString()} ج.م</TableCell>
                        <TableCell className="font-bold">{record.netPay.toLocaleString()} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>الرجاء اختيار شهر وإنشاء الكشف لعرض البيانات.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
