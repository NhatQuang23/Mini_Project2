import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useBookingStore, getFormattedDate } from '../store/useBookingStore';
import { DateSlotSelector } from '../components/DateSlotSelector';
import { TimeSlot } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<RootStackParamList, 'RoomDetail'>;
type NavProps = NativeStackNavigationProp<RootStackParamList>;

export const RoomDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { roomId } = route.params;

  const room = useBookingStore((state) =>
    state.rooms.find((r) => r.id === roomId)
  );
  const createBooking = useBookingStore((state) => state.createBooking);

  const [selectedDate, setSelectedDate] = useState<string>(getFormattedDate(0));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!room) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Room not found</Text>
        <TouchableOpacity
          style={styles.backButtonSimple}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonSimpleText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleConfirmReservation = async () => {
    if (!selectedSlot) {
      Alert.alert(
        'Select a Time Slot',
        'Please select an available 2-hour time slot before confirming.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createBooking({
        roomId: room.id,
        date: selectedDate,
        slotId: selectedSlot.id,
      });

      if (!res.success) {
        Alert.alert('Slot Unavailable', res.error || 'Conflict detected.');
        setIsSubmitting(false);
        return;
      }

      if (res.booking) {
        // Successful reservation!
        Alert.alert(
          'Reservation Confirmed! 🎓',
          `Your booking for ${room.name} on ${selectedDate} (${selectedSlot.label}) is confirmed. A reminder is scheduled 15 minutes before the start time.`,
          [
            {
              text: 'View Digital Pass',
              onPress: () => {
                navigation.replace('BookingPass', { bookingId: res.booking!.id });
              },
            },
            {
              text: 'Back to Discovery',
              onPress: () => {
                navigation.navigate('MainTabs');
              },
              style: 'cancel',
            },
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to complete reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image with Floating Back Button */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: room.imageUrl }} style={styles.heroImage} />
          <View style={styles.imageOverlay} />
          <TouchableOpacity
            style={styles.floatingBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Building Tag on Image */}
          <View style={styles.floatingTag}>
            <Text style={styles.floatingTagText}>
              Building {room.building} • Floor {room.floor}
            </Text>
          </View>
        </View>

        {/* Room Header Info */}
        <View style={styles.detailsHeader}>
          <Text style={styles.title}>{room.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="people-outline" size={14} color="#0052CC" />
              <Text style={styles.metaChipText}>Capacity: {room.capacity} students</Text>
            </View>

            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color="#0052CC" />
              <Text style={styles.metaChipText}>{room.openingHours}</Text>
            </View>
          </View>

          {room.isLab && (
            <View style={styles.labSpecBox}>
              <View style={styles.labSpecHeader}>
                <Ionicons name="hardware-chip" size={16} color="#059669" />
                <Text style={styles.labSpecTitle}>Laboratory Hardware Specifications</Text>
              </View>
              <Text style={styles.labSpecContent}>{room.labSpec}</Text>
            </View>
          )}

          <Text style={styles.sectionHeading}>About this space</Text>
          <Text style={styles.description}>{room.description}</Text>

          <Text style={styles.sectionHeading}>Available Equipment</Text>
          <View style={styles.equipmentGrid}>
            {room.equipment.map((item) => (
              <View key={item} style={styles.equipmentItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.equipmentLabel}>{item}</Text>
              </View>
            ))}
          </View>

          {/* 7-Day Rolling Selector & Conflict Engine */}
          <DateSlotSelector
            roomId={room.id}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedSlot(null); // Reset selection when date changes
            }}
            selectedSlotId={selectedSlot ? selectedSlot.id : null}
            onSelectSlot={handleSelectSlot}
          />

          {/* Policies & Reminders Notice */}
          <View style={styles.policyNotice}>
            <Ionicons name="information-circle-outline" size={18} color="#0052CC" />
            <Text style={styles.policyNoticeText}>
              VKU Campus Policy: Check in at the room turnstile within 15 minutes of slot start to keep reservation active.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.slotSummary}>
          <Text style={styles.summaryLabel}>Selected Slot</Text>
          <Text style={styles.summaryValue}>
            {selectedSlot ? `${selectedDate} • ${selectedSlot.label}` : 'None chosen yet'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedSlot || isSubmitting) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmReservation}
          disabled={!selectedSlot || isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>
            {isSubmitting ? 'Reserving...' : 'Confirm Booking'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 12,
  },
  backButtonSimple: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonSimpleText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTag: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 82, 204, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  floatingTagText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsHeader: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  metaChipText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  labSpecBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  labSpecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  labSpecTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  labSpecContent: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  equipmentLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  policyNoticeText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  slotSummary: {
    flex: 1,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0052CC',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
