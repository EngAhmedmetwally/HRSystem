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
    username: 'ahmed.m',
    password: 'password123',
    role: 'مهندس برمجيات', 
    department: 'التطوير',
    salary: { base: 12000, allowances: 3000 },
    avatarUrl: `https://picsum.photos/seed/1/100/100`,
    avatarHint: 'man portrait',
    workSchedule: { type: 'default', weekends: ['الجمعة', 'السبت'] },
    allowedScreens: ['dashboard', 'attendance', 'qr-code', 'my-attendance']
  },
  { 
    id: '2', 
    name: 'فاطمة الزهراء', 
    username: 'fatima.z',
    password: 'password123',
    role: 'مديرة مشروع', 
    department: 'الإدارة',
    salary: { base: 20000, allowances: 5000 },
    avatarUrl: `https://picsum.photos/seed/2/100/100`,
    avatarHint: 'woman portrait',
    workSchedule: { type: 'default', weekends: ['الجمعة', 'السبت'] },
    allowedScreens: ['dashboard', 'attendance', 'employees', 'qr-code', 'payroll', 'settings', 'my-attendance']
  },
  { 
    id: '3', 
    name: 'يوسف علي', 
    username: 'yousef.a',
    password: 'password123',
    role: 'مصمم واجهات', 
    department: 'التصميم',
    salary: { base: 9000, allowances: 2000 },
    avatarUrl: `https://picsum.photos/seed/3/100/100`,
    avatarHint: 'man smiling',
    workSchedule: { type: 'custom', startTime: '10:00', endTime: '18:00', weekends: ['الجمعة', 'السبت'] },
    allowedScreens: ['dashboard', 'attendance', 'my-attendance']
  },
  { 
    id: '4', 
    name: 'مريم خالد', 
    username: 'mariam.k',
    password: 'password123',
    role: 'محللة بيانات',
    department: 'البيانات',
    salary: { base: 15000, allowances: 3500 },
    avatarUrl: `https://picsum.photos/seed/4/100/100`,
    avatarHint: 'woman glasses',
    workSchedule: { type: 'default', weekends: ['الجمعة', 'السبت'] },
    allowedScreens: ['dashboard', 'attendance', 'payroll', 'my-attendance']
    },
  { 
    id: '5', 
    name: 'عمر شريف', 
    username: 'omar.s',
    password: 'password123',
    role: 'مهندس DevOps',
    department: 'العمليات',
    salary: { base: 18000, allowances: 4000 },
    avatarUrl: `https://picsum.photos/seed/5/100/100`,
    avatarHint: 'person professional',
    workSchedule: { type: 'default', weekends: ['الجمعة'] },
    allowedScreens: ['dashboard', 'attendance', 'settings', 'my-attendance']
  },
];

// Helper to get a date from X days ago
const getDateAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};


export const attendanceRecords: AttendanceRecord[] = [
  { id: 'rec1', employee: employees[0], date: getDateAgo(0), checkIn: '09:05 ص', checkOut: '05:15 م', status: 'حاضر', delayMinutes: 5 },
  { id: 'rec2', employee: employees[1], date: getDateAgo(0), checkIn: '08:58 ص', checkOut: '05:02 م', status: 'حاضر', delayMinutes: 0 },
  { id: 'rec3', employee: employees[2], date: getDateAgo(0), checkIn: null, checkOut: null, status: 'غائب', delayMinutes: 0 },
  { id: 'rec4', employee: employees[3], date: getDateAgo(0), checkIn: null, checkOut: null, status: 'في إجازة', delayMinutes: 0 },
  { id: 'rec5', employee: employees[4], date: getDateAgo(0), checkIn: '09:15 ص', checkOut: '04:50 م', status: 'حاضر', delayMinutes: 15 },
  // Yesterday's records
  { id: 'rec6', employee: employees[0], date: getDateAgo(1), checkIn: '09:02 ص', checkOut: '05:05 م', status: 'حاضر', delayMinutes: 2 },
  { id: 'rec7', employee: employees[1], date: getDateAgo(1), checkIn: '09:00 ص', checkOut: '05:00 م', status: 'حاضر', delayMinutes: 0 },
  { id: 'rec8', employee: employees[2], date: getDateAgo(1), checkIn: '10:10 ص', checkOut: '06:00 م', status: 'حاضر', delayMinutes: 10 },
  { id: 'rec9', employee: employees[3], date: getDateAgo(1), checkIn: '09:10 ص', checkOut: '05:10 م', status: 'حاضر', delayMinutes: 10 },
  { id: 'rec10', employee: employees[4], date: getDateAgo(1), checkIn: null, checkOut: null, status: 'غائب', delayMinutes: 0 },
  // Records from 5 days ago
  { id: 'rec11', employee: employees[0], date: getDateAgo(5), checkIn: '08:55 ص', checkOut: '05:00 م', status: 'حاضر', delayMinutes: 0 },
  { id: 'rec12', employee: employees[3], date: getDateAgo(5), checkIn: null, checkOut: null, status: 'في إجازة', delayMinutes: 0 },
  // Records from 10 days ago
  { id: 'rec13', employee: employees[1], date: getDateAgo(10), checkIn: '09:30 ص', checkOut: '05:30 م', status: 'حاضر', delayMinutes: 30 },
  { id: 'rec14', employee: employees[2], date: getDateAgo(10), checkIn: null, checkOut: null, status: 'غائب', delayMinutes: 0 },
];

export const weeklyAttendance = [
    { day: 'الأحد', حاضر: 4, غائب: 1 },
    { day: 'الاثنين', حاضر: 5, غائب: 0 },
    { day: 'الثلاثاء', حاضر: 4, غائب: 1 },
    { day: 'الأربعاء', حاضر: 5, غائب: 0 },
    { day: 'الخميس', حاضر: 3, غائب: 2 },
];
