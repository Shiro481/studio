"use client";

import React, { useState, useEffect } from 'react';
import { AttendanceScanner } from '@/components/attendance-scanner';
import { AttendanceList } from '@/components/attendance-list';
import { SubjectManager } from '@/components/subject-manager';
import type { AttendanceRecord } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SwiftAttendLogo } from '@/components/icons';
import { QrCodeGenerator } from '@/components/qr-code-generator';

export default function Home() {
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);
  const [sortedRecords, setSortedRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useLocalStorage<string[]>('subjects', ['Mathematics', 'Science', 'History', 'English', 'Art']);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);

  useEffect(() => {
    const sorted = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setSortedRecords(sorted);
  }, [records]);

  const handleAddRecord = (newRecord: Omit<AttendanceRecord, 'id' | 'recordedBy'>) => {
    const recordWithId: AttendanceRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
      recordedBy: isLoggedIn ? 'User' : 'Guest',
    };
    setRecords(prevRecords => [...prevRecords, recordWithId]);
  };

  const handleClearRecords = () => {
    setRecords([]);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl mb-8">
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
        </div>
      </header>
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <AttendanceScanner onScanSuccess={handleAddRecord} subjects={subjects} />
          <QrCodeGenerator />
          <SubjectManager subjects={subjects} setSubjects={setSubjects} />
        </div>
        <div className="lg:col-span-2">
          <AttendanceList records={sortedRecords} onClear={handleClearRecords} />
        </div>
      </main>
    </div>
  );
}
