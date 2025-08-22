"use client";

import React from 'react';
import Link from 'next/link';
import { AttendanceScanner } from '@/components/attendance-scanner';
import type { AttendanceRecord } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SwiftAttendLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ListChecks, QrCode } from 'lucide-react';

export default function Home() {
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);
  const [subjects] = useLocalStorage<string[]>('subjects', ['Mathematics', 'Science', 'History', 'English', 'Art']);

  const handleAddRecord = (newRecord: Omit<AttendanceRecord, 'id'>) => {
    const recordWithId: AttendanceRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
    };
    setRecords(prevRecords => [...prevRecords, recordWithId]);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SwiftAttendLogo className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-headline">
                  SwiftAttend
                </h1>
                <p className="text-muted-foreground">
                  Effortless QR Code Attendance Tracking
                </p>
              </div>
            </div>
             <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/generator">
                    <QrCode className="mr-2 h-4 w-4" />
                    Generator
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/history">
                    <ListChecks className="mr-2 h-4 w-4" />
                    History
                  </Link>
                </Button>
            </div>
        </div>
      </header>
      <main className="w-full max-w-2xl flex flex-col gap-8">
        <AttendanceScanner onScanSuccess={handleAddRecord} subjects={subjects} />
      </main>
    </div>
  );
}
