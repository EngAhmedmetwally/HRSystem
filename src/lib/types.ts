export type Employee = {
  id: string;
  name: string;
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
};

export type AttendanceRecord = {
  id: string;
  employee: Employee;
  checkIn: string | null;
  checkOut: string | null;
  status: 'حاضر' | 'غائب' | 'في إجازة';
};
