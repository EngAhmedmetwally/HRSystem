'use client';

import { useState, useMemo } from 'react';
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
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AttendanceRecord } from '@/lib/types';


export default function AttendancePage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

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
      const isDateInRange = !dateRange?.from || (recordDate >= dateRange.from && (!dateRange.to || recordDate <= dateRange.to));
      const isEmployeeMatch = selectedEmployee === 'all' || record.employee.id === selectedEmployee;
      return isDateInRange && isEmployeeMatch;
    });
  }, [dateRange, selectedEmployee]);
  
  const clearFilters = () => {
    setDateRange(undefined);
    setSelectedEmployee('all');
  };

  const hasActiveFilters = dateRange !== undefined || selectedEmployee !== 'all';

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
           <div className="flex flex-col sm:flex-row gap-4 items-center pt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-full sm:w-[300px] justify-end text-right font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y', { locale: ar })} -{' '}
                          {format(dateRange.to, 'LLL dd, y', { locale: ar })}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y', { locale: ar })
                      )
                    ) : (
                      <span>اختر فترة زمنية</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
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
