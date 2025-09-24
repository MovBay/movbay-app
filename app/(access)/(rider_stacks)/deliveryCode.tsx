import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useVerifyDeliveryOrder, useVerifyDeliveryPackage } from '@/hooks/mutations/ridersAuth'
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
    fontSize: 13,
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
  const { orderId, deliveryType, rideData, packageId } = useLocalSearchParams()
  
  // Parse ride data if available
  const parsedRideData = useMemo(() => {
    try {
      return rideData ? JSON.parse(rideData as string) : null
    } catch (error) {
      console.warn("🔍 Error parsing ride data:", error)
      return null
    }
  }, [rideData])

  // Determine delivery type from multiple sources
  const currentDeliveryType = useMemo(() => {
    if (deliveryType) return deliveryType as string
    if (parsedRideData?.delivery_type) return parsedRideData.delivery_type
    return "Order"
  }, [deliveryType, parsedRideData])

  // Determine if this is a package delivery
  const isPackageDelivery = useMemo(() => {
    return currentDeliveryType === "Package" && (parsedRideData?.package_delivery != null)
  }, [currentDeliveryType, parsedRideData])

  // Determine if this is an order delivery
  const isOrderDelivery = useMemo(() => {
    return currentDeliveryType === "Order" && (parsedRideData?.order != null || !parsedRideData)
  }, [currentDeliveryType, parsedRideData])

  // Initialize hooks conditionally based on delivery type
  const { mutate: verifyOrder, isPending: isOrderPending } = useVerifyDeliveryOrder(
    isOrderDelivery ? orderId as string : undefined
  )
  const { mutate: verifyPackage, isPending: isPackagePending } = useVerifyDeliveryPackage(
    isPackageDelivery ? packageId as string : undefined
  )


  const handleCodeChange = useCallback((text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 5)
    setCode(numericText)
  }, [])

  const handleVerify = useCallback(() => {
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
    const payload = { otp: code }
    if (isPackageDelivery) {
      console.log("🔍 Using package verification hook")
      verifyPackage(payload, {
        onSuccess: async (data) => {
          setIsValidating(false)
          let successMessage = 'Package delivery verified successfully!'
          if (data?.data?.message) {
            successMessage = data.data.message
          }
          toast.show(successMessage, { type: 'success' })
          try {
            await AsyncStorage.removeItem('accepted_ride_id')
          } catch (error) {
            console.error("🔍 Error removing ride ID:", error)
          }
          
          setTimeout(() => {
            router.replace('/(access)/(rider_stacks)/rideVerificationSuccessfull')
          }, 1000)
        },
        onError: (error: any) => {
          setIsValidating(false)
          const errorMessage = error.message || 'Package verification failed. Please check the code and try again.'
          toast.show(errorMessage, { type: 'danger' })
        }
      })
    } else if (isOrderDelivery) {
      console.log("🔍 Using order verification hook")
      verifyOrder(payload, {
        onSuccess: async (data) => {
          setIsValidating(false)
          let successMessage = 'Order delivery verified successfully!'
          if (data?.data?.message) {
            successMessage = data.data.message
          }
          
          toast.show(successMessage, { type: 'success' })
          
          try {
            await AsyncStorage.removeItem('accepted_ride_id')
          } catch (error) {
            console.error("🔍 Error removing ride ID:", error)
          }
          
          setTimeout(() => {
            router.replace('/(access)/(rider_stacks)/rideVerificationSuccessfull')
          }, 1000)
        },
        onError: (error: any) => {
          console.error("🔍 Order verification failed:", error)
          setIsValidating(false)
          const errorMessage = error.message || 'Order verification failed. Please check the code and try again.'
          toast.show(errorMessage, { type: 'danger' })
        }
      })
    } else {
      setIsValidating(false)
      toast.show('Unable to determine delivery type. Please try again.', { type: 'danger' })
    }
  }, [code, orderId, currentDeliveryType, isPackageDelivery, isOrderDelivery, verifyOrder, verifyPackage, toast, router])

  const handleResendCode = useCallback(() => {
    const deliveryTypeText = isPackageDelivery ? 'package sender or recipient' : 'recipient'
    toast.show(`Contact the ${deliveryTypeText} for the delivery code`, { type: 'info' })
  }, [toast, orderId, isPackageDelivery])

  // Determine which pending state to use
  const isProcessing = useMemo(() => {
    if (isPackageDelivery) {
      return isPackagePending || isValidating
    } else {
      return isOrderPending || isValidating
    }
  }, [isPackageDelivery, isPackagePending, isOrderPending, isValidating])

  // Dynamic header text based on delivery type
  const headerText = useMemo(() => {
    if (isPackageDelivery) {
      return 'Package Delivery Confirmation Code'
    } else {
      return 'Delivery Confirmation Code'
    }
  }, [isPackageDelivery])

  const headerDescription = useMemo(() => {
    if (isPackageDelivery) {
      return 'Enter the 5 digit number given to the package recipient to confirm delivery'
    } else {
      return 'Enter the 5 digit number given to the recipient to confirm delivery'
    }
  }, [isPackageDelivery])

  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
      <StatusBar style='dark'/>
      <LoadingOverlay visible={isProcessing} />
      
      <KeyboardAwareScrollView>
        <View className='px-7 mt-10'>
          <OnboardHeader 
            text={headerText} 
            description={headerDescription}
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
                text={`Verify ${currentDeliveryType} Delivery`} 
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