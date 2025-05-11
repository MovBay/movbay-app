import { Stack } from 'expo-router'
import React from 'react'

const StackPagesLayout = () => {
  return (
    <Stack
        screenOptions={{
        headerShown: false,
        }}
    >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(stacks)" />
    </Stack>
  )
}

export default StackPagesLayout