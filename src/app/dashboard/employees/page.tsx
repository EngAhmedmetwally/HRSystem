'use client';

import { useState, useEffect } from 'react';
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
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employees as initialEmployees } from '@/lib/mock-data';
import type { Employee } from '@/lib/types';
import { PlusCircle, Pencil } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { screens } from '@/lib/screens';

const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] as const;

const employeeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  username: z.string().min(3, 'اسم المستخدم مطلوب (3 أحرف على الأقل)'),
  password: z.string().optional(), // Made optional for editing
  role: z.string().min(1, 'الوظيفة مطلوبة'),
  department: z.string().min(1, 'القسم مطلوب'),
  baseSalary: z.coerce.number().min(0, 'الراتب الأساسي يجب أن يكون رقمًا موجبًا'),
  allowances: z.coerce.number().min(0, 'البدلات يجب أن تكون رقمًا موجبًا'),
  workScheduleType: z.enum(['default', 'custom']),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  weekends: z.array(z.enum(weekDays)).min(1, 'يجب اختيار يوم إجازة واحد على الأقل'),
  allowedScreens: z.array(z.string()).min(1, 'يجب اختيار شاشة واحدة على الأقل'),
}).refine(data => {
    if (data.workScheduleType === 'custom') {
        return !!data.startTime && !!data.endTime;
    }
    return true;
}, {
    message: 'يجب تحديد وقت البدء والانتهاء للدوام المخصص',
    path: ['startTime'],
}).refine(data => {
    // If password is provided, it must be at least 6 characters
    if (data.password && data.password.length > 0) {
        return data.password.length >= 6;
    }
    return true;
}, {
    message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    path: ['password'],
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
        workScheduleType: 'default',
        weekends: ['الجمعة', 'السبت'],
        allowedScreens: [],
        password: '',
    },
  });

  const workScheduleType = watch('workScheduleType');

  useEffect(() => {
    if (editingEmployee) {
      reset({
        name: editingEmployee.name,
        username: editingEmployee.username,
        password: '', // Don't pre-fill password
        role: editingEmployee.role,
        department: editingEmployee.department,
        baseSalary: editingEmployee.salary.base,
        allowances: editingEmployee.salary.allowances,
        workScheduleType: editingEmployee.workSchedule.type,
        startTime: editingEmployee.workSchedule.startTime,
        endTime: editingEmployee.workSchedule.endTime,
        weekends: editingEmployee.workSchedule.weekends,
        allowedScreens: editingEmployee.allowedScreens,
      });
      setIsDialogOpen(true);
    } else {
        reset({
             name: '',
             username: '',
             password: '',
             role: '',
             department: '',
             baseSalary: 0,
             allowances: 0,
             workScheduleType: 'default',
             startTime: '',
             endTime: '',
             weekends: ['الجمعة', 'السبت'],
             allowedScreens: [],
        });
    }
  }, [editingEmployee, reset]);

  const onSubmit: SubmitHandler<EmployeeFormData> = (data) => {
    if (editingEmployee) {
      // Update existing employee
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id ? {
          ...emp,
          name: data.name,
          username: data.username,
          // Only update password if a new one is provided
          password: data.password ? data.password : emp.password,
          role: data.role,
          department: data.department,
          salary: {
            base: data.baseSalary,
            allowances: data.allowances,
          },
          workSchedule: {
            type: data.workScheduleType,
            startTime: data.startTime,
            endTime: data.endTime,
            weekends: data.weekends,
          },
          allowedScreens: data.allowedScreens,
        } : emp
      );
      setEmployees(updatedEmployees);
    } else {
      // Add new employee
      if (!data.password) {
        // Handle case where new employee form doesn't have a password. 
        // This should be caught by validation, but as a fallback.
        alert('كلمة المرور مطلوبة للموظف الجديد');
        return;
      }
      const newEmployee: Employee = {
        id: (employees.length + 1).toString(),
        name: data.name,
        username: data.username,
        password: data.password, // In a real app, this should be hashed
        role: data.role,
        department: data.department,
        salary: {
          base: data.baseSalary,
          allowances: data.allowances,
        },
        workSchedule: {
          type: data.workScheduleType,
          startTime: data.startTime,
          endTime: data.endTime,
          weekends: data.weekends,
        },
        allowedScreens: data.allowedScreens,
        avatarUrl: `https://picsum.photos/seed/${employees.length + 1}/100/100`,
        avatarHint: 'person',
      };
      setEmployees([...employees, newEmployee]);
    }
    closeDialog();
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  const openAddDialog = () => {
    setEditingEmployee(null);
    reset({
         name: '',
         username: '',
         password: '',
         role: '',
         department: '',
         baseSalary: 0,
         allowances: 0,
         workScheduleType: 'default',
         startTime: '',
         endTime: '',
         weekends: ['الجمعة', 'السبت'],
         allowedScreens: [],
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          إدارة الموظفين
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة موظف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</DialogTitle>
            </DialogHeader>
             <ScrollArea className="h-[70vh] p-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم الموظف</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                  </div>
                   <div>
                    <Label htmlFor="username">اسم المستخدم</Label>
                    <Input id="username" {...register('username')} />
                    {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
                  </div>
                   <div>
                    <Label htmlFor="password">كلمة المرور (اتركها فارغة لعدم التغيير)</Label>
                    <Input id="password" type="password" {...register('password')} placeholder="******" />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
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
              </div>
              
              <div className="space-y-4 border-t pt-4">
                 <Label>اعدادات الشيفت</Label>
                 <Controller
                    control={control}
                    name="workScheduleType"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4"
                      >
                        <Label className="flex items-center gap-2 border p-3 rounded-md cursor-pointer has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                          <RadioGroupItem value="default" id="r1" />
                          الدوام العام للشركة
                        </Label>
                        <Label className="flex items-center gap-2 border p-3 rounded-md cursor-pointer has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                          <RadioGroupItem value="custom" id="r2" />
                          دوام مخصص
                        </Label>
                      </RadioGroup>
                    )}
                  />

                {workScheduleType === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-secondary/30">
                        <div>
                            <Label htmlFor="startTime">وقت الحضور</Label>
                            <Input id="startTime" type="time" {...register('startTime')} />
                        </div>
                        <div>
                            <Label htmlFor="endTime">وقت الانصراف</Label>
                            <Input id="endTime" type="time" {...register('endTime')} />
                        </div>
                         {errors.startTime && <p className="text-sm text-destructive mt-1 col-span-2">{errors.startTime.message}</p>}
                    </div>
                )}
              </div>

               <div className="space-y-2 border-t pt-4">
                  <Label>أيام الإجازة الأسبوعية</Label>
                  <Controller
                    name="weekends"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {weekDays.map((day) => (
                          <Label
                            key={day}
                            className="flex items-center gap-2 p-2 border rounded-md cursor-pointer has-[input:checked]:bg-secondary has-[input:checked]:text-secondary-foreground"
                          >
                            <Checkbox
                              checked={field.value?.includes(day)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), day])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== day
                                      )
                                    );
                              }}
                            />
                            {day}
                          </Label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.weekends && <p className="text-sm text-destructive mt-1">{errors.weekends.message}</p>}
                </div>
                
                <div className="space-y-2 border-t pt-4">
                  <Label>صلاحيات الوصول للشاشات</Label>
                  <Controller
                    name="allowedScreens"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {screens.map((screen) => (
                          <Label
                            key={screen.id}
                            className="flex items-center gap-2 p-2 border rounded-md cursor-pointer has-[input:checked]:bg-secondary has-[input:checked]:text-secondary-foreground"
                          >
                            <Checkbox
                              checked={field.value?.includes(screen.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), screen.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== screen.id
                                      )
                                    );
                              }}
                            />
                            {screen.label}
                          </Label>
                        ))}
                      </div>
                    )}
                  />
                   {errors.allowedScreens && <p className="text-sm text-destructive mt-1">{errors.allowedScreens.message}</p>}
                </div>


              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="secondary" onClick={closeDialog}>
                    إلغاء
                  </Button>
                </DialogClose>
                <Button type="submit">{editingEmployee ? 'حفظ التعديلات' : 'إضافة'}</Button>
              </DialogFooter>
            </form>
             </ScrollArea>
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
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الوظيفة</TableHead>
                <TableHead>الدوام</TableHead>
                <TableHead>إجمالي الراتب</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee, index) => {
                const totalSalary = employee.salary.base + employee.salary.allowances;
                return (
                  <TableRow key={employee.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.username}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      {employee.workSchedule.type === 'default' ? 'عام' : 
                       `مخصص (${employee.workSchedule.startTime} - ${employee.workSchedule.endTime})`
                      }
                    </TableCell>
                    <TableCell className="font-medium">{totalSalary.toLocaleString()} ج.م</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setEditingEmployee(employee)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
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
