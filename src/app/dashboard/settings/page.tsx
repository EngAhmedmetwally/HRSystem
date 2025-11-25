'use client';

import { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const deductionRuleSchema = z.object({
  delayMinutes: z.coerce.number().min(1, 'يجب أن تكون قيمة موجبة'),
  deductionType: z.enum(['minutes', 'hours', 'amount']),
  deductionValue: z.coerce.number().min(1, 'يجب أن تكون قيمة موجبة'),
});

const settingsSchema = z.object({
  gracePeriod: z.coerce.number().min(0, 'يجب أن تكون قيمة موجبة أو صفر'),
  deductionRules: z.array(deductionRuleSchema),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [initialSettings] = useState<SettingsFormValues>({
    gracePeriod: 10,
    deductionRules: [
      { delayMinutes: 15, deductionType: 'minutes', deductionValue: 30 },
      { delayMinutes: 30, deductionType: 'hours', deductionValue: 1 },
    ],
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'deductionRules',
  });

  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    console.log(data);
    toast({
      title: 'تم حفظ الإعدادات',
      description: 'تم تحديث سياسة التأخيرات والخصومات بنجاح.',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          إعدادات النظام
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>سياسة الحضور والتأخير</CardTitle>
            <CardDescription>
              قم بتعريف قواعد حساب التأخيرات والخصومات المترتبة عليها.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="gracePeriod">فترة السماح (بالدقائق)</Label>
              <Input
                id="gracePeriod"
                type="number"
                {...register('gracePeriod')}
              />
              {errors.gracePeriod && (
                <p className="text-sm text-destructive mt-1">
                  {errors.gracePeriod.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                عدد الدقائق التي يُسمح للموظف بالتأخير فيها دون احتساب خصم.
              </p>
            </div>

            <div className="space-y-4">
              <Label>قواعد الخصم من التأخير</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-4 border rounded-lg bg-secondary/50">
                  <div className="grid gap-2 flex-1 w-full">
                     <Label>إذا تأخر الموظف</Label>
                    <div className="flex items-center gap-2">
                       <Input
                        type="number"
                        {...register(`deductionRules.${index}.delayMinutes`)}
                        className="w-24"
                      />
                      <span>دقيقة</span>
                    </div>
                     {errors.deductionRules?.[index]?.delayMinutes && (
                        <p className="text-sm text-destructive">{errors.deductionRules?.[index]?.delayMinutes?.message}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2 flex-1 w-full">
                     <Label>يتم خصم</Label>
                     <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          {...register(`deductionRules.${index}.deductionValue`)}
                           className="w-24"
                        />
                        <Select
                          defaultValue={field.deductionType}
                          onValueChange={(value) => {
                            const newRules = [...fields];
                            newRules[index].deductionType = value as 'minutes' | 'hours' | 'amount';
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="نوع الخصم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">دقيقة</SelectItem>
                            <SelectItem value="hours">ساعة</SelectItem>
                            <SelectItem value="amount">مبلغ</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                      {errors.deductionRules?.[index]?.deductionValue && (
                        <p className="text-sm text-destructive">{errors.deductionRules?.[index]?.deductionValue?.message}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                    className="shrink-0 mt-4 sm:mt-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               {errors.deductionRules && typeof errors.deductionRules === 'object' && !Array.isArray(errors.deductionRules) && (
                  <p className="text-sm text-destructive">{errors.deductionRules.root?.message}</p>
                )}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ delayMinutes: 60, deductionType: 'hours', deductionValue: 2 })}
              >
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة قاعدة جديدة
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">حفظ الإعدادات</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
