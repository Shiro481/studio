
"use client";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { SubjectManager } from '@/components/subject-manager';
import { SwiftAttendLogo } from '@/components/icons';
import { Scan, History } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function GeneratorPage() {
  const router = useRouter();
  const { subjects, storedCodes } = useAppContext();

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
            <Button variant="outline" onClick={() => router.push('/history')}>
                <History className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">View History</span>
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QrCodeGenerator storedCodes={storedCodes} />
            <SubjectManager subjects={subjects} />
        </div>
      </main>
    </div>
  );
}
