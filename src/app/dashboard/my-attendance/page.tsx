'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { attendanceRecords } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Employee, AttendanceRecord } from '@/lib/types';
import { Clock, UserCheck, UserX, CalendarOff } from 'lucide-react';


export default function MyAttendancePage() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [userRecords, setUserRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user: Employee = JSON.parse(userJson);
      setCurrentUser(user);
      const records = attendanceRecords.filter(record => record.employee.id === user.id);
      setUserRecords(records);
    }
  }, []);

  const getStatusVariant = (status: 'حاضر' | 'غائب' | 'في إجازة') => {
    switch (status) {
      case 'حاضر':
        return 'default';
      case 'غائب':
        return 'destructive';
      case 'في إجازة':
        return 'secondary';
    }
  };
  
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const recordsThisMonth = userRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    const presentDays = recordsThisMonth.filter(r => r.status === 'حاضر').length;
    const absentDays = recordsThisMonth.filter(r => r.status === 'غائب').length;
    const onLeaveDays = recordsThisMonth.filter(r => r.status === 'في إجازة').length;
    const totalDelayMinutes = recordsThisMonth.reduce((acc, r) => acc + (r.delayMinutes || 0), 0);

    return { presentDays, absentDays, onLeaveDays, totalDelayMinutes };
  }, [userRecords]);

   const stats = [
    { title: 'أيام الحضور', value: monthlyStats.presentDays, icon: UserCheck, color: 'text-green-500' },
    { title: 'أيام الغياب', value: monthlyStats.absentDays, icon: UserX, color: 'text-red-500' },
    { title: 'إجمالي التأخير (دقيقة)', value: monthlyStats.totalDelayMinutes, icon: Clock, color: 'text-orange-500' },
    { title: 'أيام الإجازة', value: monthlyStats.onLeaveDays, icon: CalendarOff, color: 'text-yellow-500' },
  ];


  if (!currentUser) {
    return (
       <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
           <h2 className="text-3xl font-bold tracking-tight font-headline">جاري تحميل بياناتك...</h2>
       </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          سجل حضوري وانصرافي
        </h2>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
               <p className="text-xs text-muted-foreground pt-1">
                 خلال الشهر الحالي
               </p>
            </CardContent>
          </Card>
        ))}
      </div>


      <Card>
        <CardHeader>
          <CardTitle>سجلي الكامل</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>وقت الحضور</TableHead>
                <TableHead>وقت الانصراف</TableHead>
                <TableHead>مدة التأخير (دقيقة)</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRecords.length > 0 ? (
                userRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                        {format(new Date(record.date), 'PPP', { locale: ar })}
                    </TableCell>
                    <TableCell>{record.checkIn || '---'}</TableCell>
                    <TableCell>{record.checkOut || '---'}</TableCell>
                    <TableCell className={cn(record.delayMinutes && record.delayMinutes > 0 ? "text-orange-600 font-medium" : "")}>
                        {record.delayMinutes || '0'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        لا توجد سجلات حضور حتى الآن.
                    </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
