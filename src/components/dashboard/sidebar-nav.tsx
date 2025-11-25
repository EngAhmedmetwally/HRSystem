'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Camera,
  LogOut,
  Settings,
  Landmark,
} from 'lucide-react';
import { screens as allScreens } from '@/lib/screens';
import type { Employee, Screen } from '@/lib/types';
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

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  
  const [currentUser, setCurrentUser] = useState<Partial<Employee> | null>(null);
  const [visibleScreens, setVisibleScreens] = useState<Screen[]>([]);
  
  useEffect(() => {
    // In a real app, this would come from a session or a global state management library
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (!currentUser || currentUser.username !== user.username) {
        setCurrentUser(user);
        const allowed = allScreens.filter(screen => user.allowedScreens?.includes(screen.id));
        setVisibleScreens(allowed);
      }
    } else {
      // If no user, maybe redirect to login
      router.push('/login');
    }
  }, [pathname, router, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    router.push('/login');
  };

  if (!currentUser) {
    return null; // Or a loading skeleton
  }

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground rounded-lg">
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
          {visibleScreens.map((item) => (
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
                'flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2',
                state === 'collapsed' && 'justify-center size-12 p-0'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint={currentUser.avatarHint} />
                <AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback>
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
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="ml-2 h-4 w-4" />
              <span>الإعدادات</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="ml-2 h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
