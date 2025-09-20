
"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttendanceScanner } from '@/components/attendance-scanner';
import type { AttendanceRecord, StoredQrCode } from '@/types';
import { SwiftAttendLogo } from '@/components/icons';
import { History, QrCode, XCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { storedCodes, subjects } = useAppContext();

  const handleScanSuccess = useCallback(async (scannedData: { qrData: string, subject: string, status: 'Logged In' | 'Logged Out' }) => {
    
    let studentName = '';
    let isValidCode = false;

    // 1. Fast check in local cache first
    const matchingCode = storedCodes.find(c => c.data === scannedData.qrData);

    if (matchingCode) {
        studentName = matchingCode.name;
        isValidCode = true;
    } else {
        // 2. If not in cache, fallback to a direct Firestore query
        try {
            const q = query(collection(db, "qrCodes"), where("data", "==", scannedData.qrData), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const codeDoc = querySnapshot.docs[0].data() as StoredQrCode;
                studentName = codeDoc.name;
                isValidCode = true;
            }
        } catch (error) {
            console.error("Error querying Firestore for QR code:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not verify QR code. Please try again.',
            });
            return;
        }
    }

    if (!isValidCode) {
        toast({
            variant: 'destructive',
            title: (
                <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    <span>Scan Failed</span>
                </div>
            ),
            description: 'This QR code is not recognized by the system.',
        });
        return;
    }
    
    const newRecordBase = {
        studentName: studentName,
        subject: scannedData.subject,
        status: scannedData.status,
    };

    // Check for existing login only if the status is 'Logged In'
    if (newRecordBase.status === 'Logged In') {
        const todayString = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        const q = query(
            collection(db, "attendanceRecords"),
            where("studentName", "==", newRecordBase.studentName),
            where("subject", "==", newRecordBase.subject),
            where("status", "==", "Logged In"),
            where("scanDate", "==", todayString)
        );
        
        try {
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const existingRecord = querySnapshot.docs[0].data() as AttendanceRecord;
                toast({
                    variant: 'destructive',
                    title: (
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            <span>Login Failed</span>
                        </div>
                    ),
                    description: `${newRecordBase.studentName} has already logged in for ${newRecordBase.subject} at ${new Date(existingRecord.timestamp).toLocaleTimeString()}.`,
                });
                return;
            }
        } catch (error) {
             console.error("Error checking for existing login:", error);
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not check for previous login. Please try again.',
            });
            return;
        }
    }
    
    try {
        const timestamp = new Date().toISOString();
        await addDoc(collection(db, 'attendanceRecords'), {
            ...newRecordBase,
            timestamp: timestamp,
            scanDate: timestamp.split('T')[0], // Add YYYY-MM-DD for efficient querying
        });
        
        // Use a short timeout to allow Firestore's real-time listener to update the UI
        setTimeout(() => {
            toast({
                title: (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Success</span>
                  </div>
                ),
                description: `Scan processed for subject ${scannedData.subject}.`,
            });
        }, 100);

    } catch (error) {
        console.error("Error adding document: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not save attendance record.',
        });
    }
  }, [toast, storedCodes]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <SwiftAttendLogo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-primary">SwiftAttend</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" onClick={() => router.push('/generator')}>
                <QrCode className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Generator</span>
            </Button>
            <Button variant="outline" onClick={() => router.push('/history')}>
                <History className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">View History</span>
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <AttendanceScanner onScanSuccess={handleScanSuccess} subjects={subjects} />
        </div>
      </main>
    </div>
  );
}
