import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

const Wallet = () => {

  const [viewBalance, setViewBalance] = useState(false)



  
  return (
    <SafeAreaView className='flex-1 bg-white px-5'>
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


        <Text className='text-3xl text-center text-white' style={{fontFamily: 'HankenGrotesk_700Bold'}}>₦ {viewBalance === false ? '********' : '345,735.00'}</Text>

        <View className='flex-row justify-between pt-4'>
          <Pressable className='bg-[#FEEEE6] w-[48%] p-3 px-3.5 rounded-full flex-row items-center gap-3'>
            <View className='bg-white rounded-full p-2'>
              <MaterialIcons name='arrow-upward' size={20} color={'black'}/>
            </View>
            <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Add Funds</Text>
          </Pressable>

          <Pressable className='bg-[#FEEEE6] w-[48%] p-3 px-3.5 rounded-full flex-row items-center gap-3'>
            <View className='bg-white rounded-full p-2'>
              <MaterialIcons name='arrow-downward' size={20} color={'black'}/>
            </View>
            <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Withdraw</Text>
          </Pressable>
        </View>

      </View>
      <Animated.View className='flex-row justify-between pt-5' entering={FadeInDown.duration(500).delay(400).springify()}>
        <View className='bg-[#ECFDF2] p-5 rounded-2xl w-[49%]'>
          <View className=''>
            <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-green-700'>₦ 184,000</Text>
          </View>
          <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Total Deposit</Text>
        </View>

        <View className='bg-orange-50 p-5 rounded-2xl w-[49%]'>
          <View className=''>
            <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-orange-600'>₦ 184,000</Text>
          </View>
          <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Total Withdrawal</Text>
        </View>
      </Animated.View>

      <Animated.View className='flex-row justify-between pt-5' entering={FadeInDown.duration(500).delay(600).springify()}>
        <View className='bg-[#F3EBFF] p-5 rounded-2xl w-[49%]'>
          <View className='flex-row justify-between'>
            <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-purple-600'>₦182,000</Text>
            <View className='flex-row gap-1 items-center'>
              <Ionicons name='trending-up' color={'green'} size={15}/>
              <Text className='text-green-700 text-base' style={{fontFamily: 'HankenGrotesk_500Medium'}}>28%</Text>
            </View>
          </View>
          <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Earnings This Month</Text>
        </View>

        <Pressable className='bg-gray-100  p-5 rounded-2xl w-[49%]'>
          <MaterialIcons name='add' size={25} style={{margin: 'auto'}}/>
          <Text className='text-base pt-1 text-center' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Top Wallet</Text>
        </Pressable>
      </Animated.View>

      <KeyboardAwareScrollView className='pt-5'>
        <View className='pt-5'>
          <View className='flex-row justify-between items-center'>
            <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Transaction History</Text>
            <Pressable className='flex-row items-center gap-2'>
              <Text className='text-base text-orange-600' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>View more</Text>
              <MaterialIcons name='arrow-forward' color={'#F75F15'}/>
            </Pressable>
          </View>

          <View className='pt-14'>
            <View className='bg-gray-100 p-4 rounded-full w-fit m-auto items-center'>
              <MaterialIcons name='history' size={26}/>
            </View>
            <Text className='text-base text-center text-neutral-500 pt-3' style={{fontFamily: 'HankenGrotesk_500Medium'}}>No Transaction Details</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Wallet