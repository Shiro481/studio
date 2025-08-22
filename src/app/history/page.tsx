"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceList } from '@/components/attendance-list';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { AttendanceRecord } from '@/types';
import { SwiftAttendLogo } from '@/components/icons';
import { Scan, QrCode } from 'lucide-react';


export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);

  const handleClearHistory = () => {
    setRecords([]);
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
          <AttendanceList records={records} onClear={handleClearHistory} />
        </div>
      </main>
    </div>
  );
}
