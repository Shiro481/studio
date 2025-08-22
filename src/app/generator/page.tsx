
"use client";

import React from 'react';
import Link from 'next/link';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { SubjectManager } from '@/components/subject-manager';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SwiftAttendLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ListChecks } from 'lucide-react';

export default function GeneratorPage() {
    const [subjects, setSubjects] = useLocalStorage<string[]>('subjects', ['Mathematics', 'Science', 'History', 'English', 'Art']);

  return (
    <div className="flex flex-col items-center min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl mb-8">
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
                      Tools
                    </h1>
                     <p className="text-muted-foreground">
                      Generate QR codes and manage subjects.
                    </p>
                  </div>
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
            <QrCodeGenerator />
        </div>
        <div className="md:col-span-1 flex flex-col gap-8">
          <SubjectManager subjects={subjects} setSubjects={setSubjects} />
        </div>
      </main>
    </div>
  );
}
