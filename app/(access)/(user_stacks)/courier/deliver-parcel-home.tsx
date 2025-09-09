import { View, Text, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'

const DeliverParcelHome = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />

        <View className='px-6 '>
            <View className="flex-row items-center gap-2">
                <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            </View>
            <View className='flex-col justify-center items-center p-2' style={{height: '85%'}}>
                <View className='w-full items-center justify-center'>
                    <Image
                        source={require('../../../../assets/images/bike.png')}
                        className='w-80 h-48'
                        resizeMode="contain"
                    />
                    <Text className='text-xl text-center text-gray-700 mt-4' style={{fontFamily: 'HankenGrotesk_700Bold'}}>
                        Send a Package – Fast & Easy
                    </Text>
                    <Text className='text-center text-sm text-gray-400 mt-2 px-6' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                        Whether it’s documents or gifts, MovBay gets it there safely.
                    </Text>

                    <View className='flex-row justify-between items-center mt-6'>
                        <View className='w-[80%]'>
                            <SolidMainButton text='Send a Parcel' onPress={() => router.push('/(access)/(user_stacks)/courier/parcel-form-one')} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    </SafeAreaView>
  )
}

export default DeliverParcelHome