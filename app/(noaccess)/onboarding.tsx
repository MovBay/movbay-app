import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


const OnBoardingPage = () => {
  return (
    <SafeAreaView className='flex-1 flex flex-col justify-center items-center w-full bg-white'>
        <StatusBar style='dark'/>

        <View className='px-10 w-full'>
          <View>
            <Text className='text-2xl text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Welcome to MovBay!</Text>
            <Text className='text-center text-base text-neutral-500 pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Shop, sell, send packages, and connect with your community – all in one app.</Text>
          </View>
            <View className='w-full flex flex-col gap-4 mt-10'>
                <SolidMainButton text='Get Started' onPress={()=>router.replace('/user-role')}/>
                <SolidLightButton text='Login' onPress={()=>router.replace('/login')}/>
            </View>
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

