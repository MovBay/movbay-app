import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Image } from 'react-native'
import { SolidMainButton } from '@/components/btns/CustomButtoms'
import { StyleSheet } from 'react-native'
import { router } from 'expo-router'

const WithdrawalSuccessful = () => {
  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
        <StatusBar style='dark'/>
        <View className='flex-1 flex items-center justify-center px-5'>
            <Animated.View 
                entering={FadeInDown.duration(500).delay(100).springify()}
            >
                <Image 
                    source={require('../../../assets/images/success.png')} 
                    style={{ width: 200, height: 200, marginBottom: 10 }}
                />
            </Animated.View>

            {/* Text Content */}
            <Animated.View 
                entering={FadeInDown.duration(600).delay(300).springify()}
                className={'px-5 mb-10'}
            >
                <Text style={styles.title}>Withdrawal Placed Successfully</Text>
                <Text style={styles.subtitle}>
                    Your withdrawal request has been placed successfully. It will be processed within 24 hours.
                </Text>
            </Animated.View>
                    
            {/* Buttons */}
            <Animated.View 
                entering={FadeInDown.duration(600).delay(400).springify()}
                className={'w-full px-5'}
            >
                <SolidMainButton 
                    text='Back to Wallet' 
                    onPress={() => router.replace('/(access)/(user_tabs)/wallet')}
                />
                
            </Animated.View>
        </View>
    </SafeAreaView>
  )
}

export default WithdrawalSuccessful



const styles = StyleSheet.create({

  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 25,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
    fontFamily: 'HankenGrotesk_600SemiBold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: 'HankenGrotesk_400Regular',
    paddingHorizontal: 10,
  },

});