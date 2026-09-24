import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TIME_SLOTS } from '../data/timeSlots';
import { useBookingStore, getFormattedDate } from '../store/useBookingStore';
import { TimeSlot } from '../types';

interface DateSlotSelectorProps {
  roomId: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  selectedSlotId: string | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export interface DayItem {
  dateStr: string;
  dayName: string;
  dayNum: string;
  monthName: string;
  isToday: boolean;
}

// Generate next 7 days rolling selector
export function getRolling7Days(): DayItem[] {
  const days: DayItem[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = getFormattedDate(i);
    days.push({
      dateStr,
      dayName: i === 0 ? 'Today' : dayNames[d.getDay()],
      dayNum: String(d.getDate()),
      monthName: monthNames[d.getMonth()],
      isToday: i === 0,
    });
  }
  return days;
}

export const DateSlotSelector: React.FC<DateSlotSelectorProps> = ({
  roomId,
  selectedDate,
  onSelectDate,
  selectedSlotId,
  onSelectSlot,
}) => {
  const isSlotBooked = useBookingStore((state) => state.isSlotBooked);
  const days = React.useMemo(() => getRolling7Days(), []);

  return (
    <View style={styles.container}>
      {/* 7-Day Rolling Selector Header */}
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar-outline" size={18} color="#0052CC" />
        <Text style={styles.sectionTitle}>Select Date (7-Day Rolling)</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScroll}
      >
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <TouchableOpacity
              key={item.dateStr}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardSelected,
                item.isToday && !isSelected && styles.dateCardToday,
              ]}
              onPress={() => onSelectDate(item.dateStr)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected,
                  item.isToday && !isSelected && styles.dayNameToday,
                ]}
              >
                {item.dayName}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                {item.dayNum}
              </Text>
              <Text style={[styles.monthName, isSelected && styles.monthNameSelected]}>
                {item.monthName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Discrete 2-Hour Time Slots Header */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Ionicons name="time-outline" size={18} color="#0052CC" />
        <Text style={styles.sectionTitle}>Select 2-Hour Time Slot</Text>
        <Text style={styles.sectionSubtitle}>VKU Standard Periods</Text>
      </View>

      {/* Conflict Engine Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendAvailable]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBooked]} />
          <Text style={styles.legendText}>Booked (Locked)</Text>
        </View>
      </View>

      {/* Time Slots Grid with Real-time Conflict Engine */}
      <View style={styles.slotGrid}>
        {TIME_SLOTS.map((slot) => {
          const booked = isSlotBooked(roomId, selectedDate, slot.id);
          const isSelected = selectedSlotId === slot.id && !booked;

          return (
            <TouchableOpacity
              key={slot.id}
              disabled={booked}
              style={[
                styles.slotCard,
                isSelected && styles.slotCardSelected,
                booked && styles.slotCardBooked,
              ]}
              onPress={() => onSelectSlot(slot)}
              activeOpacity={0.8}
            >
              <View style={styles.slotContent}>
                <View style={styles.slotTimeRow}>
                  <Ionicons
                    name={
                      booked
                        ? 'lock-closed'
                        : isSelected
                        ? 'checkmark-circle'
                        : 'radio-button-off'
                    }
                    size={16}
                    color={
                      booked ? '#94A3B8' : isSelected ? '#FFFFFF' : '#0052CC'
                    }
                  />
                  <Text
                    style={[
                      styles.slotLabel,
                      isSelected && styles.slotLabelSelected,
                      booked && styles.slotLabelBooked,
                    ]}
                  >
                    {slot.label}
                  </Text>
                </View>

                {/* Status indicator on the right of the slot */}
                <View
                  style={[
                    styles.slotBadge,
                    booked
                      ? styles.slotBadgeBooked
                      : isSelected
                      ? styles.slotBadgeSelected
                      : styles.slotBadgeAvailable,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotBadgeText,
                      booked
                        ? styles.slotBadgeTextBooked
                        : isSelected
                        ? styles.slotBadgeTextSelected
                        : styles.slotBadgeTextAvailable,
                    ]}
                  >
                    {booked ? 'Booked' : isSelected ? 'Selected' : 'Open'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 'auto',
  },
  dateScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  dateCard: {
    width: 64,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dateCardToday: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  dateCardSelected: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dayNameToday: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  dayNameSelected: {
    color: '#DBEAFE',
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayNumSelected: {
    color: '#FFFFFF',
  },
  monthName: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  monthNameSelected: {
    color: '#BFDBFE',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendAvailable: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  legendSelected: {
    backgroundColor: '#0052CC',
  },
  legendBooked: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
  },
  slotGrid: {
    gap: 8,
  },
  slotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  slotCardSelected: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  slotCardBooked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.65,
  },
  slotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  slotLabelSelected: {
    color: '#FFFFFF',
  },
  slotLabelBooked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  slotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotBadgeAvailable: {
    backgroundColor: '#EFF6FF',
  },
  slotBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  slotBadgeBooked: {
    backgroundColor: '#E2E8F0',
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotBadgeTextAvailable: {
    color: '#0052CC',
  },
  slotBadgeTextSelected: {
    color: '#FFFFFF',
  },
  slotBadgeTextBooked: {
    color: '#64748B',
  },
});
