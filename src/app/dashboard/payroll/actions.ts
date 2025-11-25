'use server';

import { generatePayrollWithEdgeCases } from '@/ai/flows/generate-payroll-with-edge-cases';
import { z } from 'zod';

const schema = z.object({
  payrollPeriod: z.string(),
});

type PayrollState = {
  message: string;
  payrollDetails?: object;
  error?: string;
};

export async function handlePayrollGeneration(
  prevState: PayrollState,
  formData: FormData
): Promise<PayrollState> {
  const validatedFields = schema.safeParse({
    payrollPeriod: formData.get('payrollPeriod'),
  });

  if (!validatedFields.success) {
    return {
      message: 'خطأ في التحقق.',
      error: 'فترة كشف المرتبات غير صالحة.',
    };
  }

  const { payrollPeriod } = validatedFields.data;

  // Mock employee records for AI processing
  const employeeRecords = JSON.stringify([
    { employeeId: '1', name: 'أحمد محمود', hoursWorked: 160, deductions: 50, sickDays: 1, baseSalary: 5000 },
    { employeeId: '2', name: 'فاطمة الزهراء', hoursWorked: 172, deductions: 0, sickDays: 0, baseSalary: 8000, bonus: 500 },
    { employeeId: '3', name: 'يوسف علي', hoursWorked: 120, deductions: 25, sickDays: 5, baseSalary: 4500, notes: "Unapproved long absence" },
    { employeeId: '4', name: 'مريم خالد', hoursWorked: 165, deductions: 100, sickDays: 0, baseSalary: 6000 },
    { employeeId: '5', name: 'عمر شريف', hoursWorked: 158, deductions: 50, sickDays: 0, baseSalary: 7000 },
  ], null, 2);

  try {
    const result = await generatePayrollWithEdgeCases({
      employeeRecords,
      payrollPeriod,
    });
    
    const payrollDetails = JSON.parse(result.payrollDetails);

    return { message: 'تم إنشاء كشف المرتبات بنجاح.', payrollDetails };
  } catch (e) {
    console.error(e);
    return {
      message: 'فشل إنشاء كشف المرتبات.',
      error: 'حدث خطأ غير متوقع أثناء التواصل مع خدمة الذكاء الاصطناعي.',
    };
  }
}
