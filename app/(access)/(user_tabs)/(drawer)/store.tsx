import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeader } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'react-native'
import { useGetStore } from '@/hooks/mutations/sellerAuth'
import { Pressable } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useProfile } from '../../../../hooks/mutations/auth'

const Store = () => {

    const navigation = useNavigation()

    const openDrawer = () => {
      navigation.dispatch(DrawerActions.openDrawer())
    }

    const {storeData, isLoading} = useGetStore()
    const {profile} = useProfile()


    console.log('This is the data', profile?.data)

  return (
    <SafeAreaView className='flex-1 bg-white px-5'>
        <StatusBar style='dark'/>
        <DrawerHeader onPress={openDrawer}/>

        {isLoading ? 
          <View className='justify-center items-center pt-20'>
            <ActivityIndicator size={'small'} color={'green'}/>
          </View> : 
        
          <KeyboardAwareScrollView className='pt-5'>
            <View className=''>
              <View className='w-20 h-20 object-cover overflow-hidden m-auto flex rounded-full border-2 border-green-800 p-1'>
                <Image source={{uri: storeData?.data?.store_image}} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 50}}/>
              </View>

              <Text className='text-xl text-center pt-3' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.name}</Text>
              <Text className='text-base text-center text-gray-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{storeData?.data?.description}</Text>

              <Pressable className='flex-row items-center gap-1 p-2.5 m-auto mt-2 px-6 rounded-full bg-[#FEEEE6]' onPress={() => router.push('/store-edit')}>
                <MaterialIcons name='edit' size={20} color={'#A53F0E'}/>
                <Text className='text-base text-[#A53F0E]' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Edit Store</Text>
              </Pressable>
            </View>

            <View className='pt-5 flex-col gap-2'>


              <View className='p-4 border border-neutral-200 rounded-xl'>
                <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Username</Text>
                <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>@{profile?.data?.username}</Text>
              </View>

              <View className='p-4 border border-neutral-200 rounded-xl'>
                <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Phone</Text>
                <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{profile?.data?.phone_number}</Text>
              </View>

              <View className='p-4 border border-neutral-200 rounded-xl'>
                <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Address</Text>
                <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.address1}</Text>
              </View>

              <View className='p-4 border border-neutral-200 rounded-xl'>
                <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Address 2</Text>
                <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.address2}</Text>
              </View>

              <View className='p-4 border border-neutral-200 rounded-xl'>
                <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Document</Text>
                <View className='pt-2'>
                  <View>
                    <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>CAC Document.pdf</Text>
                  </View>
                  <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>NIN Document.jpg</Text>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
        }

    </SafeAreaView>
  )
}

export default Store