import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useBookingStore } from '../store/useBookingStore';
import { RootStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<RootStackParamList, 'BookingPass'>;
type NavProps = NativeStackNavigationProp<RootStackParamList>;

export const BookingPassScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { bookingId } = route.params;

  const booking = useBookingStore((state) =>
    state.bookings.find((b) => b.id === bookingId)
  );
  const checkInBooking = useBookingStore((state) => state.checkInBooking);

  if (!booking) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Booking pass not found.</Text>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.homeBtnText}>Return Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCheckedIn = booking.status === 'checked-in';
  const isCancelled = booking.status === 'cancelled';

  const handleSimulateCheckIn = () => {
    if (isCheckedIn) {
      Alert.alert('Already Checked In', 'Your entry has already been validated.');
      return;
    }
    if (isCancelled) {
      Alert.alert('Booking Cancelled', 'This booking has been cancelled.');
      return;
    }

    checkInBooking(booking.id);
    Alert.alert(
      'Check-in Verified! 🎉',
      `Welcome to ${booking.roomName}! You may now enter the study room/lab.`
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `VKU Study Room Pass:\nRoom: ${booking.roomName} (Building ${booking.building})\nDate: ${booking.date}\nTime: ${booking.slotLabel}\nStudent: ${booking.studentName} (${booking.studentId})`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Access Pass</Text>
        <TouchableOpacity style={styles.shareIconBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#0052CC" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pass Card Container */}
        <View style={styles.passCard}>
          {/* Card Banner */}
          <View style={styles.cardTop}>
            <View style={styles.univRow}>
              <Ionicons name="school" size={16} color="#FFFFFF" />
              <Text style={styles.univText}>VIETNAM - KOREA UNIVERSITY</Text>
            </View>
            <Text style={styles.passType}>CAMPUS LAB & STUDY ACCESS</Text>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <View style={styles.roomHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomTitle}>{booking.roomName}</Text>
                <Text style={styles.locationSubtitle}>
                  Building {booking.building} • Floor {booking.floor}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isCheckedIn
                    ? styles.statusBadgeCheckedIn
                    : isCancelled
                    ? styles.statusBadgeCancelled
                    : styles.statusBadgeConfirmed,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isCheckedIn
                      ? styles.statusTextCheckedIn
                      : isCancelled
                      ? styles.statusTextCancelled
                      : styles.statusTextConfirmed,
                  ]}
                >
                  {isCheckedIn ? 'CHECKED IN' : isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                </Text>
              </View>
            </View>

            {/* Dotted Ticket Divider */}
            <View style={styles.dividerWrapper}>
              <View style={styles.notchLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.notchRight} />
            </View>

            {/* Info Grid */}
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>DATE</Text>
                <Text style={styles.gridValue}>{booking.date}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>TIME SLOT</Text>
                <Text style={styles.gridValue}>{booking.slotLabel}</Text>
              </View>
            </View>

            <View style={[styles.grid, { marginTop: 12 }]}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>STUDENT NAME</Text>
                <Text style={styles.gridValue}>{booking.studentName}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>STUDENT ID</Text>
                <Text style={styles.gridValue}>{booking.studentId}</Text>
              </View>
            </View>

            {/* QR Code */}
            <View style={styles.qrSection}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={booking.qrCodePayload}
                  size={175}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={styles.qrCaption}>
                Scan QR code at the entrance turnstile camera to unlock the room
              </Text>
              <Text style={styles.bookingIdCaption}>Ref: {booking.id}</Text>
            </View>

            {/* Push Reminder Banner */}
            <View style={styles.reminderBanner}>
              <Ionicons name="alarm-outline" size={18} color="#0052CC" />
              <Text style={styles.reminderText}>
                Local push alert set for 15 minutes before slot start.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              isCheckedIn && styles.primaryActionBtnDone,
              isCancelled && styles.primaryActionBtnDisabled,
            ]}
            onPress={handleSimulateCheckIn}
            disabled={isCancelled}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isCheckedIn ? 'checkmark-circle' : 'finger-print'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.primaryActionBtnText}>
              {isCheckedIn ? 'Access Granted (Checked In)' : 'Simulate Scanner Check-in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color="#0052CC" />
            <Text style={styles.secondaryActionBtnText}>Back to Rooms</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  homeBtn: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  shareIconBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  passCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  univRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  univText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  passType: {
    color: '#BFDBFE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 18,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeCheckedIn: {
    backgroundColor: '#EFF6FF',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  dividerWrapper: {
    position: 'relative',
    marginVertical: 18,
    justifyContent: 'center',
  },
  dashedLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  notchLeft: {
    position: 'absolute',
    left: -26,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  notchRight: {
    position: 'absolute',
    right: -26,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  qrSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrWrapper: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  qrCaption: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  bookingIdCaption: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  reminderText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
  actionGroup: {
    marginTop: 18,
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0052CC',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionBtnDone: {
    backgroundColor: '#059669',
  },
  primaryActionBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0052CC',
    gap: 6,
  },
  secondaryActionBtnText: {
    color: '#0052CC',
    fontSize: 14,
    fontWeight: '700',
  },
});
