'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, LogOut, Settings, Landmark } from 'lucide-react';
import { screens as allScreens } from '@/lib/screens';
import type { Employee, Screen } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  const { state } = useSidebar();
  const { user, isUserLoading, auth } = useUser();
  const firestore = useFirestore();
  
  const [isClient, setIsClient] = useState(false);
  
  const employeeDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'employees', user.uid) : null),
    [user, firestore]
  );
  const { data: employeeData, isLoading: isEmployeeLoading } = useDoc<Employee>(employeeDocRef);

  useEffect(() => {
    setIsClient(true);
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const visibleScreens = useMemo(() => {
    // Special admin case
    if (user?.email === 'admin@highclass.com') {
      return allScreens;
    }
    if (!employeeData) return [];
    return allScreens.filter(screen => employeeData.allowedScreens?.includes(screen.id));
  }, [employeeData, user]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      // The onAuthStateChanged listener will trigger the redirect
    }
  };

  const currentUserDisplay = useMemo(() => {
    if (user?.email === 'admin@highclass.com') {
        return {
            name: 'Admin',
            role: 'Administrator',
            avatarUrl: undefined,
            avatarHint: 'admin user',
        }
    }
    return employeeData;
  }, [user, employeeData]);


  if (!isClient || isUserLoading || (user && !currentUserDisplay)) {
    return <SidebarSkeleton />;
  }
  
  if (!user) {
    return null; // Don't render sidebar if not logged in
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
