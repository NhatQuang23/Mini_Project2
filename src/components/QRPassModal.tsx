import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Booking } from '../types';
import { useBookingStore } from '../store/useBookingStore';

interface QRPassModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  visible,
  booking,
  onClose,
}) => {
  const checkInBooking = useBookingStore((state) => state.checkInBooking);

  if (!booking) return null;

  const isCheckedIn = booking.status === 'checked-in';
  const isCancelled = booking.status === 'cancelled';

  const handleSimulateCheckIn = () => {
    if (isCheckedIn) {
      Alert.alert('Already Checked In', 'Your entry has already been validated for this study slot.');
      return;
    }
    if (isCancelled) {
      Alert.alert('Booking Cancelled', 'This booking has been cancelled and cannot be checked in.');
      return;
    }

    checkInBooking(booking.id);
    Alert.alert(
      'Check-in Successful! 🎉',
      `Welcome to ${booking.roomName}. Room access is granted for ${booking.slotLabel}.`
    );
  };

  const handleSharePass = async () => {
    try {
      await Share.share({
        message: `VKU Study Room Pass: ${booking.roomName} (Building ${booking.building}, Floor ${booking.floor})\nDate: ${booking.date}\nTime: ${booking.slotLabel}\nBooked by: ${booking.studentName} (${booking.studentId})`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.subHeaderTitle}>VKU SMART CAMPUS</Text>
              <Text style={styles.headerTitle}>Digital Access Pass</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Pass Ticket Card */}
            <View style={styles.passCard}>
              {/* Ticket Top: Room details */}
              <View style={styles.cardHeader}>
                <View style={styles.universityBadge}>
                  <Ionicons name="school" size={14} color="#0052CC" />
                  <Text style={styles.universityName}>VIETNAM - KOREA UNIVERSITY</Text>
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

              <Text style={styles.roomTitle}>{booking.roomName}</Text>
              <Text style={styles.locationDetail}>
                Building {booking.building} • Floor {booking.floor} • Room ID: {booking.roomId}
              </Text>

              {/* Dotted separator */}
              <View style={styles.dividerWrapper}>
                <View style={styles.notchLeft} />
                <View style={styles.dashedLine} />
                <View style={styles.notchRight} />
              </View>

              {/* Date & Time Slot Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>DATE</Text>
                  <Text style={styles.detailValue}>{booking.date}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>TIME SLOT</Text>
                  <Text style={styles.detailValue}>{booking.slotLabel}</Text>
                </View>
              </View>

              <View style={[styles.detailsGrid, { marginTop: 10 }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>STUDENT</Text>
                  <Text style={styles.detailValue}>{booking.studentName}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>STUDENT ID</Text>
                  <Text style={styles.detailValue}>{booking.studentId}</Text>
                </View>
              </View>

              {/* QR Code Container */}
              <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={booking.qrCodePayload}
                    size={160}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrInstructions}>
                  Scan at the room door turnstile scanner upon arrival
                </Text>
                <Text style={styles.passIdText}>Pass ID: {booking.id}</Text>
              </View>

              {/* Reminder Banner */}
              <View style={styles.reminderBanner}>
                <Ionicons name="notifications-outline" size={16} color="#0052CC" />
                <Text style={styles.reminderBannerText}>
                  Push reminder will notify you 15 minutes before slot start
                </Text>
              </View>
            </View>

            {/* Actions: Simulate Scan Check-in and Share */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.checkInBtn,
                  isCheckedIn && styles.checkInBtnDone,
                  isCancelled && styles.checkInBtnDisabled,
                ]}
                onPress={handleSimulateCheckIn}
                disabled={isCancelled}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isCheckedIn ? 'checkmark-circle' : 'qr-code'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.checkInBtnText}>
                  {isCheckedIn ? 'Checked In (Door Unlocked)' : 'Simulate QR Door Check-in'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleSharePass}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={18} color="#0052CC" />
                <Text style={styles.shareBtnText}>Share Pass with Group</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : undefined,
    padding: Platform.OS === 'web' ? 16 : 0,
  },
  sheetContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
    maxWidth: 520,
    width: '100%',
    maxHeight: '90%',
    paddingBottom: 24,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0052CC',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
  },
  scrollContent: {
    padding: 16,
  },
  passCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  universityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  universityName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0052CC',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  roomTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  locationDetail: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  dividerWrapper: {
    position: 'relative',
    marginVertical: 16,
    justifyContent: 'center',
  },
  dashedLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
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
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  qrInstructions: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
  },
  passIdText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  reminderBannerText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 16,
    gap: 10,
  },
  checkInBtn: {
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
  checkInBtnDone: {
    backgroundColor: '#059669',
  },
  checkInBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#0052CC',
  },
  shareBtnText: {
    color: '#0052CC',
    fontSize: 14,
    fontWeight: '700',
  },
});
