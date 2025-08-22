"use client";

import { useState } from 'react';
import type { FC } from 'react';
import { User, QrCode, Download, Trash2, List } from 'lucide-react';
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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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


interface StoredQrCode {
    id: string;
    name: string;
    url: string;
    data: string;
}

export const QrCodeGenerator: FC = () => {
  const [studentName, setStudentName] = useState('');
  const [generatedCode, setGeneratedCode] = useState<StoredQrCode | null>(null);
  const [storedCodes, setStoredCodes] = useLocalStorage<StoredQrCode[]>('qrCodes', []);
  const { toast } = useToast();

  const generateQrCode = () => {
    if (!studentName.trim()) {
      toast({ title: "Error", description: "Please enter a student name.", variant: "destructive" });
      return;
    }
    const studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrData = JSON.stringify({
        studentId: studentId,
        name: studentName.trim(),
        timestamp: new Date().toISOString(),
    });
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200&format=png`;

    const newCode: StoredQrCode = {
      id: crypto.randomUUID(),
      name: studentName.trim(),
      url: url,
      data: qrData,
    };
    
    setGeneratedCode(newCode);
    setStoredCodes(prev => [...prev, newCode]);
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

  const handleDeleteCode = (id: string) => {
    setStoredCodes(prev => prev.filter(code => code.id !== id));
    toast({ title: "Success", description: "QR Code removed." });
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
          <div className="flex gap-2">
            <Input
              id="student-name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student's name"
              onKeyDown={(e) => e.key === 'Enter' && generateQrCode()}
            />
            <Button onClick={generateQrCode}>
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

        {storedCodes.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Saved QR Codes</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {storedCodes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                   <div className="flex items-center gap-2">
                    <img src={code.url} alt={code.name} className="w-8 h-8 rounded-sm bg-white" data-ai-hint="qr code" />
                    <span className="text-sm">{code.name}</span>
                   </div>
                  <div className="flex gap-1">
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
         {storedCodes.length === 0 && !generatedCode && (
            <div className="text-center text-muted-foreground py-4 border-t">
                <List className="mx-auto h-8 w-8 mb-2" />
                No QR codes generated yet.
            </div>
         )}
      </CardContent>
    </Card>
  );
};
