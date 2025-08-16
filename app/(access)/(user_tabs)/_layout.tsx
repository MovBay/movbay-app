import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => null,
        tabBarStyle: {
          paddingTop: 0,
          height: 60,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
        },
        tabBarIconStyle: {
          width: 48,
          height: 48,
        },
        tabBarItemStyle: {
          marginHorizontal: 15,
        },
        tabBarLabelStyle: {
          display: 'none'
        }
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
           tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialIcons name='home-filled' size={22} color={ focused ? "#F75F15": "#5F5F5F"} />
              <Text className={`text-xs ${focused ? "text-[#F75F15]": "text-[#5F5F5F]"}` } style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Home</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(drawer)"
        options={{
          title: 'Sell',
           tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name='storefront' size={22} color={ focused ? "#F75F15": "#5F5F5F"} />
              <Text className={`text-xs ${focused ? "text-[#F75F15]": "text-[#5F5F5F]"}` } style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Sell</Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="message"
        options={{
          title: 'Message',
           tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name='chatbubble-ellipses' size={22} color={ focused ? "#F75F15": "#5F5F5F"} />
              <Text className={`text-xs ${focused ? "text-[#F75F15]": "text-[#5F5F5F]"}` } style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Chats</Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
           tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name='wallet' size={22} color={ focused ? "#F75F15": "#5F5F5F"} />
              <Text className={`text-xs ${focused ? "text-[#F75F15]": "text-[#5F5F5F]"}` } style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Wallet</Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
           tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialIcons name='dashboard-customize' size={22} color={ focused ? "#F75F15": "#5F5F5F"} />
              <Text className={`text-xs ${focused ? "text-[#F75F15]": "text-[#5F5F5F]"}` } style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>More</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
