import { TimeSlot } from '../types';

export const TIME_SLOTS: TimeSlot[] = [
  {
    id: 'slot-1',
    label: '07:30 - 09:30',
    startTime: '07:30',
    endTime: '09:30',
    period: 'morning',
  },
  {
    id: 'slot-2',
    label: '09:30 - 11:30',
    startTime: '09:30',
    endTime: '11:30',
    period: 'morning',
  },
  {
    id: 'slot-3',
    label: '13:00 - 15:00',
    startTime: '13:00',
    endTime: '15:00',
    period: 'afternoon',
  },
  {
    id: 'slot-4',
    label: '15:00 - 17:00',
    startTime: '15:00',
    endTime: '17:00',
    period: 'afternoon',
  },
  {
    id: 'slot-5',
    label: '17:30 - 19:30',
    startTime: '17:30',
    endTime: '19:30',
    period: 'afternoon',
  },
];
