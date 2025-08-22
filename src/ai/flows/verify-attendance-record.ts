'use server';

/**
 * @fileOverview This file contains the Genkit flow for verifying attendance records.
 *
 * - verifyAttendanceRecord - A function that verifies the accuracy of scanned QR code data and generates an attendance record.
 * - VerifyAttendanceRecordInput - The input type for the verifyAttendanceRecord function.
 * - VerifyAttendanceRecordOutput - The return type for the verifyAttendanceRecord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyAttendanceRecordInputSchema = z.object({
  qrCodeData: z
    .string()
    .describe('The data extracted from the scanned QR code.'),
  subject: z.string().describe('The subject for which attendance is being taken.'),
});
export type VerifyAttendanceRecordInput = z.infer<typeof VerifyAttendanceRecordInputSchema>;

const VerifyAttendanceRecordOutputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  timestamp: z.string().describe('The timestamp of the attendance record.'),
  subject: z.string().describe('The subject for which attendance is recorded.'),
  isValid: z.boolean().describe('Whether the QR code is valid and the attendance record is accurate.'),
});
export type VerifyAttendanceRecordOutput = z.infer<typeof VerifyAttendanceRecordOutputSchema>;

export async function verifyAttendanceRecord(input: VerifyAttendanceRecordInput): Promise<VerifyAttendanceRecordOutput> {
  return verifyAttendanceRecordFlow(input);
}

const verifyAttendanceRecordPrompt = ai.definePrompt({
  name: 'verifyAttendanceRecordPrompt',
  input: {schema: VerifyAttendanceRecordInputSchema},
  output: {schema: VerifyAttendanceRecordOutputSchema},
  prompt: `You are an AI assistant that verifies attendance records based on scanned QR code data.

  Analyze the following information to generate a concise and accurate attendance record:

  QR Code Data: {{{qrCodeData}}}
  Subject: {{{subject}}}

  Determine if the QR code data is valid and extract the student's name. Generate a timestamp for the record.
  If the QR code is not valid, set isValid to false.
  Ensure that the timestamp accurately represents the time of the scan.
  Return the attendance record with the student's name, timestamp, subject, and validation status.
`,
});

const verifyAttendanceRecordFlow = ai.defineFlow(
  {
    name: 'verifyAttendanceRecordFlow',
    inputSchema: VerifyAttendanceRecordInputSchema,
    outputSchema: VerifyAttendanceRecordOutputSchema,
  },
  async input => {
    const timestamp = new Date().toISOString();
    const {output} = await verifyAttendanceRecordPrompt({...input, timestamp});
    return output!;
  }
);
