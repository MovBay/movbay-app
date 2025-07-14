// hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface OrderData {
  id: string;
  total_amount: number;
}

interface UseNotificationsProps {
  onTokenReceived?: (token: string) => void;
  enableAutoNavigation?: boolean;
}

// Enhanced error handling function
function handleRegistrationError(errorMessage: string) {
  console.error('Push notification registration error:', errorMessage);
}

// Simplified registration function using Expo's service
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F75F15',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                      Constants?.easConfig?.projectId;

    if (!projectId) {
      handleRegistrationError('Project ID not found in app configuration');
      return;
    }

    try {
      // Use Expo's push token service instead of Firebase
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      
      console.log('Expo Push Token:', pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Failed to get push token:', errorMessage);
      
      // For development, continue without push token
      if (__DEV__) {
        console.log('Development mode: continuing without push token');
        return 'dev-token';
      }
      
      handleRegistrationError(`Failed to get push token: ${errorMessage}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

// Function to send push notification via Expo's service
async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export const useNotifications = ({ 
  onTokenReceived, 
  enableAutoNavigation = true 
}: UseNotificationsProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        
        if (token) {
          setPushToken(token);
          setIsListening(true);
          
          if (onTokenReceived) {
            onTokenReceived(token);
          }
        }

        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
          setNotification(notification);
          setIsListening(true);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response:', response);
          
          if (enableAutoNavigation) {
            const { data } = response.notification.request.content;
            
            if (data?.type === 'order' || data?.screen === 'orders') {
              router.push('/(access)/(user_tabs)/(drawer)/orders');
            }
          }
        });

        setIsInitialized(true);

      } catch (error) {
        console.error('Error setting up notifications:', error);
        // Still allow local notifications even if push token registration fails
        setIsListening(true);
        setIsInitialized(true);
      }
    };

    setupNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [onTokenReceived, enableAutoNavigation]);

  const sendLocalNotification = async (orderData: OrderData) => {
    if (!isListening) {
      console.log('Notification listener not active, skipping notification');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Order Placed Successfully! 🎉",
          body: `Your order of ₦${orderData.total_amount.toLocaleString()} has been placed successfully. We'll notify you when it's ready for delivery.`,
          data: {
            orderId: orderData.id,
            type: 'order',
            screen: 'orders',
          },
        },
        trigger: null,
      });
      
      console.log('Local notification sent for order:', orderData.id);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const sendTestPushNotification = async (title: string, body: string, data?: any) => {
    if (!pushToken) {
      console.log('No push token available');
      return;
    }

    try {
      return await sendPushNotification(pushToken, title, body, data);
    } catch (error) {
      console.error('Error sending test push notification:', error);
      throw error;
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications canceled');
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  const getPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting permission status:', error);
      return 'undetermined';
    }
  };

  return {
    sendLocalNotification,
    sendTestPushNotification,
    cancelAllNotifications,
    getPermissionStatus,
    isListening,
    pushToken,
    notification,
    isInitialized,
  };
};