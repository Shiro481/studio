"use client";

import { useState } from 'react';
import type { FC } from 'react';
import { User, QrCode, Download } from 'lucide-react';
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

export const QrCodeGenerator: FC = () => {
  const [studentName, setStudentName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQrCode = () => {
    if (!studentName.trim()) {
      setQrCodeUrl('');
      return;
    }
    const studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrData = JSON.stringify({
        studentId: studentId,
        name: studentName.trim(),
        timestamp: new Date().toISOString(),
    });
    // Using a free API to generate QR codes
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200`;
    setQrCodeUrl(url);
  };
  
  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${studentName.trim().replace(/\s+/g, '_')}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate QR Code</CardTitle>
        <CardDescription>
          Create a unique QR code for a student.
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
            />
            <Button onClick={generateQrCode}>
              <QrCode className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>

        {qrCodeUrl && (
          <div className="flex flex-col items-center gap-4 pt-4">
             <div className="p-4 bg-white rounded-lg border">
                <img src={qrCodeUrl} alt="Generated QR Code" className="w-48 h-48" data-ai-hint="qr code" />
             </div>
            <p className="text-sm font-medium">{studentName.trim()}</p>
            <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
