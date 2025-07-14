import { Stack } from 'expo-router'
import React from 'react'

const StackPagesLayout = () => {
  return (
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
  )
}

export default StackPagesLayout