import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'


const OnBoardingPage = () => {
  return (
    <SafeAreaView className='flex-1 flex flex-col justify-center items-center w-full bg-white'>
        <StatusBar style='dark'/>

        <View className='px-10 w-full'>
          <Animated.View className="" entering={FadeInDown.duration(300).springify()}>
            <Text className='text-2xl text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Welcome to MovBay!</Text>
            <Text className='text-center text-base text-neutral-500 pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Shop, sell, send packages, and connect with your community – all in one app.</Text>
          </Animated.View>
          
            <Animated.View className='w-full flex flex-col gap-4 mt-10' entering={FadeInDown.duration(300).delay(200).springify()}>
                <SolidMainButton text='Get Started' onPress={()=>router.push('/user-role')}/>
                <SolidLightButton text='Login' onPress={()=>router.push('/login')}/>
            </Animated.View>
        </View>
   
    </SafeAreaView>
  )
}

export default OnBoardingPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010101",
    alignItems: "center",
    justifyContent: "center",
    width: '100%'
  },
});

