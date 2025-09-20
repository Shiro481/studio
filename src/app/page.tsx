
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceScanner } from '@/components/attendance-scanner';
import type { AttendanceRecord, StoredQrCode } from '@/types';
import { SwiftAttendLogo } from '@/components/icons';
import { History, QrCode, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function HomePage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [storedCodes, setStoredCodes] = useState<StoredQrCode[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const subjectsQuery = query(collection(db, 'subjects'));
    const unsubscribeSubjects = onSnapshot(subjectsQuery, (querySnapshot) => {
      const subjectsData = querySnapshot.docs.map(doc => doc.data().name as string);
      setSubjects(subjectsData);
    });
  
    const codesQuery = query(collection(db, 'qrCodes'));
    const unsubscribeCodes = onSnapshot(codesQuery, (querySnapshot) => {
      const codesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredQrCode));
      setStoredCodes(codesData);
    });

    const recordsQuery = query(collection(db, 'attendanceRecords'));
    const unsubscribeRecords = onSnapshot(recordsQuery, (querySnapshot) => {
      const recordsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords(recordsData);
    });
  
    return () => {
      unsubscribeSubjects();
      unsubscribeCodes();
      unsubscribeRecords();
    };
  }, []);


  const handleScanSuccess = useCallback(async (newRecord: Omit<AttendanceRecord, 'id' | 'timestamp'> & { studentName: string }) => {
    if (newRecord.status === 'Logged In') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, "attendanceRecords"),
            where("studentName", "==", newRecord.studentName),
            where("subject", "==", newRecord.subject),
            where("status", "==", "Logged In")
        );
        
        const querySnapshot = await getDocs(q);
        const alreadyLoggedIn = querySnapshot.docs.some(doc => {
            const record = doc.data() as AttendanceRecord;
            return new Date(record.timestamp) >= today;
        });


        if (alreadyLoggedIn) {
            const existingRecordDoc = querySnapshot.docs.find(doc => new Date(doc.data().timestamp) >= today)!;
            const existingRecord = existingRecordDoc.data() as AttendanceRecord;
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
    
    await addDoc(collection(db, 'attendanceRecords'), {
        ...newRecord,
        timestamp: new Date().toISOString(),
    });

  }, []);

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
