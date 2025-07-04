import { View, Text, ActivityIndicator, Pressable } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeaderMany } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'react-native'
import { useGetStore, useGetUserProducts } from '@/hooks/mutations/sellerAuth'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useProfile } from '@/hooks/mutations/auth'
import { OnboardArrowHeader } from '@/components/btns/OnboardHeader'

const Store = () => {

    const navigation = useNavigation()
    const openDrawer = () => {
      navigation.dispatch(DrawerActions.openDrawer())
    }

    const {storeData, isLoading} = useGetStore()
    const {userProductData, isLoading: productLoading, refetch} = useGetUserProducts()
    const userData = userProductData?.data?.results
    const {profile} = useProfile()
    console.log('This is store data', userProductData?.data?.results[0]?.store?.owner?.username)
    console.log('This is profile data', profile?.data)


  return (
    <SafeAreaView className='flex-1 bg-white px-8'>
        <StatusBar style='dark'/>
        <View className='flex-row items-center pt-5'>

          {userProductData?.data?.results[0]?.store?.owner?.username === profile?.data?.username ?
            <DrawerHeaderMany onPress={openDrawer}/> :
            <OnboardArrowHeader onPressBtn={()=>router.back()}/>
          }
          <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Store</Text>

          <View className='bg-neutral-100 rounded-full p-3 flex'>
            <Ionicons name='share-outline' size={20} color={'black'}/>
          </View>
        </View>

        {isLoading || productLoading ? 
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


                <Pressable onPress={()=>router.push('/(access)/(user_stacks)/user_follows')}>
                  <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.followers_count}</Text>
                  <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Followers</Text>
                </Pressable>

                <Pressable onPress={()=>router.push('/(access)/(user_stacks)/user_follows')}>
                  <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.followers_count}</Text>
                  <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Following</Text>
                </Pressable>

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

            {userData.length === 0 ? 
              <View>
                <View className='justify-center items-center flex-1 pt-20'>
                  <Image source={require('../../../../assets/images/save.png')} style={{width: 70, height: 70, justifyContent: 'center', margin: 'auto'}}/>
                  <Text className='text-base text-center pt-2 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>No product posted yet</Text>
                </View>
              </View> :
              <View>
                <Text>All products</Text>
              </View>
            }
          </KeyboardAwareScrollView>
        }

    </SafeAreaView>
  )
}

export default Store