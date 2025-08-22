"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { SubjectManager } from '@/components/subject-manager';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SwiftAttendLogo } from '@/components/icons';
import { UserNav } from '@/components/user-nav';
import { Scan, History } from 'lucide-react';

export default function GeneratorPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useLocalStorage<string[]>('subjects', ['Math', 'Science', 'History']);

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
            <Button variant="outline" onClick={() => router.push('/history')}>
                <History className="mr-2 h-4 w-4" />
                View History
            </Button>
            <UserNav />
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <QrCodeGenerator />
            <SubjectManager subjects={subjects} setSubjects={setSubjects} />
        </div>
      </main>
    </div>
  );
}
