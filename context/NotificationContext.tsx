import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "@/util/registerForPushNotificationAsync";
import { post_requests } from "@/hooks/helpers/axios_helpers";
import { Toast } from "react-native-toast-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

// Configure notification behavior globally - CRITICAL for Android alerts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  tokenSent: boolean;
  shouldRefresh: boolean;
  clearRefreshFlag: () => void;
  // Callback handlers
  onNewRideNotification?: () => void;
  setOnNewRideNotification: (callback: () => void) => void;
  setOnAcceptedRideNotification: (callback: () => void) => void;
  setOnPaymentReceivedNotification: (callback: () => void) => void;
  setOnRideCancelledNotification: (callback: () => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Helper function to send token to backend
const sendTokenToBackend = async (token: string) => {
  try {
    const authToken = (await AsyncStorage.getItem("movebay_token")) || "";
    const response = await post_requests(
      `/notification/fcm-token/`,
      {
        token: token,
      },
      authToken
    );
    console.log('✅ Push token sent successfully:', response.data);
    
    await AsyncStorage.setItem("last_sent_push_token", token);
    await AsyncStorage.setItem("token_sent_timestamp", Date.now().toString());
    
    return true;
  } catch (error: any) {
    if (error.response) {
      console.log('Response data:', error.response.data);
      Toast.show(error.response.data.token, {
        type: 'error'
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    return false;
  }
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [tokenSent, setTokenSent] = useState<boolean>(false);
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);
  const [onNewRideNotification, setOnNewRideNotificationState] = useState<(() => void) | undefined>(undefined);
  const [onAcceptedRideNotification, setOnAcceptedRideNotificationState] = useState<(() => void) | undefined>(undefined);
  const [onPaymentReceivedNotification, setOnPaymentReceivedNotificationState] = useState<(() => void) | undefined>(undefined);
  const [onRideCancelledNotification, setOnRideCancelledNotificationState] = useState<(() => void) | undefined>(undefined);

  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const initializationRef = useRef<boolean>(false);

  const clearRefreshFlag = () => {
    setShouldRefresh(false);
  };

  const setOnNewRideNotification = (callback: () => void) => {
    setOnNewRideNotificationState(() => callback);
  };

  const setOnAcceptedRideNotification = (callback: () => void) => {
    setOnAcceptedRideNotificationState(() => callback);
  };

  const setOnPaymentReceivedNotification = (callback: () => void) => {
    setOnPaymentReceivedNotificationState(() => callback);
  };

  const setOnRideCancelledNotification = (callback: () => void) => {
    setOnRideCancelledNotificationState(() => callback);
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      if (initializationRef.current) {
        return;
      }
      initializationRef.current = true;

      try {
        console.log('🚀 Initializing notifications on app open...');
        
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);

        if (token) {
          console.log('📤 Sending token to backend on app open...');
          const success = await sendTokenToBackend(token);
          setTokenSent(success);
          
          if (success) {
            console.log('✅ Token successfully sent to backend');
          } else {
            console.log('❌ Failed to send token to backend');
          }
        }
      } catch (error: any) {
        console.error('❌ Error initializing notifications:', error);
        setError(error as Error);
      }
    };

    initializeNotifications();

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setNotification(notification);
        setShouldRefresh(true);
        
        const notificationTitle = notification.request.content.title;
        const cleanTitle = typeof notificationTitle === 'string' 
          ? notificationTitle.trim() 
          : String(notificationTitle || '').replace(/^"|"$/g, '').trim();
        
        console.log("🔔 Received notification title:", `"${cleanTitle}"`);
        
        // Handle different notification types
        if (cleanTitle === "New Ride Alert on movbay" && onNewRideNotification) {
          console.log("🔄 Triggering ride refresh for new ride...");
          onNewRideNotification();
        }

        if (cleanTitle === "Ride Accepted" && onAcceptedRideNotification) {
          console.log("🔄 Triggering ride refresh for accepted ride...");
          onAcceptedRideNotification();
        }

        if (cleanTitle === "Sender's has made payment" && onPaymentReceivedNotification) {
          console.log("💰 Triggering refresh for payment received...");
          onPaymentReceivedNotification();
        }

        if (cleanTitle === "Ride has been canceled by sender" && onRideCancelledNotification) {
          console.log("❌ Triggering refresh for ride cancellation...");
          onRideCancelledNotification();
        }
        
        if (Platform.OS === 'android') {
          console.log("📱 Android notification received - should show alert");
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const notificationTitle = response.notification.request.content.title;
        
        console.log("🔔 Notification Response - Raw title:", notificationTitle);
        console.log("🔔 Notification Response - Title type:", typeof(notificationTitle));
        
        const cleanTitle = typeof notificationTitle === 'string' 
          ? notificationTitle.trim() 
          : String(notificationTitle || '').replace(/^"|"$/g, '').trim();
        
        console.log("🔔 Cleaned notification title:", `"${cleanTitle}"`);
        
        // Handle notification tap actions
        if (cleanTitle === "Your Order has been Confirmed") {
          console.log("🚀 Navigating to order history buyer...");
          router.push('/(access)/(user_stacks)/order_history_buyer');
        } 
        else if (cleanTitle === "New Message") {
          console.log("🚀 Navigating to messages...");
          router.push('/(access)/(user_tabs)/message'); 
        } 
        else if (cleanTitle === "New Order Available") {
          console.log("🚀 Navigating to orders...");
          router.push('/(access)/(user_tabs)/(drawer)/orders');
          
          if (onNewRideNotification) {
            console.log("🔄 Triggering ride refresh from notification response...");
            onNewRideNotification();
          }
        }
        else if (cleanTitle === "Sender's has made payment") {
          console.log("💰 Payment received - refreshing ride data...");
          if (onPaymentReceivedNotification) {
            onPaymentReceivedNotification();
          }
        }
        else if (cleanTitle === "Ride has been canceled by sender") {
          console.log("❌ Ride cancelled - refreshing data...");
          if (onRideCancelledNotification) {
            onRideCancelledNotification();
          }
        }
        else {
          console.log("🤷‍♂️ No matching title found for:", `"${cleanTitle}"`);
        }
        
        setShouldRefresh(true);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [
    onNewRideNotification, 
    onAcceptedRideNotification,
    onPaymentReceivedNotification,
    onRideCancelledNotification
  ]);

  return (
    <NotificationContext.Provider
      value={{ 
        expoPushToken, 
        notification, 
        error, 
        tokenSent, 
        shouldRefresh,
        clearRefreshFlag,
        onNewRideNotification,
        setOnNewRideNotification,
        setOnAcceptedRideNotification,
        setOnPaymentReceivedNotification,
        setOnRideCancelledNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};