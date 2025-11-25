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
import type { Employee, SystemSettings, AttendanceRecord } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { format } from 'date-fns';


// --- Configuration ---
const CHECK_IN_LOCKOUT_MS = 60 * 60 * 1000; // 1 hour

type GeolocationCoords = {
    latitude: number;
    longitude: number;
    accuracy: number;
};

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number>();
  const { toast } = useToast();
  const router = useRouter();

  const { user } = useUser();
  const firestore = useFirestore();

  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error' | 'inactive' | 'validating' | 'geolocating'>('loading');
  const [dialog, setDialog] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', description: '', variant: 'success' });
  
  // State for settings
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'main') : null, [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<SystemSettings>(settingsDocRef);
  
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
  
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
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
  
  const getDistance = (coords1: GeolocationCoords, coords2: GeolocationCoords) => {
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
  
  const validateCheckIn = (qrData: string, userCoords?: GeolocationCoords): { valid: boolean; reason: string } => {
      // 1. Validate QR Code Timestamp
      const qrLifespanMs = (settings?.qrCodeLifespan ?? 15) * 1000;
      try {
        const decoded = atob(qrData);
        if (!decoded.startsWith('TIMESTAMP:')) {
            return { valid: false, reason: 'رمز QR غير صالح.' };
        }
        const timestamp = parseInt(decoded.split(':')[1], 10);
        const now = Date.now();
        if (now - timestamp > qrLifespanMs) {
            return { valid: false, reason: 'انتهت صلاحية رمز QR. حاول مرة أخرى.' };
        }
      } catch (e) {
          return { valid: false, reason: 'رمز QR تالف أو غير معروف.' };
      }

      // 2. Validate Geolocation if enabled
      if (settings?.enableGeolocation) {
        if (!userCoords) {
             return { valid: false, reason: 'لم يتم توفير معلومات الموقع الجغرافي.' };
        }
        if (settings.companyLatitude === undefined || settings.companyLongitude === undefined) {
             return { valid: false, reason: 'لم يتم تعيين موقع الشركة في الإعدادات.' };
        }
        const companyLocation: GeolocationCoords = {
            latitude: settings.companyLatitude,
            longitude: settings.companyLongitude,
            accuracy: 0,
        }
        const distance = getDistance(userCoords, companyLocation);
        if (distance > settings.allowedRadiusMeters) {
            return { valid: false, reason: `يجب أن تكون ضمن نطاق ${settings.allowedRadiusMeters} مترًا من الشركة لتسجيل الحضور. أنت على بعد ${Math.round(distance)} متر.` };
        }
      }

      return { valid: true, reason: 'صالح' };
  };

  const handleAction = (qrCodeData: string) => {
    stopCamera();

    if (settings?.enableGeolocation) {
        setCameraStatus('geolocating');
        if (!navigator.geolocation) {
            setDialog({ open: true, title: 'خطأ في تحديد الموقع', description: 'خدمة تحديد المواقع غير مدعومة في هذا المتصفح.', variant: 'error' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                processScan(qrCodeData, position.coords);
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
    } else {
        // Geolocation is disabled, proceed without it
        processScan(qrCodeData);
    }
  };

  const processScan = async (qrCodeData: string, userCoords?: GeolocationCoords) => {
    setCameraStatus('validating');

    if (!user || !firestore) {
        setDialog({ open: true, title: 'خطأ', description: 'لم يتم العثور على بيانات المستخدم. الرجاء تسجيل الدخول.', variant: 'error' });
        return;
    }
    
    // Fetch employee data
    const employeeDocRef = doc(firestore, 'employees', user.uid);
    const employeeSnap = await getDoc(employeeDocRef);
    if (!employeeSnap.exists()) {
        setDialog({ open: true, title: 'خطأ', description: 'ملف الموظف غير موجود.', variant: 'error' });
        return;
    }
    const currentUser = employeeSnap.data() as Employee;


    const validation = validateCheckIn(qrCodeData, userCoords);
    if (!validation.valid) {
        setDialog({ open: true, title: 'فشل التسجيل', description: validation.reason, variant: 'error' });
        return;
    }

    const now = Timestamp.now();
    const todayStr = format(now.toDate(), 'yyyy-MM-dd');
    
    const attendanceCol = collection(firestore, 'attendance');
    const q = query(attendanceCol, where('employeeId', '==', user.uid), where('date', '==', todayStr), limit(1));
    const querySnapshot = await getDocs(q);

    const timeString = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (querySnapshot.empty) {
        // First scan of the day -> Check-in
        const newRecord: AttendanceRecord = {
            employeeId: user.uid,
            employeeName: currentUser.name,
            date: todayStr,
            checkIn: now,
            checkOut: null,
            status: 'حاضر', // Assuming 'present' until logic for 'absent'/'on_leave' is added
            checkInLocation: userCoords ? { latitude: userCoords.latitude, longitude: userCoords.longitude } : undefined,
        };
        addDocumentNonBlocking(attendanceCol, newRecord);
        setDialog({
            open: true,
            title: 'تم تسجيل الحضور بنجاح',
            description: `الوقت المسجل: ${timeString}`,
            variant: 'success'
        });
    } else {
        const existingRecordDoc = querySnapshot.docs[0];
        const existingRecord = existingRecordDoc.data() as AttendanceRecord;

        if (existingRecord.checkIn && !existingRecord.checkOut) {
            const timeSinceCheckIn = now.toMillis() - existingRecord.checkIn.toMillis();
            if (timeSinceCheckIn < CHECK_IN_LOCKOUT_MS) {
                 setDialog({
                    open: true,
                    title: 'تم التسجيل مسبقًا',
                    description: 'لقد قمت بتسجيل الحضور بالفعل منذ فترة قصيرة.',
                    variant: 'info'
                });
            } else {
                // Scanned after 1 hour -> Check-out
                const updatedRecord: Partial<AttendanceRecord> = {
                    checkOut: now,
                    checkOutLocation: userCoords ? { latitude: userCoords.latitude, longitude: userCoords.longitude } : undefined,
                };
                setDocumentNonBlocking(existingRecordDoc.ref, updatedRecord, { merge: true });
                setDialog({
                    open: true,
                    title: 'تم تسجيل الانصراف بنجاح',
                    description: `الوقت المسجل: ${timeString}`,
                    variant: 'success'
                });
            }
        } else {
             // Already checked in and out
             setDialog({
                open: true,
                title: 'اكتمل اليوم',
                description: 'لقد قمت بتسجيل الحضور والانصراف لهذا اليوم.',
                variant: 'info'
            });
        }
    }
  }


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
