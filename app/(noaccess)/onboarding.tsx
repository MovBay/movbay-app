// import { SolidButtonArrow } from '@/components/CustomButtons'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


const OnBoardingPage = () => {
  return (
    <SafeAreaView className='flex-1 flex flex-col justify-center items-center w-full'>
        <StatusBar style='light'/>

        <Text>Hello</Text>
   
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