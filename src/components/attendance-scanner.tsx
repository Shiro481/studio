"use client";

import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { QrCode, Loader2, CheckCircle, XCircle, CameraOff, LogIn, LogOut } from 'lucide-react';
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
import { verifyAttendanceRecord } from '@/ai/flows/verify-attendance-record';
import type { VerifyAttendanceRecordOutput } from '@/ai/flows/verify-attendance-record';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import jsQR from 'jsqr';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface AttendanceScannerProps {
  onScanSuccess: (record: VerifyAttendanceRecordOutput) => void;
  subjects: string[];
}

export const AttendanceScanner: FC<AttendanceScannerProps> = ({ onScanSuccess, subjects }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const handleScan = async (qrCodeData: string) => {
    setIsLoading(true);
    stopCamera();

    try {
      const result = await verifyAttendanceRecord({
        qrCodeData,
        subject: selectedSubject,
      });

      if (result.isValid) {
        onScanSuccess(result);
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Success</span>
            </div>
          ),
          description: `Attendance for ${result.studentName} in ${result.subject} recorded.`,
        });
      } else {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>Scan Failed</span>
            </div>
          ),
          description: 'The QR code appears to be invalid.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to verify attendance:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during verification.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tick = useCallback(() => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code?.data) {
            handleScan(code.data);
          }
        } catch (e) {
            // Ignore getImageData errors that can happen when the canvas is not ready
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [handleScan, selectedSubject]);

  const startScanning = useCallback(async () => {
    if (isScanning) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
        setIsScanning(true);
        animationFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
        console.error("Error starting camera: ", err);
        setHasCameraPermission(false);
        setIsScanning(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
        });
    }
  }, [isScanning, tick, toast]);
  
  const toggleScan = async () => {
    if (!selectedSubject) {
      toast({
        title: 'Subject Required',
        description: 'Please select a subject before scanning.',
        variant: 'destructive',
      });
      return;
    }

    if (isScanning) {
      stopCamera();
    } else {
      await startScanning();
    }
  };
  
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // A more robust way to check for permission state on some browsers
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
          if (permissionStatus.state === 'granted') {
            setHasCameraPermission(true);
          } else if (permissionStatus.state === 'denied') {
            setHasCameraPermission(false);
          } else {
             setHasCameraPermission(null); // Prompt needed
          }
          permissionStatus.onchange = () => {
            setHasCameraPermission(permissionStatus.state === 'granted');
          };
        } else {
            // Fallback for browsers that don't support permissions.query
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            stream.getTracks().forEach(track => track.stop()); // Stop stream immediately
        }
      } catch (err) {
        // This will catch if permissions were never granted or are denied.
        setHasCameraPermission(false);
      }
    };
    
    checkCameraPermission();
    
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Attendance</CardTitle>
        <CardDescription>
          Select a subject and scan the student's QR code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject-select">Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isScanning || isLoading}>
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
          <Avatar>
            <AvatarImage src={isLoggedIn ? "https://placehold.co/40x40.png" : undefined} data-ai-hint="user avatar" />
            <AvatarFallback>{isLoggedIn ? 'U' : 'G'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {isLoggedIn ? 'User' : 'Guest'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isLoggedIn ? 'Recording as logged in user.' : 'Recording as anonymous guest.'}
            </p>
          </div>
          <Switch
            id="login-switch"
            checked={isLoggedIn}
            onCheckedChange={setIsLoggedIn}
            aria-label="Login status"
          />
        </div>


        <div className="relative aspect-video w-full rounded-md border bg-muted overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {isScanning && <div className="absolute inset-0 border-[8px] border-primary/50 rounded-lg" />}
        </div>
        
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera access in your browser to use this feature.
                </AlertDescription>
            </Alert>
        )}

        <Button onClick={toggleScan} disabled={isLoading || subjects.length === 0 || hasCameraPermission !== true} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Verifying...' : (isScanning ? 'Stop Scanning' : 'Scan with Camera')}
        </Button>
      </CardContent>
    </Card>
  );
};
