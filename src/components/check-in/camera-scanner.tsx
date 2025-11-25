'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CameraOff, CheckCircle, Clock, XCircle, MapPin, WifiOff } from 'lucide-react';
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
import jsQR from 'jsqr';

type CameraStatus = 'loading' | 'active' | 'error' | 'inactive' | 'validating' | 'geolocating';

// --- Configuration ---
// In a real app, this should come from settings or a config file
const COMPANY_LOCATION = {
  latitude: 30.0444, // Cairo
  longitude: 31.2357,
};
const ALLOWED_RADIUS_METERS = 200; // Allow check-in within 200 meters
const QR_LIFESPAN_MS = 15 * 1000; // 15 seconds

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number>();

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('loading');
  const [dialog, setDialog] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' }>({ open: false, title: '', description: '', variant: 'success' });
  
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const startCamera = async () => {
    stopCamera();
    setCameraStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraStatus('active');
          scanQRCode();
        };
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setCameraStatus('error');
    }
  };
  
  const getDistance = (coords1: GeolocationCoordinates, coords2: { latitude: number; longitude: number }) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth radius in metres
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  
  const validateCheckIn = (qrData: string, userCoords: GeolocationCoordinates): { valid: boolean; reason: string } => {
      // 1. Validate QR Code Timestamp
      try {
        const decoded = atob(qrData);
        if (!decoded.startsWith('TIMESTAMP:')) {
            return { valid: false, reason: 'رمز QR غير صالح.' };
        }
        const timestamp = parseInt(decoded.split(':')[1], 10);
        const now = Date.now();
        if (now - timestamp > QR_LIFESPAN_MS) {
            return { valid: false, reason: 'انتهت صلاحية رمز QR. حاول مرة أخرى.' };
        }
      } catch (e) {
          return { valid: false, reason: 'رمز QR تالف أو غير معروف.' };
      }

      // 2. Validate Geolocation
      const distance = getDistance(userCoords, COMPANY_LOCATION);
      if (distance > ALLOWED_RADIUS_METERS) {
        return { valid: false, reason: `يجب أن تكون ضمن نطاق ${ALLOWED_RADIUS_METERS} مترًا من الشركة لتسجيل الحضور. أنت على بعد ${Math.round(distance)} متر.` };
      }

      return { valid: true, reason: 'صالح' };
  };

  const handleAction = (type: 'in' | 'out', qrCodeData: string) => {
    stopCamera();
    setCameraStatus('geolocating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCameraStatus('validating');
        const validation = validateCheckIn(qrCodeData, position.coords);
        
        if (!validation.valid) {
            setDialog({ open: true, title: 'فشل تسجيل الدخول', description: validation.reason, variant: 'error' });
            return;
        }

        const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        setDialog({
            open: true,
            title: type === 'in' ? 'تم تسجيل الحضور بنجاح' : 'تم تسجيل الانصراف بنجاح',
            description: `الوقت المسجل: ${time}`,
            variant: 'success'
        });
      },
      (error) => {
        let description = 'فشل تحديد الموقع. يرجى التأكد من تفعيل خدمة المواقع.';
        if (error.code === error.PERMISSION_DENIED) {
            description = 'تم رفض إذن الوصول إلى الموقع. يرجى تفعيله من إعدادات المتصفح.';
        }
        setDialog({ open: true, title: 'خطأ في تحديد الموقع', description, variant: 'error' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const scanQRCode = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                // To keep it simple, we'll just handle "check-in" for any valid QR.
                // In a real app, the QR might contain the action type.
                handleAction('in', code.data);
                return; // Stop scanning
            }
        }
    }
    animationFrameId.current = requestAnimationFrame(scanQRCode);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const onDialogClose = () => {
    setDialog({ ...dialog, open: false });
    // Restart camera after closing dialog to allow another scan
    startCamera();
  }

  const OverlayIcon = {
    loading: <Loader2 className="h-12 w-12 animate-spin" />,
    error: <CameraOff className="h-12 w-12" />,
    geolocating: <MapPin className="h-12 w-12 animate-pulse" />,
    validating: <Loader2 className="h-12 w-12 animate-spin" />,
    inactive: <WifiOff className="h-12 w-12" />,
    active: null,
  };
  
  const OverlayText = {
      loading: 'جاري تشغيل الكاميرا...',
      error: 'خطأ في الوصول إلى الكاميرا. يرجى منح الإذن والمحاولة مرة أخرى.',
      geolocating: 'جاري تحديد موقعك الجغرافي...',
      validating: 'جاري التحقق من البيانات...',
      inactive: '',
      active: null,
  }

  return (
    <>
      <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl border-8 border-gray-800 bg-gray-800 shadow-2xl">
        <div className="relative aspect-[9/16] bg-black">
          <video ref={videoRef} playsInline autoPlay muted className={cn("h-full w-full object-cover")} />
          <canvas ref={canvasRef} className="hidden" />

          {cameraStatus !== 'active' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
              {OverlayIcon[cameraStatus]}
              <p className="mt-4 text-lg">{OverlayText[cameraStatus]}</p>
               {cameraStatus === 'error' && <Button onClick={startCamera} className="mt-4">إعادة المحاولة</Button>}
            </div>
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 aspect-square border-4 border-dashed border-white/50 rounded-2xl pointer-events-none" />
        </div>
      </div>

      <AlertDialog open={dialog.open} onOpenChange={(open) => !open && onDialogClose()}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="items-center">
             {dialog.variant === 'success' ? 
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" /> :
                <XCircle className="h-12 w-12 text-destructive mb-2" />
             }
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {dialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onDialogClose}>حسنًا</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
