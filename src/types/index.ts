
export type AttendanceRecord = {
  id: string;
  studentName: string;
  timestamp: string;
  subject: string;
  status: 'Logged In' | 'Logged Out';
};

export interface StoredQrCode {
  id: string;
  name: string;
  url: string;
  data: string;
  createdAt?: string;
}
