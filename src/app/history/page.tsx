"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AttendanceList } from '@/components/attendance-list';
import type { AttendanceRecord } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SwiftAttendLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function HistoryPage() {
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);
  const [sortedRecords, setSortedRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const sorted = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setSortedRecords(sorted);
  }, [records]);

  const handleClearRecords = () => {
    setRecords([]);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl mb-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Button asChild variant="outline" size="icon">
                  <Link href="/">
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
              <div className="flex items-center gap-4">
                 <SwiftAttendLogo className="h-12 w-12 text-primary" />
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-headline">
                      Attendance History
                    </h1>
                     <p className="text-muted-foreground">
                      A log of all scanned attendance records.
                    </p>
                  </div>
              </div>
            </div>
        </div>
      </header>
      <main className="w-full max-w-6xl">
         <AttendanceList records={sortedRecords} onClear={handleClearRecords} />
      </main>
    </div>
  );
}
