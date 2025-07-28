import { View, Text, Pressable, RefreshControl } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import { useGetWalletDetails } from '@/hooks/mutations/sellerAuth'
import { StatusBar } from 'expo-status-bar'
import LoadingOverlay from '@/components/LoadingOverlay'

const RiderWallet = () => {
  const [viewBalance, setViewBalance] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const {walletData, isLoading, refetch} = useGetWalletDetails()

  console.log('This is wallet data', walletData?.data)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (error) {
      console.error('Error refreshing wallet data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-white px-5'>
      <StatusBar style='dark'/>
      <LoadingOverlay visible={isLoading}  />
      
      <KeyboardAwareScrollView 
        className='flex-1'
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F75F15']} // Android
            tintColor='#F75F15' // iOS
          />
        }
      >
        <View className='pt-5'>
          <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>My Wallet</Text>
          <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Manage your balance, payments, and earnings.</Text>
        </View>

        <View className='bg-[#F75F15] p-7  mt-5 rounded-3xl shadow-slate-400'>
          <View className='flex-row m-auto gap-3 items-center pb-3'>
            <Text className='text-base text-orange-100' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Wallet Balance</Text>
            <Pressable onPress={()=>setViewBalance(!viewBalance)}>
              <Ionicons name={viewBalance === false ? 'eye-sharp' : 'eye-off-sharp'} color={'#F2F2F2'} size={20}/>
            </Pressable>
          </View>

          <Text className='text-2xl text-center text-white' style={{fontFamily: 'HankenGrotesk_700Bold'}}>₦ {viewBalance === false ? '********' : walletData?.data?.balance.toLocaleString()}.00</Text>

          <View className='flex-row justify-center pt-4'>

            <Pressable className='bg-[#FEEEE6] w-[48%] p-2 px-4 rounded-full flex-row items-center gap-3' onPress={()=>router.push('/')}>
              <View className='bg-white rounded-full p-1.5'>
                <MaterialIcons name='arrow-downward' size={20} color={'black'}/>
              </View>
              <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Withdraw</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View className='flex-row justify-between pt-5' entering={FadeInDown.duration(300).delay(200).springify()}>
          <View className='bg-[#ECFDF2] p-5 rounded-2xl w-[49%]'>
            <View className=''>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-green-700'>₦ {walletData?.data?.total_deposit.toLocaleString()}.00</Text>
            </View>
            <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>This Week</Text>
          </View>

            <View className='bg-[#F3EBFF] p-5 rounded-2xl w-[49%]'>
                <View className='flex-row justify-between'>
                <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-purple-600'>₦ 0</Text>
                <View className='flex-row gap-1 items-center'>
                    <Ionicons name='trending-up' color={'green'} size={15}/>
                    <Text className='text-green-700 text-base' style={{fontFamily: 'HankenGrotesk_500Medium'}}>28%</Text>
                </View>
                </View>
                <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Bonus Earned</Text>
            </View>
        </Animated.View>

        <View className='pt-5'>
          <View className='pt-5'>
            <View className='flex-row justify-between items-center'>
              <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Transaction History</Text>
              <Pressable className='flex-row items-center gap-2'>
                <Text className='text-sm text-orange-600' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>View more</Text>
                <MaterialIcons name='arrow-forward' color={'#F75F15'}/>
              </Pressable>
            </View>

            <View className='pt-14 pb-10'>
              <View className='bg-gray-100 p-4 rounded-full w-fit m-auto items-center'>
                <MaterialIcons name='history' size={23}/>
              </View>
              <Text className='text-sm text-center text-neutral-500 pt-3' style={{fontFamily: 'HankenGrotesk_500Medium'}}>No Transaction Details</Text>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default RiderWallet