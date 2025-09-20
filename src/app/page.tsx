"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceScanner } from '@/components/attendance-scanner';
import type { AttendanceRecord, StoredQrCode } from '@/types';
import { SwiftAttendLogo } from '@/components/icons';
import { History, QrCode, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function HomePage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [storedCodes, setStoredCodes] = useState<StoredQrCode[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      setSubjects(snapshot.docs.map(doc => doc.data().name).sort());
    });
    const unsubQrCodes = onSnapshot(collection(db, 'qrCodes'), (snapshot) => {
      setStoredCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredQrCode)));
    });

    return () => {
      unsubSubjects();
      unsubQrCodes();
    };
  }, []);

  const handleScanSuccess = async (newRecord: Omit<AttendanceRecord, 'id'>) => {
    if (newRecord.status === 'Logged In') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        collection(db, 'attendanceRecords'),
        where('studentName', '==', newRecord.studentName),
        where('subject', '==', newRecord.subject),
        where('status', '==', 'Logged In'),
        where('timestamp', '>=', today.toISOString()),
        where('timestamp', '<', tomorrow.toISOString()),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingRecord = querySnapshot.docs[0].data();
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
    
    try {
      await addDoc(collection(db, "attendanceRecords"), newRecord);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save attendance record.' });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <SwiftAttendLogo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-primary">SwiftAttend</h1>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/generator')}>
                <QrCode className="mr-2 h-4 w-4" />
                Generator
            </Button>
            <Button variant="outline" onClick={() => router.push('/history')}>
                <History className="mr-2 h-4 w-4" />
                View History
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <AttendanceScanner onScanSuccess={handleScanSuccess} subjects={subjects} storedCodes={storedCodes} />
        </div>
      </main>
    </div>
  );
}
