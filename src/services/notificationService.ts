import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Booking } from '../types';

// Set up notification display behavior for native platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Web platform: Check standard browser Notification API
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          return true;
        }
        if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      }
    } catch (e) {
      console.warn('Web notification permission error:', e);
    }
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vku-booking-reminders', {
        name: 'VKU Booking Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0052CC',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.warn('Error setting up notification channel/permissions:', error);
    return false;
  }
}

/**
 * Calculates notification trigger date 15 minutes before the time slot begins.
 * Format: date = 'YYYY-MM-DD', slotStartTime = 'HH:mm'
 */
export function calculateReminderTriggerDate(dateStr: string, slotStartTime: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = slotStartTime.split(':').map(Number);

  // Month in JS Date is 0-indexed
  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // 15 minutes before
  const reminderDate = new Date(slotDate.getTime() - 15 * 60 * 1000);
  return reminderDate;
}

/**
 * Schedules a local push notification 15 minutes before the room slot start time.
 * If running on web, utilizes browser Notification API or standard alert() fallback.
 */
export async function scheduleBookingReminder(
  booking: Booking,
  slotStartTime: string
): Promise<string | undefined> {
  const triggerDate = calculateReminderTriggerDate(booking.date, slotStartTime);
  const now = new Date();
  const isPast = triggerDate.getTime() <= now.getTime();

  // Web Platform Handling
  if (Platform.OS === 'web') {
    try {
      await registerForPushNotificationsAsync();
      const delayMs = isPast ? 5000 : Math.max(1000, triggerDate.getTime() - now.getTime());
      
      const message = isPast
        ? `[VKU Demo Reminder] Your reservation for ${booking.roomName} starts soon (${booking.slotLabel}). Have your QR pass ready!`
        : `[VKU Study Room Alert] Your booking for ${booking.roomName} (${booking.slotLabel}) starts in 15 minutes! Please check in with your QR pass.`;

      const timerId = setTimeout(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('VKU Room Check-in Alert 🔔', {
            body: message,
            icon: '/favicon.png',
          });
        } else if (typeof window !== 'undefined') {
          alert(`🔔 ${message}`);
        }
      }, Math.min(delayMs, 2147483647));

      return `web-timer-${timerId}`;
    } catch (webErr) {
      console.warn('Web notification scheduling error:', webErr);
      return undefined;
    }
  }

  // Native Platform Handling (Android / iOS)
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) {
      console.log('Cannot schedule notification without permission');
    }

    let triggerInput: Notifications.NotificationTriggerInput;
    let isTestFallback = false;

    if (isPast) {
      triggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      };
      isTestFallback = true;
    } else {
      triggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'VKU Room Check-in Alert 🔔',
        body: isTestFallback
          ? `[Demo Alert] Your reservation for ${booking.roomName} starts soon (${booking.slotLabel}). Have your QR pass ready!`
          : `Your booking for ${booking.roomName} (${booking.slotLabel}) starts in 15 minutes! Open your pass to check in.`,
        data: {
          bookingId: booking.id,
          roomId: booking.roomId,
          slotLabel: booking.slotLabel,
        },
        sound: true,
      },
      trigger: triggerInput,
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule local notification:', error);
    return undefined;
  }
}

/**
 * Cancels a scheduled local notification when a booking is cancelled
 */
export async function cancelBookingReminder(notificationId?: string): Promise<void> {
  if (!notificationId) return;

  if (Platform.OS === 'web' || notificationId.startsWith('web-timer-')) {
    if (notificationId.startsWith('web-timer-')) {
      const timerId = parseInt(notificationId.replace('web-timer-', ''), 10);
      clearTimeout(timerId);
    }
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel scheduled notification:', error);
  }
}
