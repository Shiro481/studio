
"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceScanner } from '@/components/attendance-scanner';
import type { AttendanceRecord } from '@/types';
import { SwiftAttendLogo } from '@/components/icons';
import { History, QrCode, XCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { storedCodes, subjects, records, setRecords } = useAppContext();

  const handleScanSuccess = useCallback(async (scannedData: { qrData: string, subject: string, status: 'Logged In' | 'Logged Out' }): Promise<boolean> => {
    
    const matchingCode = storedCodes.find(c => c.data === scannedData.qrData);

    if (!matchingCode) {
        toast({
            variant: 'destructive',
            title: (
                <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    <span>Scan Failed</span>
                </div>
            ),
            description: 'This QR code is not recognized by the system.',
        });
        return false;
    }
    
    const newRecordBase = {
        studentName: matchingCode.name,
        subject: scannedData.subject,
        status: scannedData.status,
    };

    if (newRecordBase.status === 'Logged In') {
        const todayString = new Date().toISOString().split('T')[0];
        const hasLoggedInToday = records.some(rec => 
            rec.studentName === newRecordBase.studentName &&
            rec.subject === newRecordBase.subject &&
            rec.status === 'Logged In' &&
            rec.timestamp.startsWith(todayString)
        );
        
        if (hasLoggedInToday) {
            const existingRecord = records.find(rec => 
                rec.studentName === newRecordBase.studentName &&
                rec.subject === newRecordBase.subject &&
                rec.status === 'Logged In' &&
                rec.timestamp.startsWith(todayString)
            )!;
            toast({
                variant: 'destructive',
                title: (
                    <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        <span>Login Failed</span>
                    </div>
                ),
                description: `${newRecordBase.studentName} has already logged in for ${newRecordBase.subject} at ${new Date(existingRecord.timestamp).toLocaleTimeString()}.`,
            });
            return false;
        }
    }
    
    const newRecord: AttendanceRecord = {
        id: crypto.randomUUID(),
        ...newRecordBase,
        timestamp: new Date().toISOString(),
    };

    setRecords(prevRecords => [newRecord, ...prevRecords]);
    
    toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Success</span>
          </div>
        ),
        description: `${newRecord.studentName} has been ${newRecord.status.toLowerCase()} for ${scannedData.subject}.`,
    });

    return true;

  }, [toast, storedCodes, records, setRecords]);

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
          <AttendanceScanner onScanSuccess={handleScanSuccess} subjects={subjects} />
        </div>
      </main>
    </div>
  );
}
