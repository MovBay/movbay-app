import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeaderMany } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'react-native'
import { useGetStore } from '@/hooks/mutations/sellerAuth'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'

const Store = () => {

    const navigation = useNavigation()
    const openDrawer = () => {
      navigation.dispatch(DrawerActions.openDrawer())
    }

    const {storeData, isLoading} = useGetStore()

  return (
    <SafeAreaView className='flex-1 bg-white px-8'>
        <StatusBar style='dark'/>
        <View className='flex-row items-center pt-5'>
          <DrawerHeaderMany onPress={openDrawer}/>
          <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Store</Text>
        </View>

        {isLoading ? 
          <View className='justify-center items-center pt-20'>
            <ActivityIndicator size={'small'} color={'green'}/>
          </View> : 
        
          <KeyboardAwareScrollView className='pt-5'>
            <View className=''>

              <View className='flex-row justify-between items-center'>
                <View className='w-20 h-20 object-cover overflow-hidden flex rounded-full border-2 border-green-800 p-1'>
                  <Image source={{uri: storeData?.data?.store_image}} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 50}}/>
                </View>

                <View>
                  <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.product_count}</Text>
                  <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Post</Text>
                </View>


                <View>
                  <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.followers_count}</Text>
                  <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Followers</Text>
                </View>

                <View>
                  <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.followers_count}</Text>
                  <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Following</Text>
                </View>

              </View>

              <View className='pt-5 flex-row items-center justify-between'>
                <View>
                  <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.name}</Text>
                  <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{storeData?.data?.description}</Text>
                </View>
              </View>

              <View className='flex-row items-center justify-between pt-5'>
                <View className='w-[49%]'>
                  <SolidLightButton text='Share Profile'/>
                </View>

                <View className='w-[49%]'>
                  <SolidMainButton text='Follow'/>
                </View>
              </View>
            </View>


            <View>
              <View className='justify-center items-center flex-1 pt-20'>
                <Image source={require('../../../../assets/images/save.png')} style={{width: 70, height: 70, justifyContent: 'center', margin: 'auto'}}/>
                <Text className='text-base text-center pt-2 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>No product posted yet</Text>
              </View>
            </View>
          </KeyboardAwareScrollView>
        }

    </SafeAreaView>
  )
}

export default Store