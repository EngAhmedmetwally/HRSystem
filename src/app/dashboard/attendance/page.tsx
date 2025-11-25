
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
import { attendanceRecords, employees } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FilterX } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  
  useEffect(() => {
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
  }, [searchParams]);

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

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);

      const start = startDate ? new Date(startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(0, 0, 0, 0);
      
      const isAfterStartDate = !start || recordDate >= start;
      const isBeforeEndDate = !end || recordDate <= end;
      const isEmployeeMatch = selectedEmployee === 'all' || record.employee.id === selectedEmployee;
      
      return isAfterStartDate && isBeforeEndDate && isEmployeeMatch;
    });
  }, [startDate, endDate, selectedEmployee]);
  
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedEmployee('all');
  };

  const hasActiveFilters = startDate !== undefined || endDate !== undefined || selectedEmployee !== 'all';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          سجل الحضور
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الحضور والانصراف</CardTitle>
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
                  {employees.map(emp => (
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
        </CardHeader>
        <CardContent>
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
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={record.employee.avatarUrl}
                            alt={record.employee.name}
                            data-ai-hint={record.employee.avatarHint}
                          />
                          <AvatarFallback>
                            {record.employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{record.employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.employee.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        {format(new Date(record.date), 'PPP', { locale: ar })}
                    </TableCell>
                    <TableCell>{record.checkIn || '---'}</TableCell>
                    <TableCell>{record.checkOut || '---'}</TableCell>
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
                        لا توجد نتائج مطابقة لبحثك.
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
