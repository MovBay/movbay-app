import React, { useState, useCallback, useEffect } from 'react'
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
  const [isValidating, setIsValidating] = useState(false)
  const toast = useToast()
  const router = useRouter()
  const { orderId } = useLocalSearchParams()
  
  const { mutate: verifyOrder, isPending } = useVerifyDeliveryOrder(orderId)

  // Debug logging
  useEffect(() => {
    console.log("🔍 DeliveryCode component mounted")
    console.log("🔍 Order ID from params:", orderId)
  }, [orderId])

  const handleCodeChange = useCallback((text: string) => {
    // Only allow numbers and limit to 5 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 5)
    setCode(numericText)
    console.log("🔍 Code changed:", numericText)
  }, [])

  const handleVerify = useCallback(() => {
    console.log("🔍 Starting verification process...")
    console.log("🔍 Current code:", code)
    console.log("🔍 Order ID:", orderId)

    if (!orderId) {
      toast.show('Order ID not found. Please try again.', { type: 'danger' })
      return
    }

    if (code.length !== 5) {
      toast.show('Please enter a 5-digit code', { type: 'warning' })
      return
    }

    // Validate code is all numbers
    if (!/^\d{5}$/.test(code)) {
      toast.show('OTP must contain only numbers', { type: 'warning' })
      return
    }

    setIsValidating(true)

    // Send the correct payload format
    const payload = { otp: code }
    console.log("🔍 Sending payload:", payload)

    verifyOrder(payload, {
      onSuccess: async (data) => {
        console.log("🔍 Verification successful:", data)
        setIsValidating(false)
        
        // Show success message with data from backend if available
        let successMessage = 'Delivery verified successfully!'
        if (data?.data?.message) {
          successMessage = data.data.message
        }
        
        toast.show(successMessage, { type: 'success' })
        
        try {
          await AsyncStorage.removeItem('accepted_ride_id')
          console.log("🔍 Removed accepted_ride_id from storage")
        } catch (error) {
          console.error("🔍 Error removing ride ID:", error)
        }
        
        setTimeout(() => {
          router.replace('/(access)/(rider_stacks)/rideVerificationSuccessfull')
        }, 1000)
      },
      onError: (error: any) => {
        console.error("🔍 Verification failed:", error)
        setIsValidating(false)
        
        // The error message is already processed in the hook
        const errorMessage = error.message || 'Verification failed. Please check the code and try again.'
        toast.show(errorMessage, { type: 'danger' })
      }
    })
  }, [code, orderId, verifyOrder, toast, router])

  const handleResendCode = useCallback(() => {
    // Add resend code logic here when available
    console.log("🔍 Resend code requested for order:", orderId)
    toast.show('Contact the recipient for the delivery code', { type: 'info' })
  }, [toast, orderId])

  const isProcessing = isPending || isValidating

  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
      <StatusBar style='dark'/>
      <LoadingOverlay visible={isProcessing} />
      
      <KeyboardAwareScrollView>
        <View className='px-7 mt-10'>
          <OnboardHeader 
            text='Delivery Confirmation Code' 
            description='Enter the 5 digit number given to the recipient to confirm delivery'
          />

          {/* Debug info - remove in production */}
          {__DEV__ && (
            <View className="bg-gray-100 p-3 rounded-lg mb-4">
              <Text className="text-xs text-gray-600">
                Debug: Order ID = {String(orderId)}
              </Text>
            </View>
          )}

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
                editable={!isProcessing}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />

              {code.length > 0 && code.length < 5 && (
                <Text className="pl-2 pt-3 text-sm text-red-600">
                  OTP must be 5 digits
                </Text>
              )}

              {code.length === 5 && !/^\d{5}$/.test(code) && (
                <Text className="pl-2 pt-3 text-sm text-red-600">
                  OTP must contain only numbers
                </Text>
              )}
            </View>

            <View className='flex-col gap-4'>
              <SolidMainButton 
                text={isProcessing ? 'Verifying...' : 'Verify Delivery'} 
                onPress={handleVerify}
              />

              <TouchableOpacity 
                onPress={handleResendCode}
                disabled={isProcessing}
                className="self-center py-2"
              >
                <Text className="text-blue-600 text-sm underline">
                  Need help getting the code?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default DeliveryCode