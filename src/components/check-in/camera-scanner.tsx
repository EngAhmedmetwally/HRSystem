'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CameraOff, CheckCircle, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error' | 'inactive'>('inactive');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', description: '' });

  const startCamera = async () => {
    setCameraStatus('loading');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraStatus('active');
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setCameraStatus('error');
      }
    } else {
      setCameraStatus('error');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleAction = (type: 'in' | 'out') => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setSuccessMessage({
      title: type === 'in' ? 'تم تسجيل الحضور بنجاح' : 'تم تسجيل الانصراف بنجاح',
      description: `الوقت المسجل: ${time}`,
    });
    setShowSuccess(true);
  };

  const CameraOverlay = () => {
    switch (cameraStatus) {
      case 'loading':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="mt-4 text-lg">جاري تشغيل الكاميرا...</p>
          </div>
        );
      case 'error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
            <CameraOff className="h-12 w-12" />
            <p className="mt-4 text-lg">خطأ في الوصول إلى الكاميرا</p>
            <p className="text-sm">
              يرجى التأكد من منح الإذن لاستخدام الكاميرا والمحاولة مرة أخرى.
            </p>
            <Button onClick={startCamera} className="mt-4">إعادة المحاولة</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl border-8 border-gray-800 bg-gray-800 shadow-2xl">
        <div className="relative aspect-[9/16] bg-black">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={cn("h-full w-full object-cover", cameraStatus !== 'active' && 'hidden')}
          />
          <CameraOverlay />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 aspect-square border-4 border-dashed border-white/50 rounded-2xl" />
        </div>
        <div className="bg-gray-800 p-4 flex justify-around gap-4">
          <Button
            onClick={() => handleAction('in')}
            disabled={cameraStatus !== 'active'}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
          >
            <CheckCircle className="ml-2 h-6 w-6" />
            تسجيل حضور
          </Button>
          <Button
            onClick={() => handleAction('out')}
            disabled={cameraStatus !== 'active'}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
          >
            <Clock className="ml-2 h-6 w-6" />
            تسجيل انصراف
          </Button>
        </div>
      </div>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{successMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {successMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>حسنًا</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
