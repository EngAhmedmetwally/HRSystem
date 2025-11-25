import { Timestamp } from "firebase/firestore";

export type Screen = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
};

export interface Salary {
  base: number;
  allowances: number;
}

export interface WorkSchedule {
  type: 'default' | 'custom';
  startTime?: string;
  endTime?: string;
  weekends: ('السبت' | 'الأحد' | 'الاثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة')[];
}

export type Employee = {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  username: string; // Used for display, login will be via email
  email: string;
  role: string;
  department?: string;
  salary: Salary;
  avatarUrl: string;
  avatarHint: string;
  workSchedule: WorkSchedule;
  allowedScreens: string[];
};

export type AttendanceRecord = {
  id?: string;
  employeeId: string;
  employeeName: string; // Denormalized for easy display
  date: string; // YYYY-MM-DD
  checkIn: Timestamp | null;
  checkOut: Timestamp | null;
  status: 'حاضر' | 'غائب' | 'في إجازة';
  delayMinutes?: number;
  checkInLocation?: GeoLocation;
  checkOutLocation?: GeoLocation;
};


export type GeoLocation = {
    latitude: number;
    longitude: number;
}

export type DeductionRule = {
  delayMinutes: number;
  deductionType: 'minutes' | 'hours' | 'amount';
  deductionValue: number;
  period: 'daily' | 'monthly';
};

export type SystemSettings = {
  id?: string; // Should be a singleton document, e.g., 'main'
  companyStartTime: string;
  companyEndTime: string;
  gracePeriod: number;
  gracePeriodType: 'daily' | 'monthly';
  deductionRules: DeductionRule[];
  enableGeolocation: boolean;
  companyLatitude: number;
  companyLongitude: number;
  allowedRadiusMeters: number;
  qrCodeLifespan: number;
};

export type PayrollRecord = {
    employeeId: string;
    name: string;
    grossPay: number;
    deductions: number;
    overtime: number;
    netPay: number;
}

export type PayrollHistory = {
    id: string; // e.g., '07-2024'
    month: string;
    year: number;
    generatedAt: Timestamp;
    totalNetPay: number;
    records: PayrollRecord[];
}
