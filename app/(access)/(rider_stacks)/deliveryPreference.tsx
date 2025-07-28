import { View, Text, TouchableOpacity, Switch } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';
import { Ionicons } from '@expo/vector-icons';
import { SolidMainButton } from '@/components/btns/CustomButtoms';

const DeliveryPreference = () => {
  const [autoAcceptNearby, setAutoAcceptNearby] = useState(false);
  const [nightModeAvailability, setNightModeAvailability] = useState(false);
  const [deliveryNotifications, setDeliveryNotifications] = useState(false);

  const handleSave = () => {
    // Handle save logic here
    console.log('Preferences saved:', {
      autoAcceptNearby,
      nightModeAvailability,
      deliveryNotifications
    });
    router.back();
  };

  const PreferenceItem = ({ icon, title, value, onValueChange }:any) => (
    <View className='flex-row items-center justify-between py-4 border-b border-gray-100'>
      <View className='flex-row items-center flex-1'>
        <View className='w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3'>
          <Ionicons name={icon} size={20} color="#666" />
        </View>
        <Text className='text-base flex-1' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
          {title}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#FF6B35' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar style='dark'/>
      
      <View className='flex-1'>
        <KeyboardAwareScrollView 
          className='flex-1' 
          contentContainerStyle={{paddingHorizontal: 28, paddingTop: 24, paddingBottom: 20}}
        >
          <View className=''>
            <View className='flex-row items-center gap-2 mb-8'>
              <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
              <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                Delivery Preference
              </Text>
            </View>

            {/* Preference Options */}
            <View className='bg-white'>
              <PreferenceItem
                icon="location"
                title="Auto-Accept Nearby Deliveries"
                value={autoAcceptNearby}
                onValueChange={setAutoAcceptNearby}
              />
              
              <PreferenceItem
                icon="moon"
                title="Night Mode Availability"
                value={nightModeAvailability}
                onValueChange={setNightModeAvailability}
              />
              
              <PreferenceItem
                icon="notifications"
                title="Delivery Notifications"
                value={deliveryNotifications}
                onValueChange={setDeliveryNotifications}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* Save Button */}
        <View className='px-7 pb-8'>
          <SolidMainButton text='Save' onPress={()=>handleSave()} />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default DeliveryPreference