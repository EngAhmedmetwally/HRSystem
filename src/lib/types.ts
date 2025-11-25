export type Screen = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
};

export type Employee = {
  id: string;
  name: string;
  username: string;
  password?: string; // Should be handled securely, not stored plaintext
  role: string;
  department?: string;
  salary: {
    base: number;
    allowances: number;
  };
  avatarUrl: string;
  avatarHint: string;
  workSchedule: {
    type: 'default' | 'custom';
    startTime?: string;
    endTime?: string;
    weekends: ('السبت' | 'الأحد' | 'الاثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة')[];
  };
  allowedScreens: string[];
};

export type AttendanceRecord = {
  id: string;
  employee: Employee;
  checkIn: string | null;
  checkOut: string | null;
  status: 'حاضر' | 'غائب' | 'في إجازة';
};
