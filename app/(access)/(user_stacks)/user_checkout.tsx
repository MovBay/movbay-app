import { View, Text, TouchableOpacity, Alert, Modal } from "react-native"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { ScrollView } from "react-native-gesture-handler"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { router, useLocalSearchParams } from "expo-router"
import { useToast } from "react-native-toast-notifications"
import { StyleSheet } from "react-native"
import { useCreateOrder } from "@/hooks/mutations/sellerAuth"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import LoadingOverlay from "@/components/LoadingOverlay"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from "react-native-reanimated"

// Add push notification imports
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Types
interface FinalOrderData {
  delivery: {
    delivery_method: string
    full_name: string
    phone_number: string
    email: string
    landmark: string
    delivery_address: string
    city: string
    state: string
    alternative_address: string
    alternative_name: string
    alternative_email: string
    postal_code: number
  }
  items: Array<{
    store?: number
    product: number
    amount: number
    quantity: number
    product_name?: string
  }>
  total_amount: number
  cart_summary: {
    total_items: number
    subtotal: number
  }
  metadata?: {
    saveForNextTime: boolean
    processedAt: string
    screen: string
  }
}

interface PaymentData {
  payment_method: string
  provider_name: string
}

const UserCheckout = () => {
  const { finalOrderData } = useLocalSearchParams()
  const [parsedOrderData, setParsedOrderData] = useState<FinalOrderData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("movbay")
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false)
  const toast = useToast()
  const [orderDatas, setOrderDatas] = useState([])
  
  // Animation values for confirmation modal
  const confirmationModalOpacity = useSharedValue(0)
  const confirmationModalScale = useSharedValue(0.8)

  const {mutate, isPending} = useCreateOrder()

  const deliveryFee = 1200
  const discount = 0 

  // Push notification functions
  const registerForPushNotificationsAsync = async () => {
    let token
    
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!')
        return
      }
      
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    } else {
      console.log('Must use physical device for Push Notifications')
    }
    
    return token?.data
  }

  const sendLocalNotification = async (orderData: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Order Placed Successfully! 🎉",
          body: `Your order of ₦${orderData.total_amount.toLocaleString()} has been placed successfully. We'll notify you when it's ready for delivery.`,
          data: {
            orderId: orderData.id,
            screen: 'order-success',
          },
        },
        trigger: null,
      })
    } catch (error) {
      console.error('Error sending local notification:', error)
    }
  }

  // Optional: Send push notification to server (for remote notifications)
  const sendPushNotificationToServer = async (orderData: any, pushToken: string) => {
    try {
      // Replace with your actual server endpoint
      const response = await fetch('YOUR_SERVER_ENDPOINT/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pushToken,
          title: "Order Placed Successfully!",
          body: `Your order #${orderData.id} has been placed successfully.`,
          data: {
            orderId: orderData.id,
            screen: 'order-success',
          },
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send push notification')
      }
    } catch (error) {
      console.error('Error sending push notification to server:', error)
    }
  }

  useEffect(() => {
    if (finalOrderData) {
      try {
        const parsed = JSON.parse(finalOrderData as string)
        setParsedOrderData(parsed)
        console.log("Final Order Data:", parsed)
      } catch (error) {
        console.error("Error parsing final order data:", error)
        toast.show("Error loading order data", {
          type: "error",
          placement: "top",
        })
      }
    }

    // Register for push notifications on component mount
    registerForPushNotificationsAsync()
  }, [finalOrderData])

  // Animate confirmation modal
  useEffect(() => {
    if (confirmationModalVisible) {
      confirmationModalOpacity.value = withTiming(1, { duration: 200 })
      confirmationModalScale.value = withSpring(1, { damping: 15, stiffness: 150 })
    }
  }, [confirmationModalVisible])

  // Animated styles for confirmation modal
  const confirmationModalBackdropStyle = useAnimatedStyle(() => ({
    opacity: confirmationModalOpacity.value,
  }))

  const confirmationModalContentStyle = useAnimatedStyle(() => ({
    opacity: confirmationModalOpacity.value,
    transform: [{ scale: confirmationModalScale.value }],
  }))

  // Close confirmation modal with smooth animation
  const closeConfirmationModal = () => {
    confirmationModalOpacity.value = withTiming(0, { duration: 200 })
    confirmationModalScale.value = withTiming(0.8, { duration: 200 })
    setTimeout(() => {
      setConfirmationModalVisible(false)
    }, 200)
  }

  // Payment method mapping
  const getPaymentMethodData = (methodId: string): PaymentData => {
    const paymentMethods: { [key: string]: PaymentData } = {
      movbay: {
        payment_method: "wallet",
        provider_name: "movbay",
      },
      card: {
        payment_method: "card",
        provider_name: "paystack",
      },
      transfer: {
        payment_method: "bank_transfer",
        provider_name: "paystack",
      },
    }
    return paymentMethods[methodId] || paymentMethods["card"]
  }

  // Get payment method display info
  const getPaymentMethodDisplay = (methodId: string) => {
    const displays: { [key: string]: { title: string; icon: string } } = {
      movbay: { title: "MovBay Wallet", icon: "💳" },
      card: { title: "Card Payment", icon: "💳" },
      transfer: { title: "Bank Transfer", icon: "🏦" },
    }
    return displays[methodId] || displays["card"]
  }

  const PaymentOption = ({ id, title, subtitle, icon, recommended = false }: any) => (
    <TouchableOpacity
      onPress={() => setSelectedPaymentMethod(id)}
      className={`flex-row items-center justify-between p-4 border rounded-lg mb-3 ${
        selectedPaymentMethod === id ? "border-orange-500" : "border-gray-200"
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
          <Text className="text-lg">{icon}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-medium text-gray-900">{title}</Text>
            {recommended && (
              <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-green-600 font-medium">Recommended</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
        </View>
      </View>
      <View
        className={`w-5 h-5 rounded-full border-2 ${
          selectedPaymentMethod === id ? "border-orange-500 bg-orange-500" : "border-gray-300"
        }`}
      >
        {selectedPaymentMethod === id && <View className="w-2 h-2 bg-white rounded-full m-auto" />}
      </View>
    </TouchableOpacity>
  )

  // Enhanced error handling function
  const getErrorMessage = (error: any): string => {
    // Check if error has response data (common with axios)
    if (error?.response?.data) {
      const data = error.response.data
      
      // Check for specific error message
      if (data.message) return data.message
      if (data.error) return data.error
      if (data.detail) return data.detail
      
      // Check for field-specific errors
      if (data.errors) {
        if (typeof data.errors === 'string') return data.errors
        if (typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0]
          return Array.isArray(firstError) ? String(firstError[0]) : String(firstError)
        }
      }
      
      // Check for validation errors
      if (data.non_field_errors) {
        return Array.isArray(data.non_field_errors) 
          ? data.non_field_errors[0] 
          : data.non_field_errors
      }
      
      // Return stringified data if no specific message found
      return JSON.stringify(data)
    }
    
    // Check if error has a message property
    if (error?.message) return error.message
    
    // Check if error is a string
    if (typeof error === 'string') return error
    
    // Default fallback
    return 'An unexpected error occurred'
  }

  // Show confirmation modal before payment
  const showPaymentConfirmation = () => {
    if (!parsedOrderData) {
      toast.show("Order data not available", {
        type: "error",
        placement: "top",
      })
      return
    }
    setConfirmationModalVisible(true)
  }

  // Proceed with payment after confirmation
  const proceedWithPayment = async () => {
    closeConfirmationModal()
    
    if (!parsedOrderData) {
      toast.show("Order data not available", {
        type: "error",
        placement: "top",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Get payment method data
      const paymentData = getPaymentMethodData(selectedPaymentMethod)

      // Calculate final total
      const finalTotal = parsedOrderData.total_amount + deliveryFee - discount

      // Structure final API payload exactly as your backend expects
      const apiPayload = {
        delivery: {
          delivery_method: parsedOrderData.delivery.delivery_method,
          full_name: parsedOrderData.delivery.full_name,
          phone_number: parsedOrderData.delivery.phone_number,
          email: parsedOrderData.delivery.email,
          landmark: parsedOrderData.delivery.landmark,
          delivery_address: parsedOrderData.delivery.delivery_address,
          city: parsedOrderData.delivery.city,
          state: parsedOrderData.delivery.state,
          alternative_address: parsedOrderData.delivery.alternative_address,
          alternative_name: parsedOrderData.delivery.alternative_name,
          alternative_email: parsedOrderData.delivery.alternative_email,
          postal_code: Number(parsedOrderData.delivery.postal_code) || 0
        },
        total_amount: finalTotal,
        items: parsedOrderData.items.map(item => ({
          store: Number(item.store), // Ensure it's a number
          amount: Number(item.amount), // Ensure it's a number
          product: Number(item.product), // Ensure it's a number
          product_name: item.product_name,
          quantity: Number(item.quantity) // Ensure it's a number
        })),
        payment_method: paymentData.payment_method,
        provider_name: paymentData.provider_name,
      }

      console.log("Final API Payload:", JSON.stringify(apiPayload, null, 2))

      // Make the API call using your hook
      mutate(apiPayload, {
        onSuccess: async (response) => {
          console.log("Order created successfully:", response.data)
          setOrderDatas(response.data)
          
          // Send local push notification
          await sendLocalNotification({
            ...response,
            total_amount: finalTotal,
          })
          
          // Optional: Send push notification via server
          // const pushToken = await registerForPushNotificationsAsync()
          // if (pushToken) {
          //   await sendPushNotificationToServer(response, pushToken)
          // }
          
          // Show success message
          toast.show("Order placed successfully!", {
            type: "success",
            placement: "top",
          })
          
          // Pass order data to success screen
          router.push({
            pathname: "/(access)/(user_stacks)/order-success",
            params: {
              orderData: JSON.stringify(response.data),
              totalAmount: finalTotal.toString(),
              paymentMethod: selectedPaymentMethod
            }
          })
        },
        onError: (error) => {
          console.error("Order creation error:", error)
          
          // Log the full error for debugging
          console.error("Full error details:", {
            data: getErrorMessage(error),
          })

          
          // Show specific error message to user
         toast.show(getErrorMessage(error), {
          type: "danger", 
          placement: "top",
        })
        },
        onSettled: () => {
          setIsProcessing(false)
        }
      })

    } catch (error) {
      console.error("Payment error:", error)
      const errorMessage = getErrorMessage(error)
      
      toast.show(errorMessage, {
        type: "error",
        placement: "top",
        duration: 5000,
      })
      setIsProcessing(false)
    }
  }

  // Payment Confirmation Modal
  const PaymentConfirmationModal = () => {
    if (!parsedOrderData) return null
    
    const finalTotal = parsedOrderData.total_amount + deliveryFee - discount
    const paymentDisplay = getPaymentMethodDisplay(selectedPaymentMethod)
    
    return (
      <Modal
        animationType="none"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={closeConfirmationModal}
      >
        <Animated.View 
          style={[confirmationModalBackdropStyle]}
          className="flex-1 justify-center items-center bg-black/50"
        >
          <Animated.View
            style={[confirmationModalContentStyle]}
            className="bg-white rounded-2xl p-6 mx-5 w-[90%] max-w-md"
          >
            <View className="items-center mb-4">
              <View className="bg-orange-100 p-3 rounded-full mb-3">
                <MaterialIcons name="payment" size={28} color="#F75F15" />
              </View>
              <Text
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
              >
                Confirm Payment
              </Text>
              <Text className="text-base text-gray-600 text-center mb-4 px-5" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Please review your order details before proceeding with payment
              </Text>
            </View>

            {/* Order Summary */}
            <View className="bg-gray-50 p-4 rounded-lg mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Items ({parsedOrderData.cart_summary.total_items})
                </Text>
                <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  ₦{parsedOrderData.total_amount.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Delivery to {parsedOrderData.delivery.city}
                </Text>
                <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  ₦{deliveryFee.toLocaleString()}
                </Text>
              </View>
              <View className="border-t border-gray-200 pt-2 mt-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    Total Amount
                  </Text>
                  <Text className="text-lg font-bold text-orange-600" style={{ fontFamily: "HankenGrotesk_700Bold" }}>
                    ₦{finalTotal.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Method */}
            <View className="bg-gray-50 p-4 rounded-lg mb-6">
              <View className="flex-row items-center">
                <Text className="text-base mr-2">{paymentDisplay.icon}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    {paymentDisplay.title}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Info */}
            <View className="bg-green-50 p-4 rounded-lg mb-6">
              <View className="flex-row items-center">
                <Ionicons name="location" size={16} color="#10B981" />
                <View className="flex-1 ml-2">
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }} numberOfLines={2}>
                    {parsedOrderData.delivery.delivery_address}, {parsedOrderData.delivery.city}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={closeConfirmationModal}
                className="flex-1 bg-gray-100 py-3 rounded-full items-center"
              >
                <Text className="text-gray-700 font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={proceedWithPayment}
                className="flex-1 bg-[#F75F15] py-3 rounded-full items-center"
                disabled={isProcessing}
              >
                <Text className="text-white font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  {isProcessing ? "Processing..." : "Confirm & Pay"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    )
  }

  if (!parsedOrderData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <Text style={styles.loadingText}>Loading checkout details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const finalTotal = parsedOrderData.total_amount + deliveryFee - discount

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isPending || isProcessing}/>
      
      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal />

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 2,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center gap-2 mb-6">
            <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Checkout
            </Text>
          </View>

          {/* Payment Methods */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-4" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Payment Method
            </Text>
            <PaymentOption
              id="movbay"
              title="MovBay Wallet"
              subtitle="Make payment from in app wallet and earn"
              icon="💳"
              recommended={true}
            />
            <PaymentOption id="card" title="Card Payment" subtitle="Make payment with bank debit cards" icon="💳" />
            <PaymentOption id="transfer" title="Bank Transfer" subtitle="Make payment with bank transfer" icon="🏦" />
          </View>

          {/* Promotional Message */}
          <View className="bg-orange-50 p-4 rounded-lg mb-6">
            <Text className="text-orange-600 text-sm">
              Pay with wallet or card in MovBay—fast, safe, and fully protected!
            </Text>
          </View>

          {/* Order Summary */}
          <View className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Text className="text-lg font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Order Summary
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Items ({parsedOrderData.cart_summary.total_items})</Text>
              <Text className="text-sm text-gray-900">₦{parsedOrderData.total_amount.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Delivery to {parsedOrderData.delivery.city}</Text>
              <Text className="text-sm text-gray-900">₦{deliveryFee.toLocaleString()}</Text>
            </View>
            {discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Discount</Text>
                <Text className="text-sm text-green-600">-₦{discount.toLocaleString()}</Text>
              </View>
            )}
            <View className="border-t border-gray-200 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-base font-semibold">Total</Text>
                <Text className="text-base font-semibold">₦{finalTotal.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Pay Button at Bottom */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
            <SolidMainButton text={`Pay ₦${finalTotal.toLocaleString()}`} onPress={showPaymentConfirmation}/>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default UserCheckout

const styles = StyleSheet.create({
  loadingText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
})