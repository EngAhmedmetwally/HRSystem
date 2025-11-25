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
};

export type AttendanceRecord = {
  id: string;
  employee: Employee;
  checkIn: string | null;
  checkOut: string | null;
  status: 'حاضر' | 'غائب' | 'في إجازة';
};
