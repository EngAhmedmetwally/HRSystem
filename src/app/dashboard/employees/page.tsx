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
import type { Employee } from '@/lib/types';
import { PlusCircle, Pencil, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { screens } from '@/lib/screens';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] as const;

const employeeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().optional(),
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
  const { toast } = useToast();
  const firestore = useFirestore();
  const employeesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesCollectionRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
        workScheduleType: 'default',
        weekends: ['الجمعة', 'السبت'],
        allowedScreens: [],
        password: '',
        email: '',
    },
  });

  const workScheduleType = watch('workScheduleType');

  useEffect(() => {
    if (editingEmployee) {
      reset({
        name: editingEmployee.name,
        email: editingEmployee.email,
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
             email: '',
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

  const onSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    if (!firestore) return;
    
    try {
        if (editingEmployee) {
            // Update existing employee in Firestore
            const employeeDocRef = doc(firestore, 'employees', editingEmployee.id);
            const updatedData: Partial<Employee> = {
                name: data.name,
                email: data.email, // Note: Changing email in Auth is a separate, complex process
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
            };
            setDocumentNonBlocking(employeeDocRef, updatedData, { merge: true });
            toast({ title: "تم تحديث بيانات الموظف بنجاح" });

        } else {
            // Add new employee
            if (!data.password) {
                toast({ variant: 'destructive', title: 'خطأ', description: 'كلمة المرور مطلوبة للموظف الجديد.' });
                return;
            }
            
            // 1. Create user in Firebase Auth
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const newUserId = userCredential.user.uid;

            // 2. Create employee document in Firestore
            const newEmployeeDocRef = doc(firestore, 'employees', newUserId);
            const newEmployee: Omit<Employee, 'id'> = {
                name: data.name,
                email: data.email,
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
                avatarUrl: `https://picsum.photos/seed/${newUserId}/100/100`,
                avatarHint: 'person',
            };
            setDocumentNonBlocking(newEmployeeDocRef, newEmployee, {});
            toast({ title: "تم إضافة الموظف بنجاح" });
        }
        closeDialog();
    } catch (error: any) {
        console.error("Error saving employee:", error);
        let message = "حدث خطأ أثناء حفظ بيانات الموظف.";
        if (error.code === 'auth/email-already-in-use') {
            message = "هذا البريد الإلكتروني مستخدم بالفعل.";
        }
        toast({ variant: 'destructive', title: 'خطأ', description: message });
    }
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  const openAddDialog = () => {
    setEditingEmployee(null);
    reset({
         name: '',
         email: '',
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
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" {...register('email')} disabled={!!editingEmployee} />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                   <div>
                    <Label htmlFor="password">{editingEmployee ? 'كلمة مرور جديدة (اتركها فارغة لعدم التغيير)' : 'كلمة المرور'}</Label>
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
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {editingEmployee ? 'حفظ التعديلات' : 'إضافة'}
                </Button>
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
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الوظيفة</TableHead>
                <TableHead>الدوام</TableHead>
                <TableHead>إجمالي الراتب</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {employees && employees.map((employee, index) => {
                const totalSalary = employee.salary.base + employee.salary.allowances;
                return (
                  <TableRow key={employee.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
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
