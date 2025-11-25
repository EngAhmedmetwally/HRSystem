'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import QRCode from 'react-qr-code';

const DEFAULT_QR_LIFESPAN = 15; // in seconds

export default function QrCodePage() {
  const [currentDate, setCurrentDate] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [qrLifespan, setQrLifespan] = useState(DEFAULT_QR_LIFESPAN);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load custom settings from localStorage
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.qrCodeLifespan) {
            setQrLifespan(settings.qrCodeLifespan);
        }
    }

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(new Intl.DateTimeFormat('ar-EG', options).format(today));
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
     const generateQRValue = () => {
      const timestamp = Date.now();
      // Simple encoding, in a real app, this should be a signed JWT or similar
      const signature = btoa(`TIMESTAMP:${timestamp}`);
      return signature;
    };
    
    // Function to regenerate QR
    const regenerateQrCode = () => {
      setQrValue(generateQRValue());
    };

    // Initial generation
    regenerateQrCode();

    // Set up the interval to regenerate QR code
    intervalRef.current = setInterval(regenerateQrCode, qrLifespan * 1000);

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [qrLifespan]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          رمز الاستجابة السريعة الديناميكي
        </h2>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>رمز QR لتسجيل الحضور والانصراف</CardTitle>
            <CardDescription>{currentDate}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius)' }}>
              {qrValue ? (
                <QRCode
                  value={qrValue}
                  size={256}
                  viewBox={`0 0 256 256`}
                />
              ) : (
                <div className="w-[256px] h-[256px] flex items-center justify-center bg-gray-100 text-sm text-gray-500 rounded-md">
                  جاري إنشاء الرمز...
                </div>
              )}
            </div>
            <p className="text-muted-foreground pt-4">
              يقوم الموظفون بمسح هذا الرمز لتسجيل وقت الحضور والانصراف.
              <br />
              يتم تحديث هذا الرمز كل {qrLifespan} ثانية.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
