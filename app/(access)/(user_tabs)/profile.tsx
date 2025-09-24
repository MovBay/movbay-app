import { View, Text, Image, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query';
import { useLogout, useProfile } from '@/hooks/mutations/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms';
import { useCart } from "@/context/cart-context"
import { useFavorites } from '@/context/favorite-context';

// Custom Modal Component
const CustomModal = ({ visible, onClose, children }:any) => {
  if (!visible) return null;

  return (
    <View className='absolute inset-0 flex-1 justify-center items-center bg-black/50 z-50'>
      <TouchableOpacity 
        className='absolute inset-0' 
        onPress={onClose}
        activeOpacity={1}
      />
      {children}
    </View>
  );
};

const Profile = () => {
  const {mutate, isPending} = useLogout();
  const {profile, isLoading} = useProfile()
  const queryCLient = useQueryClient();
  const {clearCart} = useCart()
  const {clearFavorites} = useFavorites()
  
  const handleLogout = async () => {
    mutate();
    await queryCLient.clear();

    await AsyncStorage.removeItem("movebay_token");
    await AsyncStorage.removeItem("movebay_usertype");
    await AsyncStorage.removeItem("movebay_onboarding");
    await clearCart()
    // await clearFavorites()
    router.replace("/login");
  };

    const [showDialog, setShowDialog] = useState(false);
  
    const handlePress = () => {
      setShowDialog(true);
    };
  
    const closeDialog = () => {
      setShowDialog(false);
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

                <Pressable className='flex-row items-center gap-1 p-2.5 px-6 rounded-full bg-[#FEEEE6]' onPress={() => router.push('/profile-edit')}>
                  <MaterialIcons name='edit' size={15} color={'#A53F0E'}/>
                  <Text className='text-sm text-[#A53F0E]' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Edit profile</Text>
                </Pressable>
              </View>
              }

              <View>
                <Pressable onPress={() => router.push('/(access)/(user_stacks)/profile-view')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='person-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Profile Info</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(user_stacks)/addressBook')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='location-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Address Book</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(user_stacks)/settings')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='settings-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Settings</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(user_stacks)/user_follows')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='people-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Followed Store</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(user_stacks)/order_history_buyer')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='bag-add-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Order History</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(user_stacks)/courier/parcel_history_buyer')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='gift-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Package Delivery History</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(user_stacks)/saved-product')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='favorite-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Saved</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/(access)/(user_stacks)/cart')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='basket-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Cart</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={() => router.push('/')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <Ionicons name='people-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Referrals</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>


                <Pressable onPress={() => router.push('/(access)/(user_stacks)/faq')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='question-mark' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>FAQ and support</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>


                <Pressable onPress={() => router.push('/(access)/(user_stacks)/rateMovbay')} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
                  <View className='flex-row items-center gap-3 '>
                    <View className='w-10 h-10 bg-gray-200 rounded-full justify-center items-center'>
                      <MaterialIcons name='star-outline' size={18} color={'#0F0F0F'}/>
                    </View>
                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Rate MovBay</Text>
                  </View>
                  <Ionicons name='chevron-forward-outline' size={15} color={'#0F0F0F'}/>
                </Pressable>

                <Pressable onPress={handlePress} className='flex-row items-center justify-between mt-3 bg-neutral-100 rounded-full p-3 px-4'>
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
        </View>

        {/* Custom Modal */}
        <CustomModal visible={showDialog} onClose={closeDialog}>
          <View className='bg-white rounded-2xl p-8 mx-6 w-[90%]'>
            <View className='items-center justify-center m-auto rounded-full p-5 bg-neutral-100 w-fit mb-5'>
              <Ionicons name="log-out-outline" size={30} color={'gray'}/>
            </View>
            <Text className='text-xl text-center mb-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
              Logout from account
            </Text>
            <Text className='text-neutral-500 text-center mb-6 w-[90%] m-auto text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
              Are you sure you want to logout from your account? {'\n'} it will clear your cart and saved items, You can always login again later.
            </Text>

            <View className='flex-row items-center justify-between'>
              <View className='w-[49%]'>
                <SolidLightButton onPress={closeDialog} text='Cancle'/>
              </View>

              <View className='w-[49%]'>
                <SolidMainButton onPress={handleLogout} text='Logout'/>
              </View>
            </View>
          </View>
        </CustomModal>

    </SafeAreaView>
  )
}

export default Profile