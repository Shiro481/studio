
export type AttendanceRecord = {
  id: string;
  studentName: string;
  timestamp: string;
  subject: string;
  isValid: boolean;
  status: 'Logged In' | 'Logged Out';
  scanDate?: string;
};

export interface StoredQrCode {
  id: string;
  name: string;
  url: string;
  data: string;
  createdAt?: string;
}
