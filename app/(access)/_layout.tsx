import { NotificationProvider } from '@/context/NotificationContext'
import { Stack } from 'expo-router'
import React, { useEffect } from 'react'

import "react-native-reanimated";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


const StackPagesLayout = () => {
  return (
    <NotificationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(user_tabs)" />
        <Stack.Screen name="(rider_tabs)" />
        <Stack.Screen name="(rider_stacks)" />
        <Stack.Screen name="(user_stacks)" />
      </Stack>
    </NotificationProvider>
  )
}

export default StackPagesLayout