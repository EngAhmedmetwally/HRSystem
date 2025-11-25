'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, LogOut, Landmark } from 'lucide-react';
import { screens as allScreens } from '@/lib/screens';
import type { Employee } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

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
import { Skeleton } from '../ui/skeleton';

function SidebarSkeleton() {
    const { state } = useSidebar();
    return (
         <Sidebar side="right">
            <SidebarHeader>
                 <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-lg" />
                     <div className={cn("flex flex-col gap-1 overflow-hidden transition-all duration-300", state === 'collapsed' ? 'w-0' : 'w-auto')}>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                 <SidebarMenu>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className={cn("h-8 w-full", state === 'collapsed' && "size-8 mx-auto")}/>
                    ))}
                </SidebarMenu>
            </SidebarContent>
             <SidebarSeparator />
            <SidebarFooter>
                <div className={cn('flex w-full items-center gap-3 rounded-md p-2', state === 'collapsed' && 'justify-center size-12 p-0')}>
                     <Skeleton className="size-8 rounded-full" />
                    <div className={cn("flex flex-col gap-1 overflow-hidden transition-all duration-300", state === 'collapsed' ? 'w-0' : 'w-auto')}>
                       <Skeleton className="h-4 w-20" />
                       <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </SidebarFooter>
         </Sidebar>
    )
}

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setOpenMobile } = useSidebar();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const employeeDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'employees', user.uid) : null),
    [user, firestore]
  );
  const { data: employeeData, isLoading: isEmployeeLoading } = useDoc<Employee>(employeeDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const visibleScreens = useMemo(() => {
    // Special admin case (hardcoded for now)
    if (user?.email === 'admin@highclass.com') {
      return allScreens.filter(s => s.id !== 'my-attendance'); // Admin doesn't need "My Attendance"
    }
    if (!employeeData) return [allScreens.find(s => s.id === 'my-attendance')].filter(Boolean); // Default for employee
    
    const allowed = employeeData.allowedScreens || [];
    // Ensure "My Attendance" is always available for logged-in employees
    if (!allowed.includes('my-attendance')) {
        allowed.push('my-attendance');
    }

    return allScreens.filter(screen => allowed.includes(screen.id));
  }, [employeeData, user]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const currentUserDisplay = useMemo(() => {
    if (user?.email === 'admin@highclass.com') {
        return {
            name: 'المدير العام',
            role: 'Administrator',
            avatarUrl: undefined,
            avatarHint: 'admin user',
        }
    }
    return employeeData;
  }, [user, employeeData]);


  if (isUserLoading || (user && !currentUserDisplay && !isEmployeeLoading)) {
    return <SidebarSkeleton />;
  }
  
  if (!user) {
    return null; // Don't render sidebar if not logged in
  }

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href} onClick={() => setOpenMobile(false)}>
      {children}
    </Link>
  );

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
                <NavLink href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu className='mt-4'>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="تسجيل الحضور/الانصراف">
              <NavLink href="/check-in">
                <Camera />
                <span>تسجيل الحضور/الانصراف</span>
              </NavLink>
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
                <AvatarImage src={currentUserDisplay?.avatarUrl} alt={currentUserDisplay?.name} data-ai-hint={currentUserDisplay?.avatarHint} />
                <AvatarFallback>{currentUserDisplay?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={cn("flex flex-col overflow-hidden transition-all duration-300", state === 'collapsed' ? 'w-0' : 'w-auto')}>
                <span className="truncate font-medium">{currentUserDisplay?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentUserDisplay?.role}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56" sideOffset={10}>
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
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
