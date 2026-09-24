import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '../types';
import { useBookingStore, getFormattedDate } from '../store/useBookingStore';
import { TIME_SLOTS } from '../data/timeSlots';

interface RoomCardProps {
  room: Room;
  onPress: (room: Room) => void;
}

// Building color badges for VKU
const BUILDING_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
  B: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  C: { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  V: { bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF' },
};

function getBuildingTheme(building: string) {
  return BUILDING_COLORS[building] || { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' };
}

/**
 * Calculates whether the room is currently occupied right now based on local time
 */
function useCurrentOccupancy(roomId: string): boolean {
  const isSlotBooked = useBookingStore((state) => state.isSlotBooked);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const today = getFormattedDate(0);

  // Find slot that covers current time
  const currentSlot = TIME_SLOTS.find((slot) => {
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    return currentMinutes >= startTotal && currentMinutes < endTotal;
  });

  if (!currentSlot) {
    return false; // Outside normal booking slot hours
  }

  return isSlotBooked(roomId, today, currentSlot.id);
}

export const RoomCard = React.memo<RoomCardProps>(({ room, onPress }) => {
  const isOccupied = useCurrentOccupancy(room.id);
  const theme = getBuildingTheme(room.building);

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.88}
      onPress={() => onPress(room)}
    >
      {/* Room Image with Badges */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: room.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Live Status Pill */}
        <View
          style={[
            styles.statusBadge,
            isOccupied ? styles.statusBadgeOccupied : styles.statusBadgeAvailable,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOccupied ? '#EF4444' : '#10B981' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOccupied ? '#991B1B' : '#065F46' },
            ]}
          >
            {isOccupied ? 'Occupied Now' : 'Available Now'}
          </Text>
        </View>

        {/* Lab Indicator Badge */}
        {room.isLab && (
          <View style={styles.labBadge}>
            <Ionicons name="hardware-chip-outline" size={12} color="#FFFFFF" />
            <Text style={styles.labBadgeText}>VKU Tech Lab</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Title and Building/Floor Tag */}
        <View style={styles.headerRow}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.name}
          </Text>
        </View>

        {/* Location & Capacity Badges */}
        <View style={styles.metaRow}>
          <View style={[styles.buildingBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Ionicons name="business" size={12} color={theme.text} />
            <Text style={[styles.buildingText, { color: theme.text }]}>
              Building {room.building} • Floor {room.floor}
            </Text>
          </View>

          <View style={styles.capacityBadge}>
            <Ionicons name="people" size={12} color="#475569" />
            <Text style={styles.capacityText}>Max {room.capacity} students</Text>
          </View>
        </View>

        {/* Lab Spec or Description */}
        <Text style={styles.description} numberOfLines={2}>
          {room.labSpec ? `⚡ ${room.labSpec}` : room.description}
        </Text>

        {/* Equipment Chips */}
        <View style={styles.equipmentRow}>
          {room.equipment.slice(0, 3).map((item) => (
            <View key={item} style={styles.equipmentChip}>
              <Text style={styles.equipmentText}>{item}</Text>
            </View>
          ))}
          {room.equipment.length > 3 && (
            <View style={[styles.equipmentChip, styles.equipmentMoreChip]}>
              <Text style={styles.equipmentMoreText}>
                +{room.equipment.length - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Footer Action */}
        <View style={styles.footerRow}>
          <View style={styles.hoursWrapper}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.hoursText}>{room.openingHours}</Text>
          </View>
          <View style={styles.bookButtonFake}>
            <Text style={styles.bookButtonText}>Book Slot</Text>
            <Ionicons name="chevron-forward" size={14} color="#0052CC" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageWrapper: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadgeAvailable: {
    backgroundColor: 'rgba(236, 253, 245, 0.94)',
  },
  statusBadgeOccupied: {
    backgroundColor: 'rgba(254, 242, 242, 0.94)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  labBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  labBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  buildingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  buildingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  capacityText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  equipmentChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  equipmentText: {
    fontSize: 11,
    color: '#334155',
  },
  equipmentMoreChip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  equipmentMoreText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  hoursWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    color: '#64748B',
  },
  bookButtonFake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0052CC',
  },
});
