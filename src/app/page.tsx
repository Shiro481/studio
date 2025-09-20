"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceScanner } from '@/components/attendance-scanner';
import type { AttendanceRecord, StoredQrCode } from '@/types';
import { SwiftAttendLogo } from '@/components/icons';
import { History, QrCode, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function HomePage() {
  const router = useRouter();
  const [subjects] = useLocalStorage<string[]>('subjects', []);
  const [storedCodes] = useLocalStorage<StoredQrCode[]>('qrCodes', []);
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);
  const { toast } = useToast();

  const handleScanSuccess = (newRecord: Omit<AttendanceRecord, 'id' | 'timestamp'> & { studentName: string }) => {
    if (newRecord.status === 'Logged In') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alreadyLoggedIn = records.some(
            (record) =>
                record.studentName === newRecord.studentName &&
                record.subject === newRecord.subject &&
                record.status === 'Logged In' &&
                new Date(record.timestamp) >= today
        );

        if (alreadyLoggedIn) {
            const existingRecord = records.find(
              (record) =>
                record.studentName === newRecord.studentName &&
                record.subject === newRecord.subject &&
                record.status === 'Logged In' &&
                new Date(record.timestamp) >= today
            )!;
            toast({
                variant: 'destructive',
                title: (
                    <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        <span>Login Failed</span>
                    </div>
                ),
                description: `${newRecord.studentName} has already logged in for ${newRecord.subject} at ${new Date(existingRecord.timestamp).toLocaleTimeString()}.`,
            });
            return;
        }
    }
    
    setRecords(prev => {
        const recordWithId: AttendanceRecord = {
            ...newRecord,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };
        return [...prev, recordWithId];
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <SwiftAttendLogo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-primary">SwiftAttend</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" onClick={() => router.push('/generator')}>
                <QrCode className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Generator</span>
            </Button>
            <Button variant="outline" onClick={() => router.push('/history')}>
                <History className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">View History</span>
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <AttendanceScanner onScanSuccess={handleScanSuccess} subjects={subjects} storedCodes={storedCodes} />
        </div>
      </main>
    </div>
  );
}
