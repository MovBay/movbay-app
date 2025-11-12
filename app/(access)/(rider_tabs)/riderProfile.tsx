import { View, Text, Image, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query';
import { useLogout, useProfile, useRiderProfile } from '@/hooks/mutations/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms';




const RiderProfile = () => {
  const {mutate, isPending} = useLogout();
  const {profile, isLoading} = useRiderProfile()
  const queryCLient = useQueryClient();
  
  const handleLogout = async () => {
    mutate();
    await queryCLient.clear();

    await AsyncStorage.removeItem("movebay_token");
    await AsyncStorage.removeItem("movebay_usertype");
    await AsyncStorage.removeItem("movebay_onboarding");
    await AsyncStorage.removeItem('accepted_ride_id')
    router.replace("/login");
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar style='dark'/>
      <LoadingOverlay visible={isPending}  />

        <View className='flex-1'>
          <KeyboardAwareScrollView className='flex-1' contentContainerStyle={{paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20}}>
            <View className=''>


              {isLoading ? <View className='m-auto pt-10 pb-5'><ActivityIndicator size={'small'} color={'#F75F15'} /></View> :
              <View className='flex-col justify-center items-center mt-2'>
                <View className='flex w-28  h-28 rounded-full border-2 border-green-600 p-2 bg-gray-50 justify-center items-center mt-1 overflow-hidden'>
                  {profile?.data?.profile_picture === null ? 
                    <MaterialIcons name='person-2' size={50} color={'gray'} />
                    :
                    <Image source={{uri: profile?.data?.profile_picture}} className='rounded-full' style={{objectFit: 'cover', width: '100%', height: '100%'}}/>
                  }
                </View>
                <View>
                  <Text className='text-base mt-2 text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{profile?.data?.fullname}</Text>
                  <Text className='text-base text-gray-500 text-center' style={{fontFamily: 'HankenGrotesk_400Regular'}}>@{profile?.data?.username}</Text>
                </View>
                <View className='flex-row items-center gap-1 py-2 pb-4'>
                  <MaterialIcons name='location-pin' size={20} color={'#EA4335'}/>
                  <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{profile?.data?.address === null ? 'N/A' : profile?.data?.address}</Text>
                </View>

                <Pressable className='flex-row items-center gap-1 p-2.5 px-6 rounded-full bg-[#FEEEE6]' onPress={() => router.push('/(access)/(rider_stacks)/ridersProfileEdit')}>
                  <MaterialIcons name='edit' size={15} color={'#A53F0E'}/>
                  <Text className='text-sm text-[#A53F0E]' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Edit profile</Text>
                </Pressable>
              </View>
              }

              <View>
                <Pressable onPress={() => router.push('/(access)/(rider_stacks)/ridersProfileView')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='person-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Profile Info</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(rider_stacks)/deliveryPreference')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='directions-bike' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Delivery Preference</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(rider_stacks)/bankDetails')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='business-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Bank Details</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(rider_stacks)/riderKYC')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='verified-user' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>KYC Verification</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                 <Pressable onPress={() => router.push('/(access)/(rider_stacks)/riderSettings')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='key-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Security</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>


                <Pressable onPress={() => router.push('/(access)/(rider_stacks)/ridersFAQ')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='question-mark' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>FAQ and support</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>


                {/* <Pressable onPress={() => router.push('/(access)/(rider_stacks)/ridersRating')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='star-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Rate MovBay</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable> */}

                <Pressable onPress={handleLogout} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='logout' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Logout</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* Fixed Delete Button at Bottom */}
          {/* <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100'>
            <Pressable
              onPress={handlePress}
              className='bg-red-500 p-4 rounded-full'
            >
              <Text className='text-white text-base text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Delete MovBay</Text>
            </Pressable>
          </View> */}
        </View>



    </SafeAreaView>
  )
}

export default RiderProfile