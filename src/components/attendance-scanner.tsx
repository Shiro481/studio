"use client";

import { useState } from 'react';
import type { FC } from 'react';
import { QrCode, Loader2, CheckCircle, XCircle } from 'lucide-react';
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

interface AttendanceScannerProps {
  onScanSuccess: (record: VerifyAttendanceRecordOutput) => void;
}

const subjects = ['Mathematics', 'Science', 'History', 'English', 'Art'];

export const AttendanceScanner: FC<AttendanceScannerProps> = ({ onScanSuccess }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!selectedSubject) {
      toast({
        title: 'Subject Required',
        description: 'Please select a subject before scanning.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate scanning a QR code
      const qrCodeData = JSON.stringify({
        studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: `Student ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`, // Random letter A-Z
        timestamp: new Date().toISOString(),
      });
      
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
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
        <Button onClick={handleScan} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Scanning...' : 'Scan QR Code'}
        </Button>
      </CardContent>
    </Card>
  );
};
