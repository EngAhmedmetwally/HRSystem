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
import { Progress } from '@/components/ui/progress';

const QR_LIFESPAN = 15; // in seconds

export default function QrCodePage() {
  const [currentDate, setCurrentDate] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateQRValue = () => {
    const timestamp = Date.now();
    // Simple encoding, in a real app, this should be a signed JWT or similar
    const signature = btoa(`TIMESTAMP:${timestamp}`);
    return signature;
  };
  
  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(new Intl.DateTimeFormat('ar-EG', options).format(today));

    // Function to regenerate QR and reset progress
    const regenerateQrCode = () => {
      setQrValue(generateQRValue());
      setProgress(100);
    };

    // Initial generation
    regenerateQrCode();

    // Set up the interval to regenerate QR code every QR_LIFESPAN seconds
    intervalRef.current = setInterval(regenerateQrCode, QR_LIFESPAN * 1000);

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Separate effect for progress bar animation
  useEffect(() => {
    if (progress > 0) {
      // Calculate the decrement step to ensure it reaches 0 in QR_LIFESPAN seconds
      const decrementStep = 100 / QR_LIFESPAN;
      const timer = setTimeout(() => {
        setProgress(prev => Math.max(0, prev - decrementStep));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress]);


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
            <div style={{ height: "auto", margin: "0 auto", maxWidth: 256, width: "100%", background: 'white', padding: '16px', borderRadius: 'var(--radius)' }}>
              {qrValue ? (
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={qrValue}
                  viewBox={`0 0 256 256`}
                />
              ) : (
                <div className="w-[256px] h-[256px] flex items-center justify-center bg-gray-100 text-sm text-gray-500 rounded-md">
                  جاري إنشاء الرمز...
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                يتغير الرمز تلقائياً كل {QR_LIFESPAN} ثانية
              </p>
            </div>

            <p className="text-muted-foreground pt-4">
              يقوم الموظفون بمسح هذا الرمز لتسجيل وقت الحضور والانصراف.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
