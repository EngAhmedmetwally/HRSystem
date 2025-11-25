// This file has been removed as it was a duplicate of /src/app/(dashboard)/attendance/page.tsx
// The correct page with filters is now the only one available.
import { redirect } from 'next/navigation';

export default function DeprecatedAttendancePage() {
    redirect('/dashboard/attendance');
    return null;
}
