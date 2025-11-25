export type Employee = {
  id: string;
  name: string;
  role: string;
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
