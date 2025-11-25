'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FilterX } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import type { AttendanceRecord, Employee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function AttendanceTableSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                     <Skeleton className="h-4 w-24" />
                     <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    )
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const isSuperUser = user?.email === 'admin@highclass.com' || user?.email === 'qdmin@highclass.com';


  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  
  const employeesCollectionRef = useMemoFirebase(
    () => (firestore && isSuperUser) ? collection(firestore, 'employees') : null,
    [firestore, isSuperUser]
  );
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesCollectionRef);
  
  // For non-admins, we need to get their own employee data to show their name
  const selfEmployeeDocRef = useMemoFirebase(() => (firestore && !isSuperUser && user) ? doc(firestore, 'employees', user.uid) : null, [firestore, isSuperUser, user]);
  const { data: selfEmployee, isLoading: selfEmployeeLoading } = useDoc<Employee>(selfEmployeeDocRef);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    // For regular users, ALWAYS fetch only their own data.
    if (!isSuperUser) {
        return query(collection(firestore, 'attendance'), where('employeeId', '==', user.uid));
    }
    
    // For SuperUser, apply filters
    let q = query(collection(firestore, 'attendance'));
    if (startDate) {
        q = query(q, where('date', '>=', format(startDate, 'yyyy-MM-dd')));
    }
    if (endDate) {
        q = query(q, where('date', '<=', format(endDate, 'yyyy-MM-dd')));
    }
    if (selectedEmployee !== 'all') {
        q = query(q, where('employeeId', '==', selectedEmployee));
    }
    
    return q;
  }, [firestore, startDate, endDate, selectedEmployee, isSuperUser, user]);

  const { data: attendanceRecords, isLoading: attendanceLoading } = useCollection<AttendanceRecord>(attendanceQuery);


  useEffect(() => {
    if (isSuperUser) {
        const employeeId = searchParams.get('employeeId');
        const urlStartDate = searchParams.get('startDate');
        const urlEndDate = searchParams.get('endDate');

        if (employeeId) {
            setSelectedEmployee(employeeId);
        }
        if (urlStartDate) {
            setStartDate(new Date(urlStartDate));
        }
        if (urlEndDate) {
            setEndDate(new Date(urlEndDate));
        }
    }
  }, [searchParams, isSuperUser]);

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
  
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedEmployee('all');
  };

  const hasActiveFilters = startDate !== undefined || endDate !== undefined || selectedEmployee !== 'all';
  const isLoading = (isSuperUser && employeesLoading) || attendanceLoading || (!isSuperUser && selfEmployeeLoading);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    if (isSuperUser && employees) {
        employees.forEach(e => map.set(e.id, e));
    } else if (selfEmployee) {
        map.set(selfEmployee.id, selfEmployee);
    }
    return map;
  }, [employees, selfEmployee, isSuperUser]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          {isSuperUser ? 'سجل الحضور' : 'سجلي الكامل'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isSuperUser ? 'قائمة الحضور والانصراف' : 'قائمة حضوري وانصرافي'}
          </CardTitle>
           {isSuperUser && (
           <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center pt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full sm:w-[240px] justify-end text-right font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: ar }) : <span>من تاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
              
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full sm:w-[240px] justify-end text-right font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                     <CalendarIcon className="ml-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: ar }) : <span>إلى تاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={{ before: startDate }}
                    initialFocus
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>

               <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الموظفين</SelectItem>
                  {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
               {hasActiveFilters && (
                 <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                   <FilterX className="ml-2 h-4 w-4" />
                    مسح الفلاتر
                 </Button>
               )}
           </div>
           )}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <AttendanceTableSkeleton />
            ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>وقت الحضور</TableHead>
                <TableHead>وقت الانصراف</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords && attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => {
                  const employee = employeeMap.get(record.employeeId);
                  return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={employee?.avatarUrl}
                            alt={employee?.name}
                            data-ai-hint={employee?.avatarHint}
                          />
                          <AvatarFallback>
                            {record.employeeName?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{record.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee?.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        {format(new Date(record.date), 'PPP', { locale: ar })}
                    </TableCell>
                    <TableCell>{record.checkIn ? format(record.checkIn.toDate(), 'p', {locale: ar}) : '---'}</TableCell>
                    <TableCell>{record.checkOut ? format(record.checkOut.toDate(), 'p', {locale: ar}) : '---'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  );
                })
               ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        لا توجد نتائج مطابقة لبحثك.
                    </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}