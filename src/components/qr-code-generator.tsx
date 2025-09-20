
"use client";

import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { User, QrCode, Download, Trash2, List, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { StoredQrCode } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';


interface QrCodeGeneratorProps {
    storedCodes: StoredQrCode[];
}

export const QrCodeGenerator: FC<QrCodeGeneratorProps> = ({ storedCodes }) => {
  const [studentName, setStudentName] = useState('');
  const [generatedCode, setGeneratedCode] = useState<StoredQrCode | null>(null);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [sortedCodes, setSortedCodes] = useState<StoredQrCode[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const sorted = [...storedCodes].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    setSortedCodes(sorted);
  }, [storedCodes]);


  useEffect(() => {
    if (editingCodeId && editInputRef.current) {
        editInputRef.current.focus();
    }
  }, [editingCodeId]);

  const generateQrCode = async () => {
    if (!studentName.trim()) {
      toast({ title: "Error", description: "Please enter a student name.", variant: "destructive" });
      return;
    }
    const name = studentName.trim();
    const qrData = crypto.randomUUID();
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200&format=png`;

    const newCode: Omit<StoredQrCode, 'id'> = {
      name: name,
      url: url,
      data: qrData,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'qrCodes'), newCode);
    setGeneratedCode({ id: docRef.id, ...newCode });
    setStudentName('');
    toast({ title: "Success", description: `QR Code for ${newCode.name} generated.` });
  };
  
  const handleDownload = async (code: StoredQrCode) => {
    try {
        const response = await fetch(code.url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${code.name.trim().replace(/\s+/g, '_')}_qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Download failed:", error);
        toast({ title: "Error", description: "Failed to download QR code.", variant: "destructive" });
    }
  };

  const handleDeleteCode = async (id: string) => {
    await deleteDoc(doc(db, "qrCodes", id));
    toast({ title: "Success", description: "QR Code removed." });
  };
  
  const handleEditStart = (code: StoredQrCode) => {
    setEditingCodeId(code.id);
    setEditingName(code.name);
  };

  const handleEditCancel = () => {
    setEditingCodeId(null);
    setEditingName('');
  };

  const handleEditSave = async () => {
    if (!editingCodeId) return;

    if (!editingName.trim()) {
      toast({ title: "Error", description: "Student name cannot be empty.", variant: "destructive" });
      return;
    }
    
    const codeDocRef = doc(db, "qrCodes", editingCodeId);
    await updateDoc(codeDocRef, { name: editingName.trim() });

    toast({ title: "Success", description: "Student name updated." });
    handleEditCancel();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate QR Code</CardTitle>
        <CardDescription>
          Create and manage unique QR codes for students.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="student-name">Student Name</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="student-name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student's name"
              onKeyDown={(e) => e.key === 'Enter' && generateQrCode()}
            />
            <Button onClick={generateQrCode} className="w-full sm:w-auto">
              <QrCode className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>

        {generatedCode && (
          <div className="flex flex-col items-center gap-4 pt-4 border-t">
             <div className="p-4 bg-white rounded-lg border">
                <img src={generatedCode.url} alt="Generated QR Code" className="w-48 h-48" data-ai-hint="qr code" />
             </div>
            <p className="text-sm font-medium">{generatedCode.name}</p>
            <Button onClick={() => handleDownload(generatedCode)} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
            </Button>
          </div>
        )}

        {isClient && sortedCodes.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Saved QR Codes</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {sortedCodes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-2 bg-muted rounded-md gap-2">
                   <div className="flex items-center gap-2 flex-grow min-w-0">
                    <img src={code.url} alt={code.name} className="w-8 h-8 rounded-sm bg-white flex-shrink-0" data-ai-hint="qr code" />
                    {editingCodeId === code.id ? (
                        <Input
                            ref={editInputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                            }}
                            className="h-8"
                        />
                    ) : (
                        <span className="text-sm truncate">{code.name}</span>
                    )}
                   </div>
                  <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => handleEditStart(code)} aria-label="Edit Name">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDownload(code)} aria-label="Download QR Code">
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Delete QR Code">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the QR code for {code.name}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCode(code.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
         {isClient && sortedCodes.length === 0 && !generatedCode && (
            <div className="text-center text-muted-foreground py-4 border-t">
                <List className="mx-auto h-8 w-8 mb-2" />
                No QR codes generated yet.
            </div>
         )}
      </CardContent>
    </Card>
  );
};
