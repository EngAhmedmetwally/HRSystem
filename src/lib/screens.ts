'use client';
import { LayoutDashboard, Users, UserPlus, QrCode, Wallet, Settings, UserCheck, History } from 'lucide-react';
import type { Screen } from './types';

export const screens: Screen[] = [
  { id: 'dashboard', href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'my-attendance', href: '/dashboard/my-attendance', label: 'حضوري', icon: UserCheck },
  { id: 'attendance', href: '/dashboard/attendance', label: 'سجل الحضور', icon: Users },
  { id: 'employees', href: '/dashboard/employees', label: 'الموظفين', icon: UserPlus },
  { id: 'qr-code', href: '/dashboard/qr-code', label: 'رمز QR', icon: QrCode },
  { id: 'payroll', href: '/dashboard/payroll', label: 'كشف المرتبات', icon: Wallet },
  { id: 'payroll-history', href: '/dashboard/payroll-history', label: 'سجل الرواتب', icon: History },
  { id: 'settings', href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
];
