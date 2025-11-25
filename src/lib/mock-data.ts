import type { Employee, AttendanceRecord } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getPlaceholderImage = (id: string) => {
    const image = PlaceHolderImages.find(img => img.id === id);
    return image || { imageUrl: 'https://picsum.photos/seed/default/100/100', imageHint: 'person' };
};

export const employees: Employee[] = [
  { 
    id: '1', 
    name: 'أحمد محمود', 
    role: 'مهندس برمجيات', 
    department: 'التطوير',
    salary: { base: 1200000, allowances: 300000 },
    ...getPlaceholderImage('employee-1') 
  },
  { 
    id: '2', 
    name: 'فاطمة الزهراء', 
    role: 'مديرة مشروع', 
    department: 'الإدارة',
    salary: { base: 2000000, allowances: 500000 },
    ...getPlaceholderImage('employee-2') 
  },
  { 
    id: '3', 
    name: 'يوسف علي', 
    role: 'مصمم واجهات', 
    department: 'التصميم',
    salary: { base: 900000, allowances: 200000 },
    ...getPlaceholderImage('employee-3') 
  },
  { 
    id: '4', 
    name: 'مريم خالد', 
    role: 'محللة بيانات',
    department: 'البيانات',
    salary: { base: 1500000, allowances: 350000 },
     ...getPlaceholderImage('employee-4') 
    },
  { 
    id: '5', 
    name: 'عمر شريف', 
    role: 'مهندس DevOps',
    department: 'العمليات',
    salary: { base: 1800000, allowances: 400000 },
    ...getPlaceholderImage('employee-5') 
  },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'rec1', employee: employees[0], checkIn: '09:05 ص', checkOut: '05:15 م', status: 'حاضر' },
  { id: 'rec2', employee: employees[1], checkIn: '08:58 ص', checkOut: '05:02 م', status: 'حاضر' },
  { id: 'rec3', employee: employees[2], checkIn: null, checkOut: null, status: 'غائب' },
  { id: 'rec4', employee: employees[3], checkIn: null, checkOut: null, status: 'في إجازة' },
  { id: 'rec5', employee: employees[4], checkIn: '09:15 ص', checkOut: '04:50 م', status: 'حاضر' },
];

export const weeklyAttendance = [
    { day: 'الأحد', حاضر: 4, غائب: 1 },
    { day: 'الاثنين', حاضر: 5, غائب: 0 },
    { day: 'الثلاثاء', حاضر: 4, غائب: 1 },
    { day: 'الأربعاء', حاضر: 5, غائب: 0 },
    { day: 'الخميس', حاضر: 3, غائب: 2 },
];
