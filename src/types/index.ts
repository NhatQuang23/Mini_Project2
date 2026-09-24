export type BuildingCode = 'A' | 'B' | 'C' | 'V';

export type EquipmentType = 
  | 'Projector'
  | 'Whiteboard'
  | 'High-spec PC'
  | 'AC'
  | 'Sound System'
  | 'Video Conference';

export interface Room {
  id: string;
  name: string;
  building: BuildingCode;
  floor: number;
  capacity: number;
  equipment: EquipmentType[];
  imageUrl: string;
  description: string;
  isLab: boolean;
  labSpec?: string;
  openingHours: string;
}

export interface TimeSlot {
  id: string;
  label: string; // e.g. "07:30 - 09:30"
  startTime: string; // "07:30"
  endTime: string; // "09:30"
  period: 'morning' | 'afternoon';
}

export type BookingStatus = 'confirmed' | 'checked-in' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  building: BuildingCode;
  floor: number;
  date: string; // YYYY-MM-DD
  slotId: string;
  slotLabel: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: BookingStatus;
  createdAt: string; // ISO string
  qrCodePayload: string;
  notificationId?: string;
}

export interface FilterState {
  searchQuery: string;
  building: BuildingCode | 'ALL';
  minCapacity: number;
  equipment: EquipmentType[];
}

export interface UserProfile {
  id: string;
  studentId: string;
  name: string;
  email: string;
  faculty: string;
  phone: string;
  avatarUrl: string;
}
