
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
import type { AttendanceRecord } from '@/types';

interface AttendanceScannerProps {
  onScanSuccess: (data: { qrData: string, subject: string, status: 'Logged In' | 'Logged Out' }) => Promise<boolean>;
  subjects: string[];
}

export const AttendanceScanner: FC<AttendanceScannerProps> = ({ onScanSuccess, subjects }) => {
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
  
  const handleScan = useCallback(async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);

    const success = await onScanSuccess({
        qrData,
        subject: selectedSubject,
        status: scanMode === 'in' ? 'Logged In' : 'Logged Out',
    });

    if (success) {
      setIsScanning(false);
    }
    
    // Short cooldown before allowing another scan attempt, even on failure
    setTimeout(() => {
        setIsProcessing(false);
    }, 1000);

  }, [isProcessing, scanMode, selectedSubject, onScanSuccess]);

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
          }
        } catch (e) {
            // Ignore getImageData errors that can happen on occasion
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
        setIsProcessing(false); // Reset processing state when starting camera
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
              if (!animationFrameRef.current) {
                  animationFrameRef.current = requestAnimationFrame(tick);
              }
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
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isScanning}>
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
            {isScanning && hasCameraPermission && !isProcessing && <div className="absolute inset-0 border-8 border-primary/50 rounded-lg animate-pulse" />}
            {isProcessing && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="h-12 w-12 text-white animate-spin" /></div>}
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

        <Button onClick={toggleScan} disabled={subjects.length === 0} className="w-full">
          <QrCode className="mr-2 h-4 w-4" />
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>
      </CardContent>
    </Card>
  );
};
