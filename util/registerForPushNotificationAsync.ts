import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    // Create notification channel with HIGH priority for alerts
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX, // This is crucial for heads-up notifications
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      showBadge: true,
      sound: "default", // Enable sound with default notification sound
      enableVibrate: true, // Enable vibration
      enableLights: true, // Enable LED lights
    });

    // Create a high priority channel specifically for ride notifications
    await Notifications.setNotificationChannelAsync("ride_notifications", {
      name: "Ride Notifications",
      description: "Important notifications about new ride requests",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500], // More noticeable vibration
      lightColor: "#00FF00",
      showBadge: true,
      sound: "default",
      enableVibrate: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true, // This is crucial for iOS sound
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
          provideAppNotificationSettings: true,
          allowProvisional: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: false,
          provideAppNotificationSettings: false,
          allowProvisional: false,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") {
      throw new Error(
        "Permission not granted to get push token for push notification!"
      );
    }
    
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error("Project ID not found");
    }
    
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("📱 Push Token:", pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      throw new Error(`Failed to get push token: ${e}`);
    }
  } else {
    throw new Error("Must use physical device for push notifications");
  }
}