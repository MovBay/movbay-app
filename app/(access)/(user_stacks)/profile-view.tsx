import { View, Text, Image } from 'react-native'
import React from 'react'
import { useQueryClient } from '@tanstack/react-query';
import { useLogout } from '@/hooks/mutations/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { OnboardArrowHeader, OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';
import { SolidMainButton } from '@/components/btns/CustomButtoms';



const ProfileView = () => {
  const {mutate, isPending} = useLogout();
  const queryCLient = useQueryClient();
  
  const handleLogout = async () => {
    mutate();
    await queryCLient.clear();

    await AsyncStorage.removeItem("movebay_token");
    await AsyncStorage.removeItem("movebay_usertype");
    await AsyncStorage.removeItem("movebay_onboarding");
    router.replace("/login");
  };


  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar style='dark'/>
        <LoadingOverlay visible={isPending}  />

        <View className='flex-1'>
          <KeyboardAwareScrollView className='flex-1' contentContainerStyle={{paddingHorizontal: 28, paddingTop: 24, paddingBottom: 20}}>
            <View className=''>

            <View className='flex-row items-center gap-2'>
                <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
                <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Profile Information</Text>
            </View>

              <View className='flex-col justify-center items-center mt-6'>
                <View className='flex w-24 h-24 rounded-full bg-gray-300 justify-center items-center mt-4'>
                  <Image source={require('../../../assets/images/profile.png')} style={{objectFit: 'cover', width: '100%', height: '100%'}}/>
                </View>
                <View>
                  <Text className='text-lg mt-2 text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Sunday Kingsley Uchenna</Text>
                  <Text className='text-base text-gray-500 text-center' style={{fontFamily: 'HankenGrotesk_400Regular'}}>@iamkvisuals</Text>
                </View>
              </View>

              <View className='mt-6 flex-col gap-4'>
                <View  className='p-4 border border-neutral-200 rounded-lg '>
                    <Text className='text-sm pb-1 text-neutral-600' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Full Name</Text>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Sunday Kingsley Uchenna</Text>
                </View>

                <View  className='p-4 border border-neutral-200 rounded-lg '>
                    <Text className='text-sm pb-1 text-neutral-600' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Username</Text>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>@iamkvisuals</Text>
                </View>

                <View  className='p-4 border border-neutral-200 rounded-lg '>
                    <Text className='text-sm pb-1 text-neutral-600' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Email Adress</Text>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>kingsleysunday998@gmail.com</Text>
                </View>


                <View  className='p-4 border border-neutral-200 rounded-lg '>
                    <Text className='text-sm pb-1 text-neutral-600' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Phone Number</Text>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>09041204566</Text>
                </View>

              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* Fixed Delete Button at Bottom */}
          <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100 mb-5'>
            <SolidMainButton
              onPress={()=>router.push('/profile-edit')}
              text='Edit Profile'
            />
          </View>
        </View>
    </SafeAreaView>
  )
}

export default ProfileView