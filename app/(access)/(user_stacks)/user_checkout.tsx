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
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

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
  selected_couriers: Array<{
    store?: number
    store_name?: string
    product: number
    amount: number
    quantity: number
    product_name?: string
    delivery_method?: string
    carrier_name?: string
    courier_id?: string
    request_token?: string
    service_code?: string
    id?: string
    shiiping_amount?: number
    pickup_address_id?: string
    delivery_address_id?: string
    parcel_id?: string
    selected_courier?: {
      courier_id: string
      service_code: string
      total: number
      products?: Array<{
        product_id: number
        product_name: string
      }>
      free_delivery_products?: Array<{
        product_id: number
        product_name: string
      }>
    }
  }>
  items: Array<{
    product: number
    store: number
    amount: number
    quantity: number
    product_name?: string
    delivery_method?: string
    courier_id?: string
    request_token?: string
    service_code?: string
    shiiping_amount?: number
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
  storeName: string
  shippingAmount: number
  id?: string
  pickupAddressId?: string
  deliveryAddressId?: string
  parcelId?: string
  courierId?: string
  requestToken?: string
  serviceCode?: string
  quantity: number
  amount: number
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
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const {mutate, isPending} = useCreateOrder()
  const {walletData, isLoading: isWalletLoading, refetch} = useGetWalletDetails()

  const discount = 0

  // Enhanced delivery items calculation using selected_couriers
  const calculateDeliveryDetails = (orderData: FinalOrderData) => {
    const items: DeliveryItem[] = []
    let totalFee = 0

    // Use selected_couriers if available
    if (orderData.selected_couriers && orderData.selected_couriers.length > 0) {
      orderData.selected_couriers.forEach((courierData: any) => {
        const selectedCourier = courierData.selected_courier
        const courierProducts = selectedCourier?.products || selectedCourier?.free_delivery_products || []
        
        // Create delivery items for each product under this courier
        courierProducts.forEach((product: any) => {
          // Find the matching item from the items array to get quantity and amount
          const matchingItem = orderData.items?.find((item: any) => 
            item.product === product.product_id || item.product === String(product.product_id)
          )
          
          if (matchingItem) {
            items.push({
              productName: product.product_name || matchingItem.product_name || `Product ${product.product_id}`,
              deliveryMethod: selectedCourier.courier_id.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              carrierName: selectedCourier.courier_id.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              fare: selectedCourier.total || 0,
              storeId: matchingItem.store || 0,
              storeName: courierData.store || `Store ${matchingItem.store || 'N/A'}`,
              shippingAmount: selectedCourier.total || 0,
              id: `delivery-${matchingItem.store}-${product.product_id}`,
              pickupAddressId: "N/A",
              deliveryAddressId: "N/A",
              parcelId: "N/A",
              courierId: selectedCourier.courier_id,
              requestToken: courierData.request_token || "request_token",
              serviceCode: selectedCourier.service_code,
              quantity: matchingItem.quantity,
              amount: matchingItem.amount
            })
          }
        })
        
        // Add the courier's total delivery fee only once per store
        totalFee += selectedCourier.total || 0
      })
    } 

    return { items, totalFee }
  }

  const finalTotal = parsedOrderData ? parsedOrderData.total_amount + totalDeliveryFee - discount : 0
  const walletBalance = walletData?.data?.balance || 0
  const isWalletBalanceSufficient = walletBalance >= finalTotal

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
        
        const { items, totalFee } = calculateDeliveryDetails(parsed)
        setDeliveryItems(items)
        setTotalDeliveryFee(totalFee)
        
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

    registerForPushNotificationsAsync()
  }, [finalOrderData, walletBalance])

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

  const closeConfirmationModal = () => {
    setConfirmationModalVisible(false)
  }

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

  const getPaymentMethodDisplay = (methodId: string) => {
    const displays: { [key: string]: { title: string; icon: string } } = {
      movbay: { title: "MovBay Wallet", icon: "💳" },
      card: { title: "Card Payment", icon: "💳" },
      transfer: { title: "Bank Transfer", icon: "🏦" },
    }
    return displays[methodId] || displays["card"]
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

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

  const getErrorMessage = (error: any): string => {
    if (error?.response?.data) {
      const data = error.response.data
      
      if (data.message) return data.message
      if (data.error) return data.error
      if (data.detail) return data.detail
      
      if (data.errors) {
        if (typeof data.errors === 'string') return data.errors
        if (typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0]
          return Array.isArray(firstError) ? String(firstError[0]) : String(firstError)
        }
      }
      
      if (data.non_field_errors) {
        return Array.isArray(data.non_field_errors) 
          ? data.non_field_errors[0] 
          : data.non_field_errors
      }
      
      return JSON.stringify(data)
    }
    
    if (error?.message) return error.message
    if (typeof error === 'string') return error
    
    return 'An unexpected error occurred'
  }

  const showPaymentConfirmation = () => {
    if (!parsedOrderData) {
      toast.show("Order data not available", {
        type: "error",
        placement: "top",
      })
      return
    }

    if (selectedPaymentMethod === "movbay" && !isWalletBalanceSufficient) {
      toast.show("Please select a different payment method", {
        type: "warning",
        placement: "top",
      })
      return
    }

    setConfirmationModalVisible(true)
  }

  // FIXED: Enhanced function to map items with proper delivery data
  const enrichItemsWithDeliveryData = (items: any[]) => {
    if (!parsedOrderData?.selected_couriers) {
      return items.map(item => ({
        amount: Number(item.amount),
        product: Number(item.product),
        store: Number(item.store),
        quantity: Number(item.quantity),
        delivery_method: item.delivery_method || 'movbay',
        courier_id: item.courier_id || 'DHL Express',
        request_token: item.request_token || 'request_token',
        service_code: item.service_code || 'service_id',
        shiiping_amount: Number(item.shiiping_amount || 0),
      }))
    }

    // Map items with their corresponding courier data
    return items.map(item => {
      // Find the courier data for this item's store
      const courierData = parsedOrderData.selected_couriers.find(
        (courier: any) => courier.store === item.store
      )
      
      const selectedCourier = courierData?.selected_courier
      
      // Determine delivery method based on courier_id
      let deliveryMethod = 'movbay'
      if (selectedCourier?.courier_id) {
        const courierId = selectedCourier.courier_id.toLowerCase()
        if (courierId.includes('ship') || courierId.includes('shiip') || courierId.includes('bubble')) {
          deliveryMethod = 'ship_bubble'
        } else if (courierId.includes('movbay') || courierId.includes('dispatch')) {
          deliveryMethod = 'movbay'
        } else {
          deliveryMethod = 'ship_bubble' // default to ship_bubble for third-party couriers
        }
      }
      
      return {
        amount: Number(item.amount),
        product: Number(item.product),
        store: Number(item.store),
        quantity: Number(item.quantity),
        delivery_method: deliveryMethod,
        courier_id: selectedCourier?.courier_id || 'DHL Express',
        request_token: courierData?.request_token || 'request_token',
        service_code: selectedCourier?.service_code || 'service_id',
        shiiping_amount: Number(selectedCourier?.total || 0),
      }
    })
  }

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
      
      // FIXED: Use the items from parsedOrderData
      const enrichedItems = enrichItemsWithDeliveryData(parsedOrderData.items || [])
      
      // FIXED: Map delivery fields correctly (fullname instead of full_name)
      const apiPayload = {
        delivery: {
          fullname: parsedOrderData.delivery.full_name,
          phone_number: parsedOrderData.delivery.phone_number,
          email: parsedOrderData.delivery.email,
          landmark: parsedOrderData.delivery.landmark,
          delivery_address: parsedOrderData.delivery.delivery_address,
          city: parsedOrderData.delivery.city,
          state: parsedOrderData.delivery.state,
          alternative_address: parsedOrderData.delivery.alternative_address || "",
          alternative_name: parsedOrderData.delivery.alternative_name || "",
          alternative_email: parsedOrderData.delivery.alternative_email || "",
          postal_code: Number(parsedOrderData.delivery.postal_code) || 0
        },
        total_amount: finalTotalInt,
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

  // Product Item Card Component
  const ProductItemCard = ({ item }: { item: DeliveryItem }) => (
    <View className="mb-3 p-3 border border-gray-200 rounded-lg">
      {/* Product Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            {item.productName}
          </Text>
        </View>
        <Text className="text-base font-semibold text-orange-600" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          ₦{item.amount.toLocaleString()}
        </Text>
      </View>

      {/* Delivery Info */}
      <View className="">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Ionicons name="cube-outline" size={12} color="#10B981" />
            <Text className="text-xs text-gray-600 ml-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              Courier:
            </Text>
          </View>
          <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            {item.carrierName}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Ionicons name="pricetag-outline" size={12} color="#10B981" />
            <Text className="text-xs text-gray-600 ml-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              Delivery Fee:
            </Text>
          </View>
          <Text className="text-sm font-semibold text-green-600" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            ₦{item.fare.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  )

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
            <View className="items-center mb-4">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

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
              {/* Products List */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Order Items ({parsedOrderData.cart_summary.total_items})
                </Text>
                {deliveryItems.map((item, index) => (
                  <ProductItemCard key={`modal-${item.storeId}-${index}`} item={item} />
                ))}
              </View>

              {/* Order Summary */}
              <View className="bg-gray-50 p-4 rounded-lg mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Subtotal
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    ₦{parsedOrderData.total_amount.toLocaleString()}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Total Delivery
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    ₦{totalDeliveryFee.toLocaleString()}
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
            <Text className="text-orange-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
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

            {/* Products Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-4" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Order Items ({parsedOrderData.cart_summary.total_items})
            </Text>
            {deliveryItems.map((item, index) => (
              <ProductItemCard key={`${item.storeId}-${index}`} item={item} />
            ))}
          </View>

          {/* Order Summary */}
          <View className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Text className="text-lg font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Order Summary
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Subtotal ({parsedOrderData.cart_summary.total_items} items)
              </Text>
              <Text className="text-sm text-gray-900" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                ₦{parsedOrderData.total_amount.toLocaleString()}
              </Text>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Total Delivery Fee
              </Text>
              <Text className="text-sm text-gray-900" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                ₦{totalDeliveryFee.toLocaleString()}
              </Text>
            </View>
            
            {discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Discount
                </Text>
                <Text className="text-sm text-green-600" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  -₦{discount.toLocaleString()}
                </Text>
              </View>
            )}
            <View className="border-t border-gray-200 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-base font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Total
                </Text>
                <Text className="text-base font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  ₦{finalTotal.toLocaleString()}
                </Text>
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