'use server';
/**
 * @fileOverview Payroll generation flow that uses AI to identify and address edge cases.
 *
 * - generatePayrollWithEdgeCases - A function that generates payroll considering edge cases.
 * - GeneratePayrollInput - The input type for the generatePayrollWithEdgeCases function.
 * - GeneratePayrollOutput - The return type for the generatePayrollWithEdgeCases function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePayrollInputSchema = z.object({
  employeeRecords: z.string().describe('JSON string of employee records including attendance, deductions, and salary information.'),
  payrollPeriod: z.string().describe('The payroll period for which to generate payroll (e.g., "January 2024").'),
});
export type GeneratePayrollInput = z.infer<typeof GeneratePayrollInputSchema>;

const GeneratePayrollOutputSchema = z.object({
  payrollDetails: z.string().describe('JSON string containing detailed payroll information for each employee, including deductions and explanations of any edge cases addressed.'),
});
export type GeneratePayrollOutput = z.infer<typeof GeneratePayrollOutputSchema>;

export async function generatePayrollWithEdgeCases(input: GeneratePayrollInput): Promise<GeneratePayrollOutput> {
  return generatePayrollWithEdgeCasesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePayrollWithEdgeCasesPrompt',
  input: {schema: GeneratePayrollInputSchema},
  output: {schema: GeneratePayrollOutputSchema},
  prompt: `You are an expert HR assistant specializing in payroll generation. Given the employee records and payroll period, generate accurate monthly payroll, identifying and addressing potential edge cases or anomalies in employee attendance and deductions.

Employee Records: {{{employeeRecords}}}
Payroll Period: {{{payrollPeriod}}}

Consider the following potential edge cases:
* Unusual attendance patterns (e.g., excessive absences, sudden changes in working hours).
* Discrepancies between expected and actual deductions.
* Employees with multiple roles or pay rates.

Explain how you addressed each edge case in the payroll details.

Return the payroll details as a JSON string.
`,
});

const generatePayrollWithEdgeCasesFlow = ai.defineFlow(
  {
    name: 'generatePayrollWithEdgeCasesFlow',
    inputSchema: GeneratePayrollInputSchema,
    outputSchema: GeneratePayrollOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
