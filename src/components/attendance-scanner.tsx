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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import jsQR from 'jsqr';
import { Switch } from '@/components/ui/switch';
import type { AttendanceRecord } from '@/types';

interface AttendanceScannerProps {
  onScanSuccess: (record: Omit<AttendanceRecord, 'id'>) => void;
  subjects: string[];
}

export const AttendanceScanner: FC<AttendanceScannerProps> = ({ onScanSuccess, subjects }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanMode, setScanMode] = useState<'in' | 'out'>('in');


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const { toast } = useToast();
  
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleScan = useCallback((studentName: string) => {
    setIsProcessing(true);
    setIsScanning(false);
    
    if (studentName) {
        const newRecord = {
        studentName: studentName,
        subject: selectedSubject,
        timestamp: new Date().toISOString(),
        isValid: true,
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
    setTimeout(() => setIsProcessing(false), 500); 
  }, [onScanSuccess, scanMode, selectedSubject, toast]);


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
            return; // Stop ticking once a code is found
          }
        } catch (e) {
            // Ignore getImageData errors that can happen when the canvas is not ready
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [handleScan]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (isScanning) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
  
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(err => console.error("Video play error:", err));
              animationFrameRef.current = requestAnimationFrame(tick);
            };
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setIsScanning(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this app.',
          });
        }
      } else {
        stopCamera();
      }
    }
    
    getCameraPermission();
  
    // Cleanup function to stop the camera and animation frame on unmount
    return () => {
      stopCamera();
    };
  }, [isScanning, stopCamera, toast, tick]);


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
