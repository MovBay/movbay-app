import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'

interface OrderData {
  order_id: string
  expected_delivery: string
  payment_details: string
  total_amount?: number
}

const OrderSuccess = () => {
  const { orderData, totalAmount, paymentMethod } = useLocalSearchParams()
  const [parsedOrderData, setParsedOrderData] = useState<OrderData[] | OrderData | null>(null)
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0)

  useEffect(() => {
    if (orderData) {
      try {
        const parsed = JSON.parse(orderData as string)
        setParsedOrderData(parsed)
        console.log("Order Success Data:", parsed)
      } catch (error) {
        console.error("Error parsing order data:", error)
      }
    }
  }, [orderData])

  // Get payment method display name
  const getPaymentDisplayName = (method: string): string => {
    const paymentMethods: Record<string, string> = {
      movbay: "MovBay Wallet",
      card: "Card Payment",
      transfer: "Bank Transfer",
      wallet: "Wallet",
      bank_transfer: "Bank Transfer"
    }
    return paymentMethods[method] || "Payment"
  }

  // Handle multiple orders (if the response is an array)
  const currentOrder = parsedOrderData && Array.isArray(parsedOrderData) 
    ? parsedOrderData[currentOrderIndex] 
    : parsedOrderData as OrderData

  const hasMultipleOrders = parsedOrderData && Array.isArray(parsedOrderData) && parsedOrderData.length > 1

  const handlePrevOrder = () => {
    if (currentOrderIndex > 0) {
      setCurrentOrderIndex(currentOrderIndex - 1)
    }
  }

  const handleNextOrder = () => {
    if (parsedOrderData && Array.isArray(parsedOrderData) && currentOrderIndex < parsedOrderData.length - 1) {
      setCurrentOrderIndex(currentOrderIndex + 1)
    }
  }

  const formatAmount = (amount: string | number | undefined): string => {
    if (!amount) return 'Amount not available'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `₦${numAmount.toLocaleString()}`
  }

  const getPaymentMethodText = (): string => {
    if (currentOrder?.payment_details) {
      return getPaymentDisplayName(currentOrder.payment_details)
    }
    if (paymentMethod) {
      return getPaymentDisplayName(paymentMethod as string)
    }
    return 'Payment method not specified'
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1 px-6">
        {/* Success Animation/Illustration */}
        <View className="items-center justify-center mt-16 mb-8">
          <Image 
            source={require('../../../assets/images/success.png')}
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
            Order Placed! 🎉
          </Text>
          <Text 
            className="text-neutral-600 text-center leading-6 px-10" 
            style={{fontFamily: 'HankenGrotesk_500Medium'}}
          >
            We've received your order. A seller is prepping it now, and your courier will be on the way shortly.
          </Text>
        </View>

        {/* Multiple Orders Navigation */}
        {hasMultipleOrders && (
          <View className="flex-row items-center justify-between mb-4 px-2">
            <TouchableOpacity 
              onPress={handlePrevOrder}
              disabled={currentOrderIndex === 0}
              className={`px-4 py-2 rounded-lg ${currentOrderIndex === 0 ? 'bg-gray-100' : 'bg-orange-100'}`}
            >
              <Text className={`${currentOrderIndex === 0 ? 'text-gray-400' : 'text-orange-600'}`}>
                Previous
              </Text>
            </TouchableOpacity>
            
            <Text className="text-gray-600" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
              Order {currentOrderIndex + 1} of {(parsedOrderData as OrderData[]).length}
            </Text>
            
            <TouchableOpacity 
              onPress={handleNextOrder}
              disabled={currentOrderIndex === (parsedOrderData as OrderData[]).length - 1}
              className={`px-4 py-2 rounded-lg ${currentOrderIndex === (parsedOrderData as OrderData[]).length - 1 ? 'bg-gray-100' : 'bg-orange-100'}`}
            >
              <Text className={`${currentOrderIndex === (parsedOrderData as OrderData[]).length - 1 ? 'text-gray-400' : 'text-orange-600'}`}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Details Block */}
        <View className="mb-8 pt-5 px-2">
          <Text 
            className="text-lg font-semibold text-gray-900 mb-4" 
            style={{fontFamily: 'HankenGrotesk_600SemiBold'}}
          >
            Order Details
          </Text>
          
          <View className="flex-col gap-4">
            {/* Order Number */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Order Number:
              </Text>
              <Text className="font-medium text-gray-900" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                {currentOrder?.order_id || 'Order ID not available'}
              </Text>
            </View>
            
            {/* Expected Delivery */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Expected Delivery:
              </Text>
              <Text className="font-medium text-gray-900" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                {currentOrder?.expected_delivery || 'Delivery time not available'}
              </Text>
            </View>
            
            {/* Payment */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Payment:
              </Text>
              <Text className="font-medium text-gray-900" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                {formatAmount(Array.isArray(totalAmount) ? totalAmount[0] : totalAmount || currentOrder?.total_amount)} (Paid via {getPaymentMethodText()})
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary for Multiple Orders */}
        {hasMultipleOrders && (
          <View className="mb-8 p-4 bg-gray-50 rounded-lg">
            <Text 
              className="text-lg font-semibold text-gray-900 mb-2" 
              style={{fontFamily: 'HankenGrotesk_600SemiBold'}}
            >
              All Orders Summary
            </Text>
            <Text className="text-sm text-gray-600 mb-2">
              Total Orders: {(parsedOrderData as OrderData[]).length}
            </Text>
            <Text className="text-sm text-gray-600">
              Total Amount: {formatAmount(Array.isArray(totalAmount) ? totalAmount[0] : totalAmount)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-4 pb-6 pt-4 bg-white border-t border-gray-100">
        <View className="flex-row justify-between items-center">
          <View className='w-[48%]'>
            <SolidLightButton text='Go back home' onPress={() =>{router.dismissAll(); router.replace('/(access)/(user_tabs)/home')}} />
          </View>
          <View className='w-[48%]'>
            <SolidMainButton text='Track Order' onPress={() => {router.dismissAll(); router.replace('/(access)/(user_stacks)/order_history_buyer')}} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default OrderSuccess