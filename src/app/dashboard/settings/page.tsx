
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, SubmitHandler, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, LocateFixed, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const deductionRuleSchema = z.object({
  delayMinutes: z.coerce.number().min(1, 'يجب أن تكون قيمة موجبة'),
  deductionType: z.enum(['minutes', 'hours', 'amount']),
  deductionValue: z.coerce.number().min(1, 'يجب أن تكون قيمة موجبة'),
  period: z.enum(['daily', 'monthly']),
});

const settingsSchema = z.object({
  companyStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "صيغة الوقت غير صحيحة (مثال: 09:00)"),
  companyEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "صيغة الوقت غير صحيحة (مثال: 17:00)"),
  gracePeriod: z.coerce.number().min(0, 'يجب أن تكون قيمة موجبة أو صفر'),
  gracePeriodType: z.enum(['daily', 'monthly']),
  deductionRules: z.array(deductionRuleSchema),
  companyLatitude: z.coerce.number().min(-90, 'قيمة غير صالحة').max(90, 'قيمة غير صالحة'),
  companyLongitude: z.coerce.number().min(-180, 'قيمة غير صالحة').max(180, 'قيمة غير صالحة'),
  allowedRadiusMeters: z.coerce.number().min(5, 'يجب أن يكون النطاق 5 أمتار على الأقل'),
  qrCodeLifespan: z.coerce.number().min(5, 'يجب أن تكون المدة 5 ثوان على الأقل'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SETTINGS_STORAGE_KEY = 'app-settings';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const [initialSettings, setInitialSettings] = useState<SettingsFormValues>({
    companyStartTime: '09:00',
    companyEndTime: '17:00',
    gracePeriod: 10,
    gracePeriodType: 'daily',
    deductionRules: [
      { delayMinutes: 15, deductionType: 'minutes', deductionValue: 30, period: 'daily' },
      { delayMinutes: 30, deductionType: 'hours', deductionValue: 1, period: 'daily' },
    ],
    companyLatitude: 30.0444, // Default Cairo
    companyLongitude: 31.2357, // Default Cairo
    allowedRadiusMeters: 200,
    qrCodeLifespan: 15,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
  });

   useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setInitialSettings(parsedSettings);
      reset(parsedSettings); // Reset form with loaded data
    }
  }, [reset]);


  const { fields, append, remove } = useFieldArray({
    control,
    name: 'deductionRules',
  });

  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
    toast({
      title: 'تم حفظ الإعدادات',
      description: 'تم تحديث إعدادات النظام بنجاح.',
    });
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'خدمة تحديد المواقع غير مدعومة.' });
        setIsLocating(false);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setValue('companyLatitude', position.coords.latitude, { shouldValidate: true });
            setValue('companyLongitude', position.coords.longitude, { shouldValidate: true });
            toast({ title: 'نجاح', description: 'تم تحديد الموقع بنجاح.' });
            setIsLocating(false);
        },
        (error) => {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديد الموقع. يرجى تفعيل الإذن.' });
            setIsLocating(false);
        }
    );
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
            <CardTitle>الإعدادات العامة للشركة</CardTitle>
            <CardDescription>
              قم بتعريف القواعد العامة للدوام والتأخيرات والخصومات والموقع الجغرافي.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* General Work Hours */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">الدوام العام</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-secondary/30">
                <div>
                  <Label htmlFor="companyStartTime">وقت الحضور العام</Label>
                  <Input
                    id="companyStartTime"
                    type="time"
                    {...register('companyStartTime')}
                  />
                  {errors.companyStartTime && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.companyStartTime.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="companyEndTime">وقت الانصراف العام</Label>
                  <Input
                    id="companyEndTime"
                    type="time"
                    {...register('companyEndTime')}
                  />
                  {errors.companyEndTime && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.companyEndTime.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

             <Separator />
            
             {/* Security Settings */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">إعدادات الأمان والتحقق</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-secondary/30">
                 <div>
                    <Label htmlFor="qrCodeLifespan">مدة صلاحية رمز QR (بالثواني)</Label>
                    <Input
                        id="qrCodeLifespan"
                        type="number"
                        {...register('qrCodeLifespan')}
                    />
                    {errors.qrCodeLifespan && (
                        <p className="text-sm text-destructive mt-1">
                        {errors.qrCodeLifespan.message}
                        </p>
                    )}
                </div>
                 <div>
                    <Label htmlFor="allowedRadiusMeters">نطاق تسجيل الحضور المسموح به (بالمتر)</Label>
                    <Input
                        id="allowedRadiusMeters"
                        type="number"
                        {...register('allowedRadiusMeters')}
                    />
                    {errors.allowedRadiusMeters && (
                        <p className="text-sm text-destructive mt-1">
                        {errors.allowedRadiusMeters.message}
                        </p>
                    )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Geolocation Settings */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">الموقع الجغرافي للشركة</Label>
               <p className="text-sm text-muted-foreground">
                    يُستخدم هذا الموقع للتحقق من أن الموظف يسجل حضوره من داخل النطاق المسموح به.
                </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-secondary/30">
                <div>
                  <Label htmlFor="companyLatitude">خط العرض (Latitude)</Label>
                  <Input
                    id="companyLatitude"
                    type="number"
                    step="any"
                    {...register('companyLatitude')}
                  />
                  {errors.companyLatitude && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.companyLatitude.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="companyLongitude">خط الطول (Longitude)</Label>
                  <Input
                    id="companyLongitude"
                    type="number"
                     step="any"
                    {...register('companyLongitude')}
                  />
                  {errors.companyLongitude && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.companyLongitude.message}
                    </p>
                  )}
                </div>
                <div className="col-span-full">
                    <Button type="button" variant="outline" onClick={handleGetCurrentLocation} disabled={isLocating}>
                         {isLocating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <LocateFixed className="ml-2 h-4 w-4" />}
                        تحديد موقعي الحالي
                    </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Attendance and Delay Policy */}
            <div className="space-y-6">
                <Label className="text-lg font-medium">سياسة الحضور والتأخير</Label>
                 <div className="space-y-2">
                    <Label htmlFor="gracePeriod">فترة السماح بالتأخير</Label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2">
                            <Input
                                id="gracePeriod"
                                type="number"
                                className="w-32"
                                {...register('gracePeriod')}
                            />
                            <span>دقيقة</span>
                        </div>
                        <Controller
                            control={control}
                            name="gracePeriodType"
                            render={({ field }) => (
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex gap-4 items-center"
                            >
                                <Label className="flex items-center gap-2 border p-2 px-3 rounded-md cursor-pointer has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                                <RadioGroupItem value="daily" id="r-daily" />
                                يوميًا
                                </Label>
                                <Label className="flex items-center gap-2 border p-2 px-3 rounded-md cursor-pointer has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                                <RadioGroupItem value="monthly" id="r-monthly" />
                                شهريًا
                                </Label>
                            </RadioGroup>
                            )}
                        />
                    </div>
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
                    <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-lg bg-secondary/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
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
                                    <Controller
                                        control={control}
                                        name={`deductionRules.${index}.deductionType`}
                                        render={({ field: selectField }) => (
                                            <Select
                                            value={selectField.value}
                                            onValueChange={selectField.onChange}
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
                                        )}
                                    />
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
                        <div className="w-full">
                             <Controller
                                control={control}
                                name={`deductionRules.${index}.period`}
                                render={({ field }) => (
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex gap-4 items-center pt-2"
                                >
                                    <Label className={cn("text-xs flex items-center gap-2 border p-2 px-3 rounded-md cursor-pointer has-[input:checked]:bg-primary has-[input-checked]:text-primary-foreground")}>
                                        <RadioGroupItem value="daily" id={`r-daily-${index}`} />
                                        يوميًا
                                    </Label>
                                    <Label className={cn("text-xs flex items-center gap-2 border p-2 px-3 rounded-md cursor-pointer has-[input:checked]:bg-primary has-[input-checked]:text-primary-foreground")}>
                                        <RadioGroupItem value="monthly" id={`r-monthly-${index}`} />
                                        شهريًا
                                    </Label>
                                </RadioGroup>
                                )}
                            />
                        </div>
                    </div>
                ))}
                {errors.deductionRules && typeof errors.deductionRules === 'object' && !Array.isArray(errors.deductionRules) && (
                    <p className="text-sm text-destructive">{errors.deductionRules.root?.message}</p>
                )}

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ delayMinutes: 60, deductionType: 'hours', deductionValue: 2, period: 'daily' })}
                >
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة قاعدة جديدة
                </Button>
                </div>
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
