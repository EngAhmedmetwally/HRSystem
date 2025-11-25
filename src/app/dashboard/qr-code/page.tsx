'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function QrCodePage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Intl.DateTimeFormat('ar-EG', options).format(today));
  }, []);

  const qrImage = PlaceHolderImages.find(img => img.id === 'qr-code');

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
            {qrImage && (
              <div className="p-4 bg-white rounded-lg shadow-md">
                <Image
                  src={qrImage.imageUrl}
                  alt={qrImage.description}
                  data-ai-hint={qrImage.imageHint}
                  width={300}
                  height={300}
                  priority
                />
              </div>
            )}
            <p className="text-muted-foreground">
              يقوم الموظفون بمسح هذا الرمز لتسجيل وقت الحضور والانصراف.
              <br />
              يتم تحديث الرمز تلقائيًا كل يوم.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
