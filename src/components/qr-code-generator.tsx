
"use client";

import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { User, QrCode, Download, Trash2, List, Edit, Check, X } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import type { StoredQrCode } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';


interface QrCodeGeneratorProps {
    storedCodes: StoredQrCode[];
}

export const QrCodeGenerator: FC<QrCodeGeneratorProps> = ({ storedCodes }) => {
  const [studentName, setStudentName] = useState('');
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [codeToDelete, setCodeToDelete] = useState<StoredQrCode | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sortedCodes = [...storedCodes].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  useEffect(() => {
    if (editingCodeId && editInputRef.current) {
        editInputRef.current.focus();
    }
  }, [editingCodeId]);

  const generateQrCode = async () => {
    if (!studentName.trim()) {
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
    
    try {
        await addDoc(collection(db, 'qrCodes'), newCode);
        setStudentName('');
        toast({ title: "Success", description: `QR Code for ${newCode.name} generated.` });
    } catch (error) {
        console.error("Error generating QR code:", error);
        toast({ title: "Error", description: "Failed to save QR code.", variant: "destructive" });
    }
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
    setCodeToDelete(null);
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
            <Button onClick={generateQrCode} className="w-full sm:w-auto" disabled={!studentName.trim()}>
              <QrCode className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>

        {sortedCodes.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Saved QR Codes</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {sortedCodes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-2 bg-muted rounded-md gap-2">
                   <div className="flex items-center gap-2 flex-grow min-w-0">
                    <img src={code.url} alt={code.name} className="w-8 h-8 rounded-sm bg-white flex-shrink-0" data-ai-hint="qr code" />
                    {editingCodeId === code.id ? (
                      <div className="flex-grow flex items-center gap-2">
                        <Input
                            ref={editInputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                            }}
                            className="h-8"
                        />
                      </div>
                    ) : (
                        <span className="text-sm truncate">{code.name}</span>
                    )}
                   </div>
                   {editingCodeId === code.id ? (
                     <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" onClick={handleEditSave} aria-label="Save Name" className="text-green-600 hover:text-green-600">
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleEditCancel} aria-label="Cancel Edit" className="text-destructive hover:text-destructive">
                            <X className="h-4 w-4" />
                        </Button>
                     </div>
                   ) : (
                    <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => handleEditStart(code)} aria-label="Edit Name">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDownload(code)} aria-label="Download QR Code">
                        <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setCodeToDelete(code)} aria-label="Delete QR Code">
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}
         {storedCodes.length === 0 && (
            <div className="text-center text-muted-foreground py-4 border-t">
                <List className="mx-auto h-8 w-8 mb-2" />
                No QR codes generated yet.
            </div>
         )}
      </CardContent>
      <AlertDialog open={!!codeToDelete} onOpenChange={(isOpen) => !isOpen && setCodeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the QR code for {codeToDelete?.name}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCodeToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => codeToDelete && handleDeleteCode(codeToDelete.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </Card>
  );
};
