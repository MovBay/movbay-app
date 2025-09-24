import { View, Text, TouchableOpacity, Alert, Modal, Animated, Dimensions, Image } from "react-native"
import { useState, useEffect, useRef } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { ScrollView } from "react-native-gesture-handler"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { router, useLocalSearchParams } from "expo-router"
import { useToast } from "react-native-toast-notifications"
import { StyleSheet } from "react-native"
import { usePayForParcel } from "@/hooks/mutations/sellerAuth"
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
interface Rider {
  riders_id: string
  riders_name: string
  riders_picture: string | null
  rating: number
  vehicle_type: string
  vehicle_color: string
  plate_number?: string
  license?: string
  eta: {
    distance_km: string;
    duration_minutes: string;
    fare_amount: string;
    distance?: string;
  }
  latitude: number
  longitude: number
  ride_count: number
}

interface SummaryData {
  pickupAddress: string;
  dropOffAddress: string;
  recipientPhoneNumber: string;
  recipientName: string;
  alternativeDropOffAddress?: string;
  alternativeRecipientPhoneNumber?: string;
  alternativeRecipientName?: string;
  packageType: string;
  packageDescription: string;
  additionalNotes?: string;
  packageImages: any[];
}

interface PaymentData {
  payment_method: string
  provider_name: string
}

const ParcelCheckout = () => {
  const { riderData, summaryData, packageId } = useLocalSearchParams()
  const [parsedRiderData, setParsedRiderData] = useState<Rider | null>(null)
  const [parsedSummaryData, setParsedSummaryData] = useState<SummaryData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false)
  const toast = useToast()

  
  // Animation refs for bottom sheet
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const {mutate, isPending} = usePayForParcel(packageId)
  const {walletData, isLoading: isWalletLoading, refetch} = useGetWalletDetails()

  const discount = 0
  const fareAmount = parsedRiderData?.eta?.fare_amount ? parseFloat(parsedRiderData?.eta?.fare_amount) : 0
  const finalTotal = fareAmount - discount
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
          title: "Payment Successful! 🎉",
          body: `Your parcel delivery payment of ₦${finalTotal.toLocaleString()} has been processed successfully. Your rider will be notified.`,
          data: {
            packageId: packageId,
            screen: 'parcel-success',
          },
        },
        trigger: null,
      })
    } catch (error) {
      console.error('Error sending local notification:', error)
    }
  }

  useEffect(() => {
    if (riderData) {
      try {
        const parsed = JSON.parse(riderData as string)
        setParsedRiderData(parsed)
        console.log("Rider Data:", parsed)
      } catch (error) {
        console.error("Error parsing rider data:", error)
        toast.show("Error loading rider data", {
          type: "error",
          placement: "top",
        })
      }
    }

    if (summaryData) {
      try {
        const parsed = JSON.parse(summaryData as string)
        setParsedSummaryData(parsed)
        console.log("Summary Data:", parsed)
      } catch (error) {
        console.error("Error parsing summary data:", error)
        toast.show("Error loading summary data", {
          type: "error",
          placement: "top",
        })
      }
    }

    // Set default payment method based on wallet balance
    if (walletBalance >= finalTotal) {
      setSelectedPaymentMethod("movbay")
    } else {
      setSelectedPaymentMethod("card")
    }

    // Register for push notifications on component mount
    registerForPushNotificationsAsync()
  }, [riderData, summaryData, walletBalance, finalTotal])

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
    if (!parsedRiderData || !parsedSummaryData || !packageId) {
      toast.show("Required data not available", {
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

  // Simplified proceed with payment - only sends provider_name and payment_method
  const proceedWithPayment = async () => {
    closeConfirmationModal()
    
    if (!packageId) {
      toast.show("Package ID not available", {
        type: "error",
        placement: "top",
      })
      return
    }

    setIsProcessing(true)

    try {
      const paymentData = getPaymentMethodData(selectedPaymentMethod)
      const apiPayload = {
        provider_name: paymentData.provider_name,
        payment_method: paymentData.payment_method,
      }

      console.log("Payment Payload:", JSON.stringify(apiPayload, null, 2))
      console.log("Package ID:", packageId)

      mutate(apiPayload, {
        onSuccess: async (response) => {
          console.log("Payment successful:", response.data)
          
          await sendLocalNotification({
            ...response,
            total_amount: finalTotal,
          })
          
          toast.show("Payment successful!", {
            type: "success",
            placement: "top",
          })
          
          router.push({
            pathname: "/(access)/(user_stacks)/courier/parcel-success",
            params: {
              paymentData: JSON.stringify(response.data),
              riderData: JSON.stringify(parsedRiderData),
              summaryData: JSON.stringify(parsedSummaryData),
              totalAmount: finalTotal.toString(),
              paymentMethod: selectedPaymentMethod
            }
          })
        },
        onError: (error) => {
          console.error("Payment error:", error)
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
    if (!parsedRiderData || !parsedSummaryData) return null
    
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
                Please review your parcel delivery details before proceeding with payment
              </Text>
            </View>

            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Rider Info */}
              <View className="bg-gray-50 p-4 rounded-lg mb-4">
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    Rider: {parsedRiderData.riders_name}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Vehicle
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    {parsedRiderData.vehicle_color} {parsedRiderData.vehicle_type}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Distance
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    {parsedRiderData.eta.distance_km} km
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Delivery Fee
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    ₦{fareAmount.toLocaleString()}
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
                <View className="mb-2">
                  <Text className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    From: {parsedSummaryData.pickupAddress}
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    To: {parsedSummaryData.dropOffAddress}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Recipient: {parsedSummaryData.recipientName} ({parsedSummaryData.recipientPhoneNumber})
                </Text>
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
                  {"Confirm & Pay"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    )
  }

  if (!parsedRiderData || !parsedSummaryData) {
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
              Parcel Checkout
            </Text>
          </View>

          {/* Rider Info Card */}
          <View className="mb-6 p-4 bg-blue-50 rounded-lg">
            <Text className="text-lg font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Your Rider
            </Text>
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 overflow-hidden">
                {parsedRiderData.riders_picture ? (
                  <Image source={{ uri: parsedRiderData.riders_picture }} className="w-full h-full object-cover" />
                ) : (
                  <View className="w-full h-full justify-center items-center">
                    <MaterialIcons name="person" size={24} color="gray" />
                  </View>
                )}
              </View>
              <View>
                <Text className="text-base font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  {parsedRiderData.riders_name}
                </Text>
                <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  {parsedRiderData.vehicle_color} {parsedRiderData.vehicle_type}
                </Text>
              </View>
            </View>
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

          {/* Delivery Details */}
          <View className="mb-6 p-4 bg-green-50 rounded-lg">
            <Text className="text-lg font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Delivery Details
            </Text>
            <View className="mb-2">
              <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>From:</Text>
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {parsedSummaryData.pickupAddress}
              </Text>
            </View>
            <View className="mb-2">
              <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>To:</Text>
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {parsedSummaryData.dropOffAddress}
              </Text>
            </View>
            <View>
              <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>Recipient:</Text>
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {parsedSummaryData.recipientName} ({parsedSummaryData.recipientPhoneNumber})
              </Text>
            </View>
          </View>

          {/* Order Summary */}
          <View className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Text className="text-lg font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Payment Summary
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Delivery Fee</Text>
              <Text className="text-sm text-gray-900">₦{fareAmount.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Distance</Text>
              <Text className="text-sm text-gray-900">{parsedRiderData.eta.distance_km} km</Text>
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

export default ParcelCheckout

const styles = StyleSheet.create({
  loadingText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
})