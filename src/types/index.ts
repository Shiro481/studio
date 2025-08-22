export type AttendanceRecord = {
  id: string;
  studentName: string;
  timestamp: string;
  subject: string;
  isValid: boolean;
  status: 'Logged In' | 'Logged Out';
};
