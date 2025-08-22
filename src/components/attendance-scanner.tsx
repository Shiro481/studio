"use client";

import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { QrCode, Loader2, CheckCircle, XCircle, CameraOff } from 'lucide-react';
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

interface AttendanceScannerProps {
  onScanSuccess: (record: VerifyAttendanceRecordOutput) => void;
  subjects: string[];
}

export const AttendanceScanner: FC<AttendanceScannerProps> = ({ onScanSuccess, subjects }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const handleScan = async (qrCodeData: string) => {
    setIsLoading(true);
    setIsScanning(false);
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
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          handleScan(code.data);
        }
      }
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const scanLoop = () => {
      if (isScanning && !isLoading) {
        tick();
        animationFrameId = requestAnimationFrame(scanLoop);
      }
    };
    
    if (isScanning) {
      scanLoop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, isLoading, tick]);

  const toggleScan = async () => {
    if (!selectedSubject) {
      toast({
        title: 'Subject Required',
        description: 'Please select a subject before scanning.',
        variant: 'destructive',
      });
      return;
    }

    if (!isScanning) {
      await startCamera();
      setIsScanning(true);
    } else {
      stopCamera();
      setIsScanning(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
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

        {isScanning && (
            <div className="relative aspect-video w-full rounded-md border bg-muted overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="absolute inset-0 border-[8px] border-primary/50 rounded-lg" />
            </div>
        )}
        
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera access in your browser to use this feature.
                </AlertDescription>
            </Alert>
        )}

        <Button onClick={toggleScan} disabled={isLoading || subjects.length === 0} className="w-full">
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
