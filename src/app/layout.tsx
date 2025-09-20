
"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/context/AppContext';
import type { Metadata } from 'next';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import type { StoredQrCode, AttendanceRecord } from '@/types';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [storedCodes, setStoredCodes] = useState<StoredQrCode[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subjectsQuery = query(collection(db, 'subjects'));
    const unsubscribeSubjects = onSnapshot(subjectsQuery, (querySnapshot) => {
      const subjectsData = querySnapshot.docs.map(doc => doc.data().name as string);
      setSubjects(subjectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching subjects:", error);
      setLoading(false);
    });

    const codesQuery = query(collection(db, 'qrCodes'));
    const unsubscribeCodes = onSnapshot(codesQuery, (querySnapshot) => {
      const codesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredQrCode));
      setStoredCodes(codesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching QR codes:", error);
        setLoading(false);
    });

    const recordsQuery = query(collection(db, 'attendanceRecords'));
    const unsubscribeRecords = onSnapshot(recordsQuery, (querySnapshot) => {
      const recordsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords(recordsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setLoading(false);
    }, (error) => {
        console.error("Error fetching attendance records:", error);
        setLoading(false);
    });

    return () => {
      unsubscribeSubjects();
      unsubscribeCodes();
      unsubscribeRecords();
    };
  }, []);

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
        <AppProvider value={{ subjects, storedCodes, records, loading }}>
            {children}
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
