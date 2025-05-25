import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const StackPagesLayout = () => {
  return (
    <>
      <StatusBar style='dark'/>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
      </Stack>
    </>
  );
};

export default StackPagesLayout;
