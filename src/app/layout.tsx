
"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/context/AppContext';
import type { StoredQrCode, AttendanceRecord } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [subjects, setSubjects] = useLocalStorage<string[]>('subjects', []);
  const [storedCodes, setStoredCodes] = useLocalStorage<StoredQrCode[]>('qrCodes', []);
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', []);

  // While useLocalStorage is synchronous on the client after the first render,
  // the initial server render will have an empty state. We can show a loading state
  // or just let it render with initial empty data. For this app, empty data is fine.
  const loading = false; 

  const appContextValue = {
    subjects,
    setSubjects,
    storedCodes,
    setStoredCodes,
    records,
    setRecords,
    loading,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          <title>SwiftAttend</title>
          <meta name="description" content="QR Code Attendance System" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#29ABE2" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <AppProvider value={appContextValue}>
            {children}
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
