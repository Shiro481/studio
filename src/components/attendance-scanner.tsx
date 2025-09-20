
"use client";

import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { QrCode, Loader2, CheckCircle, XCircle, CameraOff, LogIn, LogOut, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import jsQR from 'jsqr';
import { Switch } from '@/components/ui/switch';
import type { AttendanceRecord, StoredQrCode } from '@/types';
import { Skeleton } from './ui/skeleton';

interface AttendanceScannerProps {
  onScanSuccess: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => void;
  subjects: string[];
  storedCodes: StoredQrCode[];
  loading: boolean;
}

export const AttendanceScanner: FC<AttendanceScannerProps> = ({ onScanSuccess, subjects, storedCodes, loading }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanMode, setScanMode] = useState<'in' | 'out'>('in');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  const handleScan = useCallback((qrData: string) => {
    setIsProcessing(true);
    setIsScanning(false); 
    
    if (qrData) {
        const matchingCode = storedCodes.find(c => c.data === qrData);
        const studentName = matchingCode ? matchingCode.name : qrData;

        const newRecord = {
            studentName: studentName,
            subject: selectedSubject,
            isValid: !!matchingCode,
            status: scanMode === 'in' ? 'Logged In' : 'Logged Out',
        };

      onScanSuccess(newRecord);

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Success</span>
          </div>
        ),
        description: `Attendance for ${newRecord.studentName} (${newRecord.status}) recorded.`,
      });
    } else {
      console.error('Failed to process QR code: No student name found');
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <span>Scan Failed</span>
          </div>
        ),
        description: 'The QR code appears to be invalid or corrupted.',
        variant: 'destructive',
      });
    }
    setTimeout(() => setIsProcessing(false), 2000); 
  }, [scanMode, selectedSubject, storedCodes, onScanSuccess, toast]);

  const tick = useCallback(() => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code?.data) {
            handleScan(code.data);
            return; 
          }
        } catch (e) {
            // Ignore getImageData errors
        }
      }
    }
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  }, [handleScan, isScanning]);

  useEffect(() => {
    if (isScanning) {
      let cleanup: (() => void) | undefined;
      const startCamera = async () => {
        setCameraError(null);
        setHasCameraPermission(null);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            const onCanPlay = () => {
              videoRef.current?.play().catch(err => {
                console.error("Video play error:", err);
                setCameraError("Failed to play video stream.");
              });
              animationFrameRef.current = requestAnimationFrame(tick);
            };

            videoRef.current.addEventListener('loadedmetadata', onCanPlay);

            cleanup = () => { 
              if (videoRef.current) {
                  videoRef.current.removeEventListener('loadedmetadata', onCanPlay);
              }
              stopCamera();
            };
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          if (error instanceof Error) {
              if (error.name === 'NotAllowedError') {
                  setCameraError('Camera access was denied. Please enable camera permissions in your browser settings.');
              } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                  setCameraError('No camera was found. Please ensure a camera is connected and enabled.');
              } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                  setCameraError('The camera is already in use by another application. Please close it and try again.');
              } else {
                  setCameraError('An unexpected error occurred while accessing the camera.');
              }
          } else {
              setCameraError('An unknown error occurred.');
          }
          setHasCameraPermission(false);
          setIsScanning(false);
        }
      };

      startCamera();

      return () => {
        if (cleanup) {
          cleanup();
        } else {
          stopCamera();
        }
      };
    } else {
      stopCamera();
    }
  }, [isScanning, stopCamera, tick]);


  const toggleScan = () => {
    if (!selectedSubject) {
      toast({
        title: 'Subject Required',
        description: 'Please select a subject before scanning.',
        variant: 'destructive',
      });
      return;
    }
    setIsScanning(prev => !prev);
  };

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-3/5" />
                  <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-10 w-full" />
              </CardContent>
          </Card>
      )
  }
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Attendance</CardTitle>
        <CardDescription>
          Select a subject, choose the status, and scan the QR code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject-select">Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isScanning || isProcessing}>
            <SelectTrigger id="subject-select">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4 rounded-md border p-4">
          <div className="flex items-center space-x-2">
            <LogOut className={`h-5 w-5 ${scanMode === 'out' ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label htmlFor="scan-mode-switch" className={scanMode === 'out' ? 'text-primary' : 'text-muted-foreground'}>Log Out</Label>
          </div>
          <Switch
            id="scan-mode-switch"
            checked={scanMode === 'in'}
            onCheckedChange={(checked) => setScanMode(checked ? 'in' : 'out')}
            aria-label="Scan mode: Log In or Log Out"
          />
           <div className="flex items-center space-x-2">
            <LogIn className={`h-5 w-5 ${scanMode === 'in' ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label htmlFor="scan-mode-switch" className={scanMode === 'in' ? 'text-primary' : 'text-muted-foreground'}>Log In</Label>
          </div>
        </div>

        <div className="relative aspect-video w-full rounded-md border bg-muted overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {isScanning && hasCameraPermission && <div className="absolute inset-0 border-[8px] border-primary/50 rounded-lg" />}
             {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <CameraOff className="h-16 w-16 text-white/50" />
                </div>
            )}
            {hasCameraPermission === false && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                    <VideoOff className="h-16 w-16 text-white/50 mb-4" />
                    <h3 className="font-bold">Camera Unavailable</h3>
                 </div>
            )}
        </div>
        
        {cameraError && (
            <Alert variant="destructive">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Camera Error</AlertTitle>
                <AlertDescription>
                 {cameraError}
                </AlertDescription>
            </Alert>
        )}

        <Button onClick={toggleScan} disabled={isProcessing || subjects.length === 0} className="w-full">
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="mr-2 h-4 w-4" />
          )}
          {isProcessing ? 'Processing...' : (isScanning ? 'Stop Scanning' : 'Scan with Camera')}
        </Button>
      </CardContent>
    </Card>
  );
};
