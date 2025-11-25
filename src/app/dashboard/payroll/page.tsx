'use client';

import { useState } from 'react';
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
import { employees } from '@/lib/mock-data';
import type { Employee } from '@/lib/types';
import { Download, Calculator } from 'lucide-react';

// Mock data for payroll calculation
const getPayrollData = (employees: Employee[]) => {
  return employees.map(emp => {
    const deductions = Math.floor(Math.random() * 200000); // Random deductions
    const overtime = Math.floor(Math.random() * 300000); // Random overtime
    const grossPay = emp.salary.base + emp.salary.allowances;
    const netPay = grossPay - deductions + overtime;
    return {
      ...emp,
      deductions,
      overtime,
      grossPay,
      netPay,
    };
  });
};

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [payrollData, setPayrollData] = useState<any[]>([]);

  const handleGeneratePayroll = () => {
    if (selectedMonth) {
      setPayrollData(getPayrollData(employees));
    }
  };
  
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(0, i).toLocaleString('ar-EG', { month: 'long' });
    return `${month} ${currentYear}`;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          كشف المرتبات
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>إنشاء كشف المرتبات</CardTitle>
              <CardDescription>اختر الشهر لإنشاء كشف المرتبات للموظفين.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={setSelectedMonth} value={selectedMonth} dir="rtl">
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGeneratePayroll} disabled={!selectedMonth} className="w-full">
                <Calculator className="ml-2 h-4 w-4" />
                إنشاء الكشف
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>نتائج كشف المرتبات {selectedMonth && `لشهر ${selectedMonth}`}</CardTitle>
                  <CardDescription>تفاصيل رواتب الموظفين المحسوبة.</CardDescription>
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
                      <TableRow key={record.id}>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.grossPay.toLocaleString()} د.ع</TableCell>
                        <TableCell className="text-green-600">{record.overtime.toLocaleString()} د.ع</TableCell>
                        <TableCell className="text-destructive">{record.deductions.toLocaleString()} د.ع</TableCell>
                        <TableCell className="font-bold">{record.netPay.toLocaleString()} د.ع</TableCell>
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
