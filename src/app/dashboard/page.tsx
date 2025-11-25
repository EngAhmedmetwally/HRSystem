'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, UserCheck, UserX, CalendarOff, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Employee, AttendanceRecord } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DashboardPage() {
  const firestore = useFirestore();

  const employeesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesCollectionRef);
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const attendanceTodayQuery = useMemoFirebase(() => {
    return firestore ? query(collection(firestore, 'attendance'), where('date', '==', todayStr)) : null;
  }, [firestore, todayStr]);
  const { data: attendanceToday, isLoading: todayAttendanceLoading } = useCollection<AttendanceRecord>(attendanceTodayQuery);
  
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchWeeklyData = async () => {
        setWeeklyLoading(true);
        const now = new Date();
        const weekStart = startOfWeek(now, { locale: ar });
        const weekEnd = endOfWeek(now, { locale: ar });

        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const weeklyData = await Promise.all(weekDays.map(async (day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayName = format(day, 'EEEE', { locale: ar });

            const q = query(collection(firestore, 'attendance'), where('date', '==', dayStr));
            const snapshot = await getDocs(q);
            
            let present = 0;
            let absent = 0;
            
            snapshot.forEach(doc => {
                const record = doc.data() as AttendanceRecord;
                if (record.status === 'حاضر') present++;
                else if (record.status === 'غائب') absent++;
            });
            
            return { day: dayName, 'حاضر': present, 'غائب': absent };
        }));

        setWeeklyAttendance(weeklyData);
        setWeeklyLoading(false);
    }
    
    fetchWeeklyData();

  }, [firestore]);


  const todayStats = useMemo(() => {
    if (!attendanceToday) return { present: 0, absent: 0, onLeave: 0 };
    const present = attendanceToday.filter(r => r.status === 'حاضر').length;
    const absent = attendanceToday.filter(r => r.status === 'غائب').length;
    const onLeave = attendanceToday.filter(r => r.status === 'في إجازة').length;
    return { present, absent, onLeave };
  }, [attendanceToday]);


  const isLoading = employeesLoading || todayAttendanceLoading;

  const stats = [
    { title: 'إجمالي الموظفين', value: employees?.length ?? 0, icon: Users, color: 'text-blue-500' },
    { title: 'الحضور اليومي', value: todayStats.present, icon: UserCheck, color: 'text-green-500' },
    { title: 'الغياب اليومي', value: todayStats.absent, icon: UserX, color: 'text-red-500' },
    { title: 'في إجازة', value: todayStats.onLeave, icon: CalendarOff, color: 'text-yellow-500' },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          لوحة التحكم الرئيسية
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
               {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stat.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة على الحضور الأسبوعي</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {weeklyLoading ? (
                <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    direction: 'rtl',
                  }}
                />
                <Legend wrapperStyle={{ direction: 'rtl' }} />
                <Bar dataKey="حاضر" fill="hsl(var(--primary))" name="حاضر" radius={[4, 4, 0, 0]} />
                <Bar dataKey="غائب" fill="hsl(var(--accent))" name="غائب" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
