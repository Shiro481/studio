
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceList } from '@/components/attendance-list';
import { SwiftAttendLogo } from '@/components/icons';
import { Scan, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, deleteDoc, getDocs, query, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { AttendanceRecord } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const recordsQuery = query(collection(db, 'attendanceRecords'));
    const unsubscribe = onSnapshot(recordsQuery, (querySnapshot) => {
      const recordsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords(recordsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, (error) => {
        console.error("Error fetching attendance records:", error);
        toast({ title: "Error", description: "Failed to load attendance history.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleClearHistory = async () => {
    if (records.length === 0) {
        toast({ title: "Info", description: "History is already empty." });
        return;
    }
    
    try {
        const recordsCollection = collection(db, "attendanceRecords");
        const recordsSnapshot = await getDocs(recordsCollection);
        
        if (recordsSnapshot.empty) {
            toast({ title: "Info", description: "History is already empty." });
            return;
        }

        const batchSize = 500;
        const batches = [];
        
        for (let i = 0; i < recordsSnapshot.docs.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = recordsSnapshot.docs.slice(i, i + batchSize);
            chunk.forEach((recordDoc) => {
                batch.delete(recordDoc.ref);
            });
            batches.push(batch.commit());
        }

        await Promise.all(batches);
        
        toast({ title: "Success", description: "Attendance history cleared." });
    } catch (error) {
        console.error("Error clearing history:", error);
        toast({ title: "Error", description: "Failed to clear history.", variant: "destructive" });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
        await deleteDoc(doc(db, "attendanceRecords", id));
        toast({ title: "Success", description: "Record deleted." });
    } catch (error) {
        console.error("Error deleting record:", error);
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
        <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
                <Scan className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Scan</span>
            </Button>
            <Button variant="outline" onClick={() => router.push('/generator')}>
                <QrCode className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Generator</span>
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <AttendanceList records={records} onClear={handleClearHistory} onDelete={handleDeleteRecord} />
        </div>
      </main>
    </div>
  );
}
