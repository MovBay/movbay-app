import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Image, StyleSheet, Text, View, Dimensions } from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

const OnBoardingPage = () => {

    const handleRedirectSignup = async () => {
      await AsyncStorage.setItem("movebay_onboarding", "true");
      router.replace("/user-role");
    };
    const handleRedirectLogin = async () => {
      await AsyncStorage.setItem("movebay_onboarding", "true");
      router.replace("/login");
    };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='dark'/>
      
      <View style={styles.content}>
        {/* Illustration Section */}
        <Animated.View 
          style={styles.illustrationContainer}
          entering={FadeInDown.duration(500).springify()}
        >
          <Image 
            source={require('../../assets/images/onboarding.png')} 
            style={styles.illustration}
            resizeMode='contain'
          />
        </Animated.View>

        {/* Text Content */}
        <Animated.View 
          style={styles.textContainer}
          entering={FadeInDown.duration(600).delay(200).springify()}
        >
          <Text style={styles.title}>Welcome to MovBay!</Text>
          <Text style={styles.subtitle}>
            Shop, sell, send packages, and connect with your community – all in one app.
          </Text>
        </Animated.View>
        
        {/* Buttons */}
        <Animated.View 
          style={styles.buttonContainer}
          entering={FadeInDown.duration(600).delay(400).springify()}
        >
          <SolidMainButton 
            text='Get Started' 
            onPress={() => handleRedirectSignup()}
          />
          <SolidLightButton 
            text='Login' 
            onPress={() => handleRedirectLogin()}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

export default OnBoardingPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6C3B8', // Coral/pink background
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  illustration: {
    width: width * 0.85,
    height: height * 0.5,
    maxHeight: 400,
  },
  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
    fontFamily: 'HankenGrotesk_600SemiBold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
    fontFamily: 'HankenGrotesk_400Regular',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    gap: 16,
    paddingHorizontal: 20,
  },
});