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
import { Users, UserCheck, UserX, CalendarOff } from 'lucide-react';
import { weeklyAttendance, employees } from '@/lib/mock-data';

const stats = [
  { title: 'إجمالي الموظفين', value: employees.length, icon: Users, color: 'text-blue-500' },
  { title: 'الحضور اليومي', value: 3, icon: UserCheck, color: 'text-green-500' },
  { title: 'الغياب اليومي', value: 1, icon: UserX, color: 'text-red-500' },
  { title: 'في إجازة', value: 1, icon: CalendarOff, color: 'text-yellow-500' },
];

export default function DashboardPage() {
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
              <div className="text-2xl font-bold">{stat.value}</div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
