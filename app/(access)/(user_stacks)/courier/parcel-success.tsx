import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'

interface PaymentData {
  order_id?: string
  transaction_id?: string
  reference?: string
  status?: string
  expected_delivery?: string
  payment_details?: string
  total_amount?: number
  message?: string
  data?: any
}

interface Rider {
  riders_id: string
  riders_name: string
  riders_picture: string | null
  rating: number
  vehicle_type: string
  vehicle_color: string
  plate_number?: string
  eta: {
    distance_km: string
    duration_minutes: string
    fare_amount: string
  }
}

interface SummaryData {
  pickupAddress: string
  dropOffAddress: string
  recipientPhoneNumber: string
  recipientName: string
  packageType: string
  packageDescription: string
  additionalNotes?: string
}

const ParcelSuccess = () => {
  const { 
    paymentData, 
    riderData, 
    summaryData, 
    totalAmount, 
    paymentMethod 
  } = useLocalSearchParams()

  const [parsedPaymentData, setParsedPaymentData] = useState<PaymentData | null>(null)
  const [parsedRiderData, setParsedRiderData] = useState<Rider | null>(null)
  const [parsedSummaryData, setParsedSummaryData] = useState<SummaryData | null>(null)

  useEffect(() => {
    // Parse payment data
    if (paymentData) {
      try {
        const parsed = JSON.parse(paymentData as string)
        setParsedPaymentData(parsed)
        console.log("Payment Success Data:", parsed)
      } catch (error) {
        console.error("Error parsing payment data:", error)
      }
    }

    // Parse rider data
    if (riderData) {
      try {
        const parsed = JSON.parse(riderData as string)
        setParsedRiderData(parsed)
        console.log("Rider Data:", parsed)
      } catch (error) {
        console.error("Error parsing rider data:", error)
      }
    }

    // Parse summary data
    if (summaryData) {
      try {
        const parsed = JSON.parse(summaryData as string)
        setParsedSummaryData(parsed)
        console.log("Summary Data:", parsed)
      } catch (error) {
        console.error("Error parsing summary data:", error)
      }
    }
  }, [paymentData, riderData, summaryData])

  // Get payment method display name
  const getPaymentDisplayName = (method: string): string => {
    const paymentMethods: Record<string, string> = {
      movbay: "MovBay Wallet",
      card: "Card Payment", 
      transfer: "Bank Transfer",
      wallet: "MovBay Wallet",
      bank_transfer: "Bank Transfer"
    }
    return paymentMethods[method] || "Payment"
  }

  const formatAmount = (amount: string | number | undefined): string => {
    if (!amount) return 'Amount not available'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `₦${numAmount.toLocaleString()}`
  }

  // Get order ID from payment data or generate fallback
  const getOrderId = (): string => {
    return parsedPaymentData?.order_id || 
           parsedPaymentData?.transaction_id || 
           parsedPaymentData?.reference ||
           parsedRiderData?.riders_id ||
           `ORDER-${Date.now()}`
  }

  // Calculate estimated delivery time (adding 30-60 minutes to current time)
  const getEstimatedDelivery = (): string => {
    if (parsedPaymentData?.expected_delivery) {
      return parsedPaymentData.expected_delivery
    }
    
    if (parsedRiderData?.eta?.duration_minutes) {
      const minutes = parseInt(parsedRiderData.eta.duration_minutes) + 15 // Add buffer time
      const deliveryTime = new Date()
      deliveryTime.setMinutes(deliveryTime.getMinutes() + minutes)
      
      return deliveryTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }
    
    // Default fallback
    const defaultDelivery = new Date()
    defaultDelivery.setMinutes(defaultDelivery.getMinutes() + 45)
    return defaultDelivery.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getPaymentMethodText = (): string => {
    if (parsedPaymentData?.payment_details) {
      return getPaymentDisplayName(parsedPaymentData.payment_details)
    }
    if (paymentMethod) {
      return getPaymentDisplayName(paymentMethod as string)
    }
    return 'Payment method not specified'
  }

  // Get total amount with priority order
  const getTotalAmount = (): string => {
    const amount: any = parsedPaymentData?.total_amount || 
                  totalAmount ||
                  parsedRiderData?.eta?.fare_amount
    return formatAmount(amount)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1 px-6">
        {/* Success Animation/Illustration */}
        <View className="items-center justify-center mt-16 mb-8">
          <Image 
            source={require('../../../../assets/images/success.png')}
            style={{ width: 170, height: 170 }}
            resizeMode="contain"
          />
        </View>

        {/* Success Message */}
        <View className="items-center mb-8">
          <Text 
            className="text-2xl font-bold text-neutral-900 mb-3" 
            style={{fontFamily: 'HankenGrotesk_600SemiBold'}}
          >
            Payment Successful! 🎉
          </Text>
          <Text 
            className="text-neutral-600 text-center leading-6 px-10" 
            style={{fontFamily: 'HankenGrotesk_500Medium'}}
          >
            Your payment has been processed successfully. Your rider has been notified and will be on the way shortly.
          </Text>
        </View>

        {/* Payment Status Card */}
        {parsedPaymentData?.status && (
          <View className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <View className="flex-row items-center justify-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <Text 
                className="text-green-700 font-medium text-center" 
                style={{fontFamily: 'HankenGrotesk_600SemiBold'}}
              >
                {parsedPaymentData.status.toUpperCase()}
              </Text>
            </View>
            {parsedPaymentData.message && (
              <Text 
                className="text-green-600 text-center mt-2 text-sm" 
                style={{fontFamily: 'HankenGrotesk_400Regular'}}
              >
                {parsedPaymentData.message}
              </Text>
            )}
          </View>
        )}

        {/* Order Details */}
        <View className="mb-8 pt-5 px-2">
          <Text 
            className="text-lg font-semibold text-gray-900 mb-4" 
            style={{fontFamily: 'HankenGrotesk_600SemiBold'}}
          >
            Order Details
          </Text>
          
          <View className="flex-col gap-4">

            {/* Transaction Reference */}
            {parsedPaymentData?.reference && (
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                  Transaction Ref:
                </Text>
                <Text className="font-medium text-gray-900" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                  {parsedPaymentData.reference}
                </Text>
              </View>
            )}
            
            {/* Expected Delivery */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Expected Delivery:
              </Text>
              <Text className="font-medium text-gray-900" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                {getEstimatedDelivery()}
              </Text>
            </View>
            
            {/* Payment */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Payment:
              </Text>
              <Text className="font-medium text-gray-900" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                {getTotalAmount()} (Paid via {getPaymentMethodText()})
              </Text>
            </View>
          </View>
        </View>

        {/* Success Tips */}
        <View className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <Text 
            className="text-sm font-medium text-orange-700 mb-2" 
            style={{fontFamily: 'HankenGrotesk_600SemiBold'}}
          >
            What happens next?
          </Text>
          <Text className="text-sm text-orange-600 leading-5" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
            • Your rider will contact you when they arrive at pickup{'\n'}
            • You'll receive notifications about delivery progress{'\n'}
            • Track your order in real-time from the order history page
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-4 pb-6 pt-4 bg-white border-t border-gray-100">
        <View className="flex-row justify-between items-center">
          <View className='w-[48%]'>
            <SolidLightButton 
              text='Go back home' 
              onPress={() => {
                router.dismissAll()
                router.replace('/(access)/(user_tabs)/home')
              }} 
            />
          </View>
          <View className='w-[48%]'>
            <SolidMainButton 
              text='Track Parcel' 
              onPress={() => {
                router.dismissAll()
                router.replace('/(access)/(user_stacks)/courier/parcel_history_buyer')
              }} 
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ParcelSuccess