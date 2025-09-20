"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceList } from '@/components/attendance-list';
import type { AttendanceRecord } from '@/types';
import { SwiftAttendLogo } from '@/components/icons';
import { Scan, QrCode } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'attendanceRecords'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords(recordsData);
    });
    return () => unsub();
  }, []);

  const handleClearHistory = async () => {
    try {
        const querySnapshot = await collection(db, 'attendanceRecords').get();
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        toast({ title: "Success", description: "Attendance history cleared." });
    } catch (error) {
        console.error("Error clearing history: ", error);
        toast({ title: "Error", description: "Failed to clear history.", variant: "destructive" });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'attendanceRecords', id));
        toast({ title: "Success", description: "Record deleted." });
    } catch (error) {
        console.error("Error deleting record: ", error);
        toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
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
            <Button variant="outline" onClick={() => router.push('/')}>
                <Scan className="mr-2 h-4 w-4" />
                Scan
            </Button>
            <Button variant="outline" onClick={() => router.push('/generator')}>
                <QrCode className="mr-2 h-4 w-4" />
                Generator
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <AttendanceList records={records} onClear={handleClearHistory} onDelete={handleDeleteRecord} />
        </div>
      </main>
    </div>
  );
}
