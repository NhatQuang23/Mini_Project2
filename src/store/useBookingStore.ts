import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, BuildingCode, EquipmentType, FilterState, Room, UserProfile } from '../types';
import { MOCK_ROOMS, INITIAL_USER } from '../data/mockRooms';
import { TIME_SLOTS } from '../data/timeSlots';
import { scheduleBookingReminder, cancelBookingReminder } from '../services/notificationService';

// Format helper for YYYY-MM-DD
export function getFormattedDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial sample bookings to showcase conflict engine
const todayStr = getFormattedDate(0);
const tomorrowStr = getFormattedDate(1);

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bkg-demo-101',
    roomId: 'room-a-204',
    roomName: 'Smart Seminar Room A.204',
    building: 'A',
    floor: 2,
    date: todayStr,
    slotId: 'slot-2', // 09:30 - 11:30
    slotLabel: '09:30 - 11:30',
    studentId: '20IT102',
    studentName: 'Le Hoang Nam',
    studentEmail: 'namlh.20it@vku.udn.vn',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    qrCodePayload: JSON.stringify({
      bookingId: 'bkg-demo-101',
      room: 'A.204',
      date: todayStr,
      slot: '09:30 - 11:30',
      student: 'Le Hoang Nam',
    }),
  },
  {
    id: 'bkg-demo-102',
    roomId: 'room-b-305',
    roomName: 'Mobile App Dev Lab B.305',
    building: 'B',
    floor: 3,
    date: todayStr,
    slotId: 'slot-1', // 07:30 - 09:30
    slotLabel: '07:30 - 09:30',
    studentId: '23IT220', // current user
    studentName: 'Phan Nguyễn Nhật Quang',
    studentEmail: 'quangpnn.23it@vku.udn.vn',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    qrCodePayload: JSON.stringify({
      bookingId: 'bkg-demo-102',
      room: 'B.305',
      date: todayStr,
      slot: '07:30 - 09:30',
      student: 'Phan Nguyễn Nhật Quang',
    }),
  },
  {
    id: 'bkg-demo-103',
    roomId: 'room-v-402',
    roomName: 'VKU AI & GPU Cluster V.402',
    building: 'V',
    floor: 4,
    date: tomorrowStr,
    slotId: 'slot-3', // 13:00 - 15:00
    slotLabel: '13:00 - 15:00',
    studentId: '19IT015',
    studentName: 'Dang Thi Mai',
    studentEmail: 'maidt.19it@vku.udn.vn',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    qrCodePayload: JSON.stringify({
      bookingId: 'bkg-demo-103',
      room: 'V.402',
      date: tomorrowStr,
      slot: '13:00 - 15:00',
      student: 'Dang Thi Mai',
    }),
  },
];

interface BookingState {
  // User session
  currentUser: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  // Rooms
  rooms: Room[];

  // Bookings
  bookings: Booking[];
  createBooking: (params: {
    roomId: string;
    date: string;
    slotId: string;
  }) => Promise<{ success: boolean; booking?: Booking; error?: string }>;
  cancelBooking: (bookingId: string) => Promise<void>;
  checkInBooking: (bookingId: string) => void;
  isSlotBooked: (roomId: string, date: string, slotId: string) => boolean;

  // Filter State
  filters: FilterState;
  setSearchQuery: (query: string) => void;
  setBuildingFilter: (building: BuildingCode | 'ALL') => void;
  setMinCapacityFilter: (capacity: number) => void;
  toggleEquipmentFilter: (equipment: EquipmentType) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  building: 'ALL',
  minCapacity: 0,
  equipment: [],
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      currentUser: INITIAL_USER,
      updateProfile: (profile) =>
        set((state) => ({
          currentUser: { ...state.currentUser, ...profile },
        })),
      updateUserProfile: (profile) =>
        set((state) => ({
          currentUser: { ...state.currentUser, ...profile },
        })),

      rooms: MOCK_ROOMS,
      bookings: INITIAL_BOOKINGS,

      isSlotBooked: (roomId: string, date: string, slotId: string) => {
        const { bookings } = get();
        return bookings.some(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status !== 'cancelled'
        );
      },

      createBooking: async ({ roomId, date, slotId }) => {
        const state = get();
        const room = state.rooms.find((r) => r.id === roomId);
        const slot = TIME_SLOTS.find((s) => s.id === slotId);

        if (!room) {
          return { success: false, error: 'Study room not found.' };
        }
        if (!slot) {
          return { success: false, error: 'Selected time slot is invalid.' };
        }

        // Strict Conflict Prevention Engine check
        const hasConflict = state.isSlotBooked(roomId, date, slotId);
        if (hasConflict) {
          return {
            success: false,
            error: `This slot (${slot.label}) for ${room.name} has already been reserved. Please pick another slot.`,
          };
        }

        const newBookingId = `bkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const qrPayload = JSON.stringify({
          bookingId: newBookingId,
          roomId: room.id,
          roomName: room.name,
          building: room.building,
          date,
          slot: slot.label,
          studentId: state.currentUser.studentId,
          studentName: state.currentUser.name,
          timestamp: new Date().toISOString(),
        });

        const newBooking: Booking = {
          id: newBookingId,
          roomId: room.id,
          roomName: room.name,
          building: room.building,
          floor: room.floor,
          date,
          slotId: slot.id,
          slotLabel: slot.label,
          studentId: state.currentUser.studentId,
          studentName: state.currentUser.name,
          studentEmail: state.currentUser.email,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          qrCodePayload: qrPayload,
        };

        // Schedule local push notification 15 minutes before slot starts
        const notificationId = await scheduleBookingReminder(newBooking, slot.startTime);
        if (notificationId) {
          newBooking.notificationId = notificationId;
        }

        set((s) => ({
          bookings: [newBooking, ...s.bookings],
        }));

        return { success: true, booking: newBooking };
      },

      cancelBooking: async (bookingId: string) => {
        const { bookings } = get();
        const bookingToCancel = bookings.find((b) => b.id === bookingId);

        if (bookingToCancel?.notificationId) {
          await cancelBookingReminder(bookingToCancel.notificationId);
        }

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ),
        }));
      },

      checkInBooking: (bookingId: string) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'checked-in' } : b
          ),
        }));
      },

      // Filter management
      filters: DEFAULT_FILTERS,

      setSearchQuery: (query: string) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      setBuildingFilter: (building: BuildingCode | 'ALL') =>
        set((state) => ({
          filters: { ...state.filters, building },
        })),

      setMinCapacityFilter: (capacity: number) =>
        set((state) => ({
          filters: { ...state.filters, minCapacity: capacity },
        })),

      toggleEquipmentFilter: (item: EquipmentType) =>
        set((state) => {
          const current = state.filters.equipment;
          const exists = current.includes(item);
          const updated = exists
            ? current.filter((eq) => eq !== item)
            : [...current, item];
          return {
            filters: { ...state.filters, equipment: updated },
          };
        }),

      resetFilters: () =>
        set(() => ({
          filters: DEFAULT_FILTERS,
        })),
    }),
    {
      name: 'vku-booking-storage-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        bookings: state.bookings,
      }),
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          state.currentUser &&
          (state.currentUser.name === 'Tran Minh Quan' ||
            state.currentUser.name === 'Lê Bảo Long' ||
            state.currentUser.studentId === '21IT128')
        ) {
          state.currentUser = INITIAL_USER;
        }
      },
    }
  )
);
