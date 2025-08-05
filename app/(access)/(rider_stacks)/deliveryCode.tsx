import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useVerifyDeliveryOrder } from '@/hooks/mutations/ridersAuth'
import { useToast } from 'react-native-toast-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import LoadingOverlay from '@/components/LoadingOverlay'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { OnboardHeader } from '@/components/btns/OnboardHeader'
import { Button } from '@rneui/themed'
import { SolidMainButton } from '@/components/btns/CustomButtoms'

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    backgroundColor: '#F6F6F6',
    fontSize: 12,
  },
  titleStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 13,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6
  }
})

const DeliveryCode = () => {
  const [code, setCode] = useState('')
  const toast = useToast()
  const router = useRouter()
  const { orderId } = useLocalSearchParams()
  
  const { mutate: verifyOrder, isPending } = useVerifyDeliveryOrder(orderId)

  const handleCodeChange = useCallback((text: string) => {
    // Only allow numbers and limit to 5 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 5)
    setCode(numericText)
  }, [])

  const handleVerify = useCallback(() => {
    if (code.length !== 5) {
      toast.show('Please enter a 5-digit code', { type: 'warning' })
      return
    }

    verifyOrder(
      { code },
      {
        onSuccess: async () => {
          toast.show('Delivery verified successfully!', { type: 'success' })
          
          // Remove the ride ID from local storage
          await AsyncStorage.removeItem('accepted_ride_id')
          
          // Navigate back to the main screen or rides list
          router.back()
        },
        onError: (error: any) => {
          console.error('Verification failed:', error)
          const errorMessage = error.message || 'Verification failed. Please check the code and try again.'
          toast.show(errorMessage, { type: 'danger' })
        }
      }
    )
  }, [code, verifyOrder, toast, router])

  const handleResendCode = useCallback(() => {
    // Add resend code logic here when available
    toast.show('Resend code functionality coming soon!', { type: 'info' })
  }, [toast])

  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
      <StatusBar style='dark'/>
      <LoadingOverlay visible={isPending} />
      
      <KeyboardAwareScrollView>
        <View className='px-7 mt-10'>
          <OnboardHeader 
            text='Delivery Confirmation Code' 
            description='Enter the 5 digit number given to the recipient to confirm delivery'
          />

          <View className='pt-10'>
            <View className='mb-5'>
              <Text style={styles.titleStyle}>OTP Code</Text>
              <TextInput 
                placeholder='E.g - 12345'
                placeholderTextColor={"#AFAFAF"}
                onChangeText={handleCodeChange}
                value={code}
                keyboardType="number-pad"
                maxLength={5}
                style={styles.inputStyle}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isPending}
                autoFocus
              />

              {code.length > 0 && code.length < 5 && (
                <Text className="pl-2 pt-3 text-sm text-red-600">
                  OTP must be 5 digits
                </Text>
              )}
            </View>

            <View className='flex-col gap-4'>
              <SolidMainButton 
                text={isPending ? 'Verifying...' : 'Verify'} 
                onPress={handleVerify}
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default DeliveryCode