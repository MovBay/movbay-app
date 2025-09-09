import { View, Text, TouchableOpacity, Alert, Modal, Animated, Dimensions } from "react-native"
import { useState, useEffect, useRef } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { ScrollView } from "react-native-gesture-handler"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { router, useLocalSearchParams } from "expo-router"
import { useToast } from "react-native-toast-notifications"
import { StyleSheet } from "react-native"
import { useCreateOrder } from "@/hooks/mutations/sellerAuth"
import { useGetWalletDetails } from "@/hooks/mutations/sellerAuth"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import LoadingOverlay from "@/components/LoadingOverlay"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"

// Add push notification imports
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

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
    alternative_phone: string
    postal_code: number
  }
  items: Array<{
    store?: number
    product: number
    amount: number
    quantity: number
    product_name?: string
    delivery_method?: string
    carrier_name?: string
    id?: string
    shiiping_amount?: number
    pickup_address_id?: string
    delivery_address_id?: string
    parcel_id?: string
  }>
  total_amount: number
  cart_summary: {
    total_items: number
    subtotal: number
  }
  shipRateResponse?: {
    movbay_delivery?: Array<{
      store_id: number
      fare: number
      delivery_type: string
    }>
    shiip_delivery?: Array<{
      store_id: number
      delivery_type: string
      details: {
        status: string
        message: string
        data: {
          rates: {
            carrier_name: string
            amount: number
            id: string
            carrier_logo: string
          }
          pickup_address_id: string
          delivery_address_id: string
          parcel_id: string
        }
      }
    }>
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

interface DeliveryItem {
  productName: string
  deliveryMethod: string
  carrierName: string
  fare: number
  storeId: number
  shippingAmount: number
  id?: string
  pickupAddressId?: string
  deliveryAddressId?: string
  parcelId?: string
}

const UserCheckout = () => {
  const { finalOrderData } = useLocalSearchParams()
  const [parsedOrderData, setParsedOrderData] = useState<FinalOrderData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false)
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([])
  const [totalDeliveryFee, setTotalDeliveryFee] = useState(0)
  const toast = useToast()
  const [orderDatas, setOrderDatas] = useState([])
  
  // Animation refs for bottom sheet
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const {mutate, isPending} = useCreateOrder()
  
  // Add wallet data hook
  const {walletData, isLoading: isWalletLoading, refetch} = useGetWalletDetails()

  const discount = 0

  // Enhanced delivery items calculation to handle both old and new data structures
  const calculateDeliveryDetails = (orderData: FinalOrderData) => {
    const items: DeliveryItem[] = []
    let totalFee = 0

    // First, check if items already have delivery_method and shipping info (new structure)
    if (orderData.items && orderData.items.length > 0) {
      const hasDeliveryMethod = orderData.items.some(item => item.delivery_method || item.shiiping_amount)
      
      if (hasDeliveryMethod) {
        // New structure: items contain delivery method info
        orderData.items.forEach(item => {
          if (item.shiiping_amount && item.shiiping_amount > 0) {
            items.push({
              productName: item.product_name || `Product ${item.product}`,
              deliveryMethod: item.delivery_method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Standard Delivery',
              carrierName: item.carrier_name || 'Standard Carrier',
              fare: item.shiiping_amount,
              storeId: item.store || 0,
              shippingAmount: item.shiiping_amount,
              id: item.id || `delivery-${item.store}-${Date.now()}`,
              pickupAddressId: item.pickup_address_id || "N/A",
              deliveryAddressId: item.delivery_address_id || "N/A",
              parcelId: item.parcel_id || "N/A"
            })
            totalFee += item.shiiping_amount
          }
        })
        return { items, totalFee }
      }
    }

    // Fallback to old structure using shipRateResponse
    if (!orderData.shipRateResponse || !orderData.items) return { items: [], totalFee: 0 }

    const { movbay_delivery, shiip_delivery } = orderData.shipRateResponse

    // Create a map of store_id to product info
    const storeProductMap = new Map()
    orderData.items.forEach(item => {
      storeProductMap.set(item.store, {
        product_name: item.product_name,
        quantity: item.quantity,
        amount: item.amount
      })
    })

    // Process Movbay delivery methods
    if (movbay_delivery && movbay_delivery.length > 0) {
      movbay_delivery.forEach((delivery) => {
        const productInfo = storeProductMap.get(delivery.store_id)
        if (productInfo) {
          items.push({
            productName: productInfo.product_name,
            deliveryMethod: "Movbay Dispatch",
            carrierName: "Movbay Dispatch",
            fare: delivery.fare,
            storeId: delivery.store_id,
            shippingAmount: delivery.fare,
            id: `movbay-${delivery.store_id}-${Date.now()}`,
            pickupAddressId: "N/A",
            deliveryAddressId: "N/A",
            parcelId: "N/A"
          })
          totalFee += delivery.fare
        }
      })
    }

    // Process Shiip delivery methods
    if (shiip_delivery && shiip_delivery.length > 0) {
      shiip_delivery.forEach((delivery) => {
        if (delivery.details.status === "success") {
          const productInfo = storeProductMap.get(delivery.store_id)
          if (productInfo) {
            const { rates, pickup_address_id, delivery_address_id, parcel_id } = delivery.details.data
            items.push({
              productName: productInfo.product_name,
              deliveryMethod: delivery.delivery_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              carrierName: rates.carrier_name,
              fare: rates.amount,
              storeId: delivery.store_id,
              shippingAmount: rates.amount,
              id: rates.id || `shiip-${delivery.store_id}-${Date.now()}`,
              pickupAddressId: pickup_address_id || "N/A",
              deliveryAddressId: delivery_address_id || "N/A",
              parcelId: parcel_id || "N/A"
            })
            totalFee += rates.amount
          }
        }
      })
    }

    return { items, totalFee }
  }

  // Calculate final total including delivery
  const finalTotal = parsedOrderData ? parsedOrderData.total_amount + totalDeliveryFee - discount : 0
  
  // Check if wallet has sufficient balance
  const walletBalance = walletData?.data?.balance || 0
  const isWalletBalanceSufficient = walletBalance >= finalTotal

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

  useEffect(() => {
    if (finalOrderData) {
      try {
        const parsed = JSON.parse(finalOrderData as string)
        setParsedOrderData(parsed)
        console.log("Final Order Data:", parsed)
        
        // Calculate delivery details
        const { items, totalFee } = calculateDeliveryDetails(parsed)
        setDeliveryItems(items)
        setTotalDeliveryFee(totalFee)
        
        // Set default payment method based on wallet balance
        const total = parsed.total_amount + totalFee - discount
        if (walletBalance >= total) {
          setSelectedPaymentMethod("movbay")
        } else {
          setSelectedPaymentMethod("card")
        }
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
  }, [finalOrderData, walletBalance])

  // Animate bottom sheet modal
  useEffect(() => {
    if (confirmationModalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [confirmationModalVisible, slideAnim, backdropOpacity])

  // Close confirmation modal
  const closeConfirmationModal = () => {
    setConfirmationModalVisible(false)
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

  // Function to get initials from carrier name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Updated PaymentOption component with wallet balance checking
  const PaymentOption = ({ id, title, subtitle, icon, recommended = false }: any) => {
    const isWalletOption = id === "movbay"
    const isDisabled = isWalletOption && !isWalletBalanceSufficient
    
    return (
      <View className="mb-3">
        <TouchableOpacity
          onPress={() => {
            if (!isDisabled) {
              setSelectedPaymentMethod(id)
            } else {
              toast.show("Insufficient wallet balance", {
                type: "warning",
                placement: "top",
              })
            }
          }}
          disabled={isDisabled}
          className={`flex-row items-center justify-between p-4 border rounded-lg ${
            selectedPaymentMethod === id && !isDisabled 
              ? "border-orange-300" 
              : isDisabled 
                ? "border-gray-200" 
                : "border-gray-200"
          }`}
          
        >
          <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
              isDisabled ? "bg-gray-100" : "bg-gray-100"
            }`}>
              <Text className="text-lg">{icon}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className={`text-base font-medium ${
                  isDisabled ? "text-gray-900" : "text-gray-900"
                }`}>{title}</Text>
                {recommended && !isDisabled && (
                  <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-xs text-green-600 font-medium">Recommended</Text>
                  </View>
                )}
              </View>
              <Text className={`text-sm mt-1 ${
                isDisabled ? "text-gray-500" : "text-gray-500"
              }`}>{subtitle}</Text>
              {isWalletOption && (
                <Text className={`text-xs mt-1 ${
                  isDisabled ? "text-red-600" : "text-green-600"
                }`}>
                  
                  {isWalletOption && !isWalletBalanceSufficient ? 
                    (`Insufficient wallet balance Balance: ₦${walletBalance.toLocaleString()}.`):
                    (`Balance: ₦${walletBalance.toLocaleString()}.`)
                  }
                </Text>
              )}
            </View>
          </View>
          <View
            className={`w-5 h-5 rounded-full border-2 ${
              selectedPaymentMethod === id && !isDisabled 
                ? "border-orange-500 bg-orange-500" 
                : "border-gray-300"
            }`}
          >
            {selectedPaymentMethod === id && !isDisabled && (
              <View className="w-2 h-2 bg-white rounded-full m-auto" />
            )}
          </View>
        </TouchableOpacity>
      </View>
    )
  }

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

    // Additional check for wallet payment
    if (selectedPaymentMethod === "movbay" && !isWalletBalanceSufficient) {
      toast.show("Please select a different payment method", {
        type: "warning",
        placement: "top",
      })
      return
    }

    setConfirmationModalVisible(true)
  }

  // Function to ensure delivery data for each item
  const enrichItemsWithDeliveryData = (items: any[]) => {
    return items.map((item, index) => {
      // Find corresponding delivery item
      const deliveryItem = deliveryItems.find(d => d.storeId === item.store) || deliveryItems[index] || deliveryItems[0]
      
      return {
        store: Number(item.store),
        amount: Number(item.amount),
        product: Number(item.product),
        quantity: Number(item.quantity),
        // Ensure required delivery fields are present
        delivery_method: item.delivery_method || deliveryItem?.deliveryMethod?.toLowerCase().replace(/\s+/g, '_'),
        carrier_name: item.carrier_name || deliveryItem?.carrierName || 'Standard Carrier',
        id: item.id || deliveryItem?.id || `delivery-${item.store || index}-${Date.now()}`,
        shiiping_amount: Number(item.shiiping_amount || deliveryItem?.shippingAmount || 0),
        // Add the new address and parcel ID fields
        pickup_address_id: item.pickup_address_id || deliveryItem?.pickupAddressId || "N/A",
        delivery_address_id: item.delivery_address_id || deliveryItem?.deliveryAddressId || "N/A",
        parcel_id: item.parcel_id || deliveryItem?.parcelId || "N/A"
      }
    })
  }

  // Proceed with payment after confirmation - UPDATED TO MATCH NEW PAYLOAD STRUCTURE
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
      const paymentData = getPaymentMethodData(selectedPaymentMethod)
      const finalTotalInt = Math.round(parsedOrderData.total_amount + totalDeliveryFee - discount)
      
      // Enrich items with delivery data
      const enrichedItems = enrichItemsWithDeliveryData(parsedOrderData.items)
      
      // Build API payload according to the required structure
      const apiPayload = {
        delivery: {
          fullname: parsedOrderData.delivery.full_name,
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
        total_amount: finalTotalInt, // Ensure it's an integer
        items: enrichedItems,
        payment_method: paymentData.payment_method,
        provider_name: paymentData.provider_name,
      }

      console.log("Final API Payload:", JSON.stringify(apiPayload, null, 2))

      mutate(apiPayload, {
        onSuccess: async (response) => {
          console.log("Order created successfully:", response.data)
          setOrderDatas(response.data)
          
          await sendLocalNotification({
            ...response,
            total_amount: finalTotalInt,
          })
          toast.show("Order placed successfully!", {
            type: "success",
            placement: "top",
          })
          
          router.push({
            pathname: "/(access)/(user_stacks)/order-success",
            params: {
              orderData: JSON.stringify(response.data),
              totalAmount: finalTotalInt.toString(),
              paymentMethod: selectedPaymentMethod
            }
          })
        },
        onError: (error) => {
          console.error("Order creation error:", error)
          console.error("Full error details:", {
            data: getErrorMessage(error),
          })

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

  // Payment Confirmation Bottom Sheet Modal
  const PaymentConfirmationModal = () => {
    if (!parsedOrderData) return null
    
    const finalTotal = parsedOrderData.total_amount + totalDeliveryFee - discount
    const paymentDisplay = getPaymentMethodDisplay(selectedPaymentMethod)
    
    return (
      <Modal
        transparent={true}
        visible={confirmationModalVisible}
        animationType="none"
        onRequestClose={closeConfirmationModal}
      >
        <View className="flex-1">
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              opacity: backdropOpacity,
            }}
          />
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 20,
              maxHeight: SCREEN_HEIGHT * 0.85,
            }}
          >
            {/* Handle Bar */}
            <View className="items-center mb-4">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="items-center mb-4">
              <View className="bg-orange-100 p-3 rounded-full mb-3">
                <MaterialIcons name="payment" size={28} color="#F75F15" />
              </View>
              <Text
                className="text-xl font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
              >
                Confirm Payment
              </Text>
              <Text className="text-base text-gray-600 text-center mb-4 px-5" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Please review your order details before proceeding with payment
              </Text>
            </View>

            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
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
                
                {/* Delivery Items */}
                {deliveryItems.map((item, index) => (
                  <View key={`${item.storeId}-${index}`} className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      {item.carrierName} delivery
                    </Text>
                    <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                      ₦{item.fare.toLocaleString()}
                    </Text>
                  </View>
                ))}
                
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

              {/* Delivery Info */}
              <View className="bg-green-50 p-4 rounded-lg mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="location" size={16} color="#10B981" />
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }} numberOfLines={2}>
                      {parsedOrderData.delivery.delivery_address}, {parsedOrderData.delivery.city}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-4">
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
        </View>
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isPending || isProcessing || isWalletLoading}/>
      
      {/* Payment Confirmation Bottom Sheet Modal */}
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
              recommended={isWalletBalanceSufficient}
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

          {/* Delivery Address */}
          <View className="mb-6 p-4 bg-green-50 rounded-lg">
            <Text className="text-lg font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Delivery Address
            </Text>
            <View className="flex-row items-start">
              <Ionicons name="location" size={16} color="green" className="" />
              <View className="flex-row ml-1 gap-2">
                <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  {parsedOrderData.delivery.delivery_address}, {parsedOrderData.delivery.city}, {parsedOrderData.delivery.state}
                </Text>
              </View>
            </View>
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
            
            {/* Individual delivery fees */}
            {deliveryItems.map((item, index) => (
              <View key={`delivery-${item.storeId}-${index}`} className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">{item.carrierName} delivery</Text>
                <Text className="text-sm text-gray-900">₦{item.fare.toLocaleString()}</Text>
              </View>
            ))}
            
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
  initialsLogo: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#F75F15",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },
})