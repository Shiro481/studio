"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AttendanceScanner } from '@/components/attendance-scanner';
import { SubjectManager } from '@/components/subject-manager';
import type { AttendanceRecord } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SwiftAttendLogo } from '@/components/icons';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';

export default function Home() {
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);
  const [subjects, setSubjects] = useLocalStorage<string[]>('subjects', ['Mathematics', 'Science', 'History', 'English', 'Art']);

  const handleAddRecord = (newRecord: Omit<AttendanceRecord, 'id'>) => {
    const recordWithId: AttendanceRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
    };
    setRecords(prevRecords => [...prevRecords, recordWithId]);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl mb-8">
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
             <Button asChild variant="outline">
              <Link href="/history">
                <ListChecks className="mr-2 h-4 w-4" />
                View History
              </Link>
            </Button>
        </div>
      </header>
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-1 flex flex-col gap-8">
          <AttendanceScanner onScanSuccess={handleAddRecord} subjects={subjects} />
        </div>
        <div className="md:col-span-1 flex flex-col gap-8">
          <QrCodeGenerator />
          <SubjectManager subjects={subjects} setSubjects={setSubjects} />
        </div>
      </main>
    </div>
  );
}
