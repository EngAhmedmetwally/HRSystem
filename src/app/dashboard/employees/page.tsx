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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employees as initialEmployees } from '@/lib/mock-data';
import type { Employee } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const employeeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  role: z.string().min(1, 'الوظيفة مطلوبة'),
  department: z.string().min(1, 'القسم مطلوب'),
  baseSalary: z.coerce.number().min(0, 'الراتب الأساسي يجب أن يكون رقمًا موجبًا'),
  allowances: z.coerce.number().min(0, 'البدلات يجب أن تكون رقمًا موجبًا'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  const onSubmit: SubmitHandler<EmployeeFormData> = (data) => {
    const newEmployee: Employee = {
      id: (employees.length + 1).toString(),
      name: data.name,
      role: data.role,
      department: data.department,
      salary: {
        base: data.baseSalary,
        allowances: data.allowances,
      },
      // Mock data for avatar
      avatarUrl: `https://picsum.photos/seed/${employees.length + 1}/100/100`,
      avatarHint: 'person',
    };
    setEmployees([...employees, newEmployee]);
    reset();
    setIsDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          إدارة الموظفين
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة موظف جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم الموظف</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="role">الوظيفة</Label>
                <Input id="role" {...register('role')} />
                {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
              </div>
              <div>
                <Label htmlFor="department">القسم</Label>
                <Input id="department" {...register('department')} />
                {errors.department && <p className="text-sm text-destructive mt-1">{errors.department.message}</p>}
              </div>
              <div>
                <Label htmlFor="baseSalary">الراتب الأساسي</Label>
                <Input id="baseSalary" type="number" {...register('baseSalary')} />
                {errors.baseSalary && <p className="text-sm text-destructive mt-1">{errors.baseSalary.message}</p>}
              </div>
              <div>
                <Label htmlFor="allowances">البدلات</Label>
                <Input id="allowances" type="number" {...register('allowances')} />
                {errors.allowances && <p className="text-sm text-destructive mt-1">{errors.allowances.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    إلغاء
                  </Button>
                </DialogClose>
                <Button type="submit">إضافة</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
          <CardDescription>عرض وتعديل بيانات الموظفين والرواتب.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الوظيفة</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الراتب الأساسي</TableHead>
                <TableHead>البدلات</TableHead>
                <TableHead>إجمالي الراتب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee, index) => {
                const totalSalary = employee.salary.base + employee.salary.allowances;
                return (
                  <TableRow key={employee.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.department || 'غير محدد'}</TableCell>
                    <TableCell>{employee.salary.base.toLocaleString()} د.ع</TableCell>
                    <TableCell>{employee.salary.allowances.toLocaleString()} د.ع</TableCell>
                    <TableCell className="font-medium">{totalSalary.toLocaleString()} د.ع</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
