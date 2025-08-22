
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceScanner } from '@/components/attendance-scanner';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { AttendanceRecord } from '@/types';
import { UserNav } from '@/components/user-nav';
import { SwiftAttendLogo } from '@/components/icons';
import { History, QrCode } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);
  const [subjects, setSubjects] = useLocalStorage<string[]>('subjects', ['Math', 'Science', 'History']);

  const handleScanSuccess = (newRecord: Omit<AttendanceRecord, 'id'>) => {
    setRecords(prev => [{ ...newRecord, id: crypto.randomUUID() }, ...prev]);
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
          <AttendanceScanner onScanSuccess={handleScanSuccess} subjects={subjects} />
        </div>
      </main>
    </div>
  );
}
