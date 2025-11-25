'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import QRCode from "react-qr-code";
import { Progress } from '@/components/ui/progress';

const QR_LIFESPAN = 15; // in seconds

export default function QrCodePage() {
  const [currentDate, setCurrentDate] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [progress, setProgress] = useState(100);

  const generateQRValue = () => {
    // This value is what gets embedded in the QR code.
    // It's a simple signed token with a timestamp.
    const timestamp = Date.now();
    // In a real app, this should be a more secure signature (e.g., JWT)
    // generated on a server, but this demonstrates the concept.
    const signature = btoa(`TIMESTAMP:${timestamp}`); 
    return signature;
  };

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Intl.DateTimeFormat('ar-EG', options).format(today));

    // Generate initial QR code
    setQrValue(generateQRValue());

    // Set up an interval to refresh the QR code and the progress bar
    const intervalId = setInterval(() => {
      setQrValue(generateQRValue());
      setProgress(100);
    }, QR_LIFESPAN * 1000);
    
    const progressIntervalId = setInterval(() => {
        setProgress(prev => Math.max(0, prev - (100 / QR_LIFESPAN)));
    }, 1000);


    // Cleanup intervals on component unmount
    return () => {
      clearInterval(intervalId);
      clearInterval(progressIntervalId);
    };
  }, []);

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
          <CardContent className="flex flex-col items-center gap-4">
             <div className="p-6 bg-white rounded-lg shadow-md">
                <QRCode
                  value={qrValue}
                  size={256}
                  viewBox={`0 0 256 256`}
                />
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
