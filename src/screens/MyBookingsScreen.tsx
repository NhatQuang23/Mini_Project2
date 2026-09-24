import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBookingStore } from '../store/useBookingStore';
import { Booking } from '../types';
import { QRPassModal } from '../components/QRPassModal';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type TabFilter = 'active' | 'checked-in' | 'cancelled';

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const bookings = useBookingStore((state) => state.bookings);
  const cancelBooking = useBookingStore((state) => state.cancelBooking);
  const currentUser = useBookingStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [selectedPassBooking, setSelectedPassBooking] = useState<Booking | null>(null);

  // Filter bookings for the student
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'active') return b.status === 'confirmed';
    if (activeTab === 'checked-in') return b.status === 'checked-in';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const handleCancelPress = async (booking: Booking) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm(
          `Cancel Reservation?\n\nAre you sure you want to cancel your reservation for ${booking.roomName} on ${booking.date} (${booking.slotLabel})?\n\nThis will free up the slot for other VKU students.`
        );
        if (confirmed) {
          await cancelBooking(booking.id);
          window.alert('Reservation Cancelled: Your reservation and reminder have been removed.');
        }
      }
      return;
    }

    Alert.alert(
      'Cancel Reservation?',
      `Are you sure you want to cancel your reservation for ${booking.roomName} on ${booking.date} (${booking.slotLabel})?\n\nThis will free up the slot for other VKU students.`,
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelBooking(booking.id);
            Alert.alert('Reservation Cancelled', 'Your reservation and reminder have been removed.');
          },
        },
      ]
    );
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isConfirmed = item.status === 'confirmed';
    const isCheckedIn = item.status === 'checked-in';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.buildingBadge}>
            <Ionicons name="business" size={13} color="#0052CC" />
            <Text style={styles.buildingBadgeText}>
              Building {item.building} • Floor {item.floor}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              isConfirmed
                ? styles.statusPillConfirmed
                : isCheckedIn
                ? styles.statusPillCheckedIn
                : styles.statusPillCancelled,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isConfirmed
                  ? styles.statusTextConfirmed
                  : isCheckedIn
                  ? styles.statusTextCheckedIn
                  : styles.statusTextCancelled,
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.roomTitle}>{item.roomName}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.slotLabel}</Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setSelectedPassBooking(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code" size={16} color="#FFFFFF" />
            <Text style={styles.qrButtonText}>View QR Pass</Text>
          </TouchableOpacity>

          {isConfirmed && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelPress(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>VKU STUDENT RESERVATIONS</Text>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.studentMeta}>
          Logged in as: {currentUser.name} ({currentUser.studentId})
        </Text>
      </View>

      {/* Tab Filter */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'active' && styles.tabItemActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({bookings.filter((b) => b.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'checked-in' && styles.tabItemActive]}
          onPress={() => setActiveTab('checked-in')}
        >
          <Text style={[styles.tabText, activeTab === 'checked-in' && styles.tabTextActive]}>
            Checked-in ({bookings.filter((b) => b.status === 'checked-in').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'cancelled' && styles.tabItemActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? "You don't have any upcoming reservations at this moment."
                : `No bookings found in ${activeTab} status.`}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('MainTabs')}
              >
                <Text style={styles.browseButtonText}>Browse VKU Rooms</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Interactive QR Pass Modal */}
      <QRPassModal
        visible={!!selectedPassBooking}
        booking={selectedPassBooking}
        onClose={() => setSelectedPassBooking(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0052CC',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabItemActive: {
    backgroundColor: '#0052CC',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buildingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  buildingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0052CC',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusPillCheckedIn: {
    backgroundColor: '#EFF6FF',
  },
  statusPillCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextConfirmed: {
    color: '#059669',
  },
  statusTextCheckedIn: {
    color: '#0284C7',
  },
  statusTextCancelled: {
    color: '#DC2626',
  },
  roomTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0052CC',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  qrButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
