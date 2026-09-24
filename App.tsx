import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize notification permissions
    registerForPushNotificationsAsync();

    if (Platform.OS === 'web') {
      return;
    }

    // Listen for incoming notifications on native platforms
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Received notification foreground:', notification);
      }
    );

    // Listen for user clicking on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped by user:', response);
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
