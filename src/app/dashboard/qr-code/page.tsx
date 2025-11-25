// This file is deprecated and its content has been moved to /src/app/(dashboard)/qr-code/page.tsx
// It's kept to avoid breaking potential old links during transition but should be removed later.
import { redirect } from 'next/navigation';

export default function DeprecatedQrCodePage() {
    redirect('/dashboard/qr-code');
    return null;
}
