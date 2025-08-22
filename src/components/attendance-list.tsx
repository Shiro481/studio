"use client";

import type { FC } from 'react';
import { Download, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface AttendanceListProps {
  records: AttendanceRecord[];
}

export const AttendanceList: FC<AttendanceListProps> = ({ records }) => {
  const exportToCSV = () => {
    const headers = ['Student Name', 'Subject', 'Timestamp', 'Status'];
    const csvRows = [
      headers.join(','),
      ...records.map(record =>
        [
          `"${record.studentName}"`,
          `"${record.subject}"`,
          `"${new Date(record.timestamp).toLocaleString()}"`,
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
        <Button
          onClick={exportToCSV}
          disabled={records.length === 0}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Status</TableHead>
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
                    <TableCell className="text-right">
                      <Badge
                        variant={record.isValid ? 'default' : 'destructive'}
                        className={record.isValid ? 'bg-accent text-accent-foreground' : ''}
                      >
                        {record.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
