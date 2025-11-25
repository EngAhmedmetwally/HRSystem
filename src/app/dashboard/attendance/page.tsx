import Image from 'next/image';
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
import { attendanceRecords } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          سجل الحضور اليومي
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الحضور والانصراف</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>وقت الحضور</TableHead>
                <TableHead>وقت الانصراف</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
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
                  <TableCell>{record.checkIn || '---'}</TableCell>
                  <TableCell>{record.checkOut || '---'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
