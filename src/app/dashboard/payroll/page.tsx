'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export default function PayrollPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          كشف المرتبات
        </h2>
      </div>
      <div className="flex items-center justify-center pt-16">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 w-fit">
              <Wallet className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">
              وحدة كشف المرتبات قيد الإنشاء
            </CardTitle>
            <CardDescription>
              نعمل حاليًا على تطوير هذه الميزة. ستكون متاحة قريبًا لإدارة
              رواتب الموظفين بشكل آلي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              شكرًا لك على سعة صدرك.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
