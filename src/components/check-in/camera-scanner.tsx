
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
import { useToast } from '@/hooks/use-toast';
import type { GeoLocation, Employee } from '@/lib/types';
import { useRouter } from 'next/navigation';


type CameraStatus = 'loading' | 'active' | 'error' | 'inactive' | 'validating' | 'geolocating';

// --- Configuration ---
const DEFAULT_COMPANY_LOCATION: GeoLocation = {
  latitude: 30.0444, // Cairo
  longitude: 31.2357,
};
const ALLOWED_RADIUS_METERS = 200; // Allow check-in within 200 meters
const QR_LIFESPAN_MS = 15 * 1000; // 15 seconds
const CHECK_IN_LOCKOUT_MS = 60 * 60 * 1000; // 1 hour

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number>();
  const { toast } = useToast();
  const router = useRouter();

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('loading');
  const [dialog, setDialog] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', description: '', variant: 'success' });
  const [companyLocation, setCompanyLocation] = useState<GeoLocation>(DEFAULT_COMPANY_LOCATION);
  
  useEffect(() => {
    // Load company location from localStorage
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.companyLatitude && settings.companyLongitude) {
        setCompanyLocation({
          latitude: settings.companyLatitude,
          longitude: settings.companyLongitude,
        });
      }
    }
  }, []);

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };
  
  // This effect will run when the component unmounts.
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // This effect handles router events to stop the camera when navigating away.
  // This is a bit of a workaround for Next.js App Router behavior.
  useEffect(() => {
    // We can't directly use router events here in the same way as pages router.
    // The unmount effect (`return () => stopCamera()`) is the primary mechanism.
  }, [router]);


  const startCamera = async () => {
    // Ensure camera is stopped before starting a new stream
    if (streamRef.current) {
      stopCamera();
    }
    setCameraStatus('loading');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         throw new Error("Camera not supported on this browser.");
      }

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
        // Add a handler for when the video stream ends unexpectedly
        videoRef.current.onended = () => {
            setCameraStatus('inactive');
        };
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setCameraStatus('error');
       toast({
          variant: "destructive",
          title: "خطأ في الكاميرا",
          description: "فشل الوصول إلى الكاميرا. يرجى منح الإذن والمحاولة مرة أخرى.",
      });
    }
  };
  
  const getDistance = (coords1: GeolocationCoordinates, coords2: GeoLocation) => {
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
      const distance = getDistance(userCoords, companyLocation);
      if (distance > ALLOWED_RADIUS_METERS) {
        return { valid: false, reason: `يجب أن تكون ضمن نطاق ${ALLOWED_RADIUS_METERS} مترًا من الشركة لتسجيل الحضور. أنت على بعد ${Math.round(distance)} متر.` };
      }

      return { valid: true, reason: 'صالح' };
  };

  const handleAction = (qrCodeData: string) => {
    stopCamera();
    setCameraStatus('geolocating');

    // Get current user (mocked)
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        setDialog({ open: true, title: 'خطأ', description: 'لم يتم العثور على بيانات المستخدم. الرجاء تسجيل الدخول.', variant: 'error' });
        return;
    }
    const currentUser: Employee = JSON.parse(userJson);

    if (!navigator.geolocation) {
         setDialog({ open: true, title: 'خطأ في تحديد الموقع', description: 'خدمة تحديد المواقع غير مدعومة في هذا المتصفح.', variant: 'error' });
         return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCameraStatus('validating');
        const validation = validateCheckIn(qrCodeData, position.coords);
        
        if (!validation.valid) {
            setDialog({ open: true, title: 'فشل التسجيل', description: validation.reason, variant: 'error' });
            return;
        }

        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];
        const lastScanKey = `lastScan_${currentUser.id}_${today}`;
        const lastScanTimestamp = localStorage.getItem(lastScanKey);
        
        const timeString = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        if (!lastScanTimestamp) {
            // First scan of the day -> Check-in
            localStorage.setItem(lastScanKey, now.toString());
            setDialog({
                open: true,
                title: 'تم تسجيل الحضور بنجاح',
                description: `الوقت المسجل: ${timeString}`,
                variant: 'success'
            });
        } else {
            const lastScanTime = parseInt(lastScanTimestamp, 10);
            if (now - lastScanTime < CHECK_IN_LOCKOUT_MS) {
                // Scanned again within 1 hour
                setDialog({
                    open: true,
                    title: 'تم التسجيل مسبقًا',
                    description: 'لقد قمت بتسجيل الحضور بالفعل منذ فترة قصيرة.',
                    variant: 'info'
                });
            } else {
                // Scanned after 1 hour -> Check-out
                // Here you might want to save it differently
                setDialog({
                    open: true,
                    title: 'تم تسجيل الانصراف بنجاح',
                    description: `الوقت المسجل: ${timeString}`,
                    variant: 'success'
                });
            }
        }
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
                handleAction(code.data);
                return; // Stop scanning
            }
        }
    }
    animationFrameId.current = requestAnimationFrame(scanQRCode);
  };

  useEffect(() => {
    startCamera();
  }, []);

  const onDialogClose = () => {
    setDialog({ ...dialog, open: false });
    // Restart camera after closing dialog to allow another scan
    startCamera();
  }

  const DialogIcon = {
      success: <CheckCircle className="h-12 w-12 text-green-500 mb-2" />,
      error: <XCircle className="h-12 w-12 text-destructive mb-2" />,
      info: <Clock className="h-12 w-12 text-blue-500 mb-2" />
  };

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
      inactive: 'تم إيقاف الكاميرا',
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
             {DialogIcon[dialog.variant]}
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
