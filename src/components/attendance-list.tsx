"use client";

import type { FC } from 'react';
import { Download, ListChecks, Trash2, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AttendanceRecord } from '@/types';
import { cn } from '@/lib/utils';

interface AttendanceListProps {
  records: AttendanceRecord[];
  onClear: () => void;
}

export const AttendanceList: FC<AttendanceListProps> = ({ records, onClear }) => {
  const exportToCSV = () => {
    const headers = ['Student Name', 'Subject', 'Timestamp', 'Status', 'QR Valid'];
    const csvRows = [
      headers.join(','),
      ...records.map(record =>
        [
          `"${record.studentName}"`,
          `"${record.subject}"`,
          `"${new Date(record.timestamp).toLocaleString()}"`,
          `"${record.status}"`,
          record.isValid ? 'Valid' : 'Invalid',
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance-records.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            A log of all scanned attendance records.
          </CardDescription>
        </div>
        <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={records.length === 0}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all attendance records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClear} className="bg-destructive hover:bg-destructive/90">
                    Yes, clear history
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={exportToCSV}
              disabled={records.length === 0}
              variant="outline"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">QR Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? (
                records.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.studentName}
                    </TableCell>
                    <TableCell>{record.subject}</TableCell>
                    <TableCell>
                      {new Date(record.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         {record.status === 'Logged In' ? <LogIn className="h-4 w-4 text-green-500" /> : <LogOut className="h-4 w-4 text-red-500" />}
                         <span>{record.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={record.isValid ? 'default' : 'destructive'}
                        className={cn(record.isValid && 'bg-accent text-accent-foreground')}
                      >
                        {record.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                        <ListChecks className="h-8 w-8" />
                        <span>No records yet. Start scanning to see them here.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
