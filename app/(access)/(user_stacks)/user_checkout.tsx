"use client"

import { View, Text, TouchableOpacity, Alert } from "react-native"
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
  const toast = useToast()

  const {mutate, isPending} = useCreateOrder()

  // Delivery fee calculation (you can make this dynamic based on delivery method)
  const deliveryFee = 1200
  const discount = 0 

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
  }, [finalOrderData])

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

  const handlePayment = async () => {
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

      // Structure final API payload according to your required format
      const apiPayload = {
        delivery: parsedOrderData.delivery,
        total_amount: finalTotal,
        items: parsedOrderData.items.map(item => ({
          store: item.store, // Keep as number, not string
          amount: item.amount,
          product: item.product, // Keep as number, not string
          product_name: item.product_name,
          quantity: item.quantity
        })),
        payment_method: paymentData.payment_method,
        provider_name: paymentData.provider_name,
      }

      console.log("Final API Payload:", JSON.stringify(apiPayload, null, 2))

      // Make the API call using your hook
      mutate(apiPayload, {
        onSuccess: (response) => {
          console.log("Order created successfully:", response)
          
          // Show success message
          toast.show("Order placed successfully!", {
            type: "success",
            placement: "top",
          })

          // Navigate to success screen or order confirmation
          Alert.alert("Order Placed Successfully!", "Your order has been placed and will be processed shortly.", [
            {
              text: "View Orders",
              onPress: () => router.push("/"),
            },
            {
              text: "Continue Shopping",
              onPress: () => router.push("/(access)/(user_tabs)/home"),
            },
          ])
        },
        onError: (error) => {
          console.error("Order creation error:", error.message)
          toast.show("Payment failed. Please try again.", {
            type: "error",
            placement: "top",
          })
        },
        onSettled: () => {
          setIsProcessing(false)
        }
      })

    } catch (error) {
      console.error("Payment error:", error)
      toast.show("Payment failed. Please try again.", {
        type: "error",
        placement: "top",
      })
      setIsProcessing(false)
    }
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
            <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
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
            <SolidMainButton text={`Pay ₦${finalTotal.toLocaleString()}`} onPress={handlePayment}/>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default UserCheckout

const styles = StyleSheet.create({
  loadingText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 16,
    color: "#6B7280",
  },
})