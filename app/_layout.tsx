import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css"
import { KeyboardProvider } from "react-native-keyboard-controller";


import { useColorScheme } from '@/hooks/useColorScheme';
import {
  HankenGrotesk_100Thin,
  HankenGrotesk_300Light,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_900Black
} from "@expo-google-fonts/hanken-grotesk"
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ToastProvider } from 'react-native-toast-notifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
  });

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    HankenGrotesk_100Thin,
    HankenGrotesk_300Light,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_900Black
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider
        placement="top"
        offset={50}
        textStyle={{
          fontFamily: "HankenGrotesk_500Medium",
          width: "90%",
        }}

          dangerIcon={
            <MaterialIcons
              name="dangerous"
              size={20}
              color={"#fff"}
              
            />
          }
          successIcon={
            <MaterialIcons name="check" size={20} color="#fff" />
          }
          warningIcon={
            <MaterialIcons name="warning" size={20} color="#fff" />
          }
        >
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <GestureHandlerRootView>
                <Stack>
                  <Stack.Screen name="(noaccess)" options={{ headerShown: false }} />
                  <Stack.Screen name="(access)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </GestureHandlerRootView>
            </KeyboardProvider>

          </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
