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



const Profile = () => {
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

              <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_500Medium'}}>My Profile</Text>
              <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Manage your account, orders, and preferences.</Text>

              <View className='flex-col justify-center items-center mt-6'>
                <View className='flex w-24 h-24 rounded-full bg-gray-300 justify-center items-center mt-4'>
                  <Image source={require('../../../assets/images/profile.png')} style={{objectFit: 'cover', width: '100%', height: '100%'}}/>
                </View>
                <View>
                  <Text className='text-lg mt-2 text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Sunday Kingsley Uchenna</Text>
                  <Text className='text-base text-gray-500 text-center' style={{fontFamily: 'HankenGrotesk_400Regular'}}>@iamkvisuals</Text>
                </View>
                <View className='flex-row items-center gap-1 py-2 pb-4'>
                  <MaterialIcons name='location-pin' size={20} color={'#EA4335'}/>
                  <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Port Harcourt, Nigeria</Text>
                </View>

                <Pressable className='flex-row items-center gap-1 p-2.5 px-6 rounded-full bg-[#FEEEE6]' onPress={() => router.push('/profile-edit')}>
                  <MaterialIcons name='edit' size={20} color={'#A53F0E'}/>
                  <Text className='text-base text-[#A53F0E]' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Edit</Text>
                </Pressable>
              </View>

              <View>
                <Pressable onPress={() => router.push('/profile-view')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='person-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Profile Info</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='location-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Address Book</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='settings-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Profile Info</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='bag-add-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Orders History</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='favorite-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Save</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='people-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Referrals</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>


                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='question-mark' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>FAQ and support</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>


                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='star-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Rate MovBay</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={handleLogout} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-lg p-3'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='logout' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Logout</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={20} color={'#0F0F0F'}/>
                </Pressable>

              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* Fixed Delete Button at Bottom */}
          <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100'>
            <Pressable
              onPress={handleLogout}
              className='bg-red-500 p-4 rounded-full'
            >
              <Text className='text-white text-lg text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Delete MovBay</Text>
            </Pressable>
          </View>
        </View>
    </SafeAreaView>
  )
}

export default Profile