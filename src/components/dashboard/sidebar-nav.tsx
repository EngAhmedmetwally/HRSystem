'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Wallet,
  Camera,
  Settings,
  LogOut,
  Landmark,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { employees } from '@/lib/mock-data';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/dashboard/attendance', icon: Users, label: 'سجل الحضور' },
  { href: '/dashboard/qr-code', icon: QrCode, label: 'رمز QR' },
  { href: '/dashboard/payroll', icon: Wallet, label: 'كشف المرتبات' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const currentUser = employees[1];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-lg">
            <Landmark className="h-5 w-5" />
          </Button>
          <div className={cn("flex flex-col gap-0 overflow-hidden transition-all duration-300", state === 'collapsed' ? 'w-0' : 'w-auto')}>
            <h1 className="text-lg font-bold font-headline">HighClass</h1>
            <p className="text-xs text-muted-foreground">لإدارة الموارد البشرية</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu className='mt-4'>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="تسجيل الحضور/الانصراف">
              <Link href="/check-in">
                <Camera />
                <span>تسجيل الحضور/الانصراف</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2',
                state === 'collapsed' && 'justify-center size-12 p-0'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint={currentUser.avatarHint} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={cn("flex flex-col overflow-hidden transition-all duration-300", state === 'collapsed' ? 'w-0' : 'w-auto')}>
                <span className="truncate font-medium">{currentUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56" sideOffset={10}>
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="ml-2 h-4 w-4" />
              <span>الإعدادات</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="ml-2 h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
