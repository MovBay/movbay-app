"use client"

import { View, Text, Image, Pressable, ScrollView, StyleSheet, Dimensions, Modal } from "react-native"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { useComfirmOrder } from "@/hooks/mutations/sellerAuth"
import LoadingOverlay from "@/components/LoadingOverlay"

const { width: screenWidth, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Error Modal Component without animations
const ErrorModal = ({ visible, onClose, error }: any) => {
  if (!visible) return null
  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1">
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
            maxHeight: SCREEN_HEIGHT * 0.7,
          }}
        >
          {/* Handle Bar */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>
          {/* Error Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="error" size={32} color="#EF4444" />
            </View>
          </View>
          {/* Content */}
          <ScrollView className="flex-1 mb-6">
            <View className="items-center mb-6">
              <Text
                className="text-xl font-semibold mb-2 text-center"
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
              >
                Order Confirmation Failed
              </Text>
              <Text className="text-gray-600 text-center px-10" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Your Order Confirmation failed, Please try again or reach out to our customer care.
              </Text>
              <View className="w-full bg-gray-50 p-4 rounded-lg mb-4">
                {error?.response?.data && (
                  <View className="mt-2">
                    <Text className="text-sm font-medium mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                      Response Data:
                    </Text>
                    <Text className="text-sm text-gray-700" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      {JSON.stringify(error.response.data, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
          {/* Button */}
          <View className="w-full">
            <SolidMainButton text="Close" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Success Modal Component without animations
const SuccessModal = ({ visible, onClose, orderId }: any) => {
  if (!visible) return null
  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1">
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
          }}
        >
          {/* Handle Bar */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>
          {/* Success Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="check-circle" size={32} color="#10B981" />
            </View>
          </View>
          {/* Content */}
          <View className="items-center mb-6">
            <Text
              className="text-xl font-semibold mb-2 text-center"
              style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
            >
              Order Confirmed Successfully!
            </Text>
            <Text className="text-gray-600 text-center px-10" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Your order has been confirmed and moved to processing. The buyer will be notified.
            </Text>
            <Text
              className="text-sm text-gray-500 mt-5 mb-5 text-center"
              style={{ fontFamily: "HankenGrotesk_400Regular" }}
            >
              Order ID: {orderId}
            </Text>
          </View>
          {/* Button */}
          <View className="w-full">
            <SolidMainButton text="Continue" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const OrderConfirm = () => {
  const { orderId, orderData } = useLocalSearchParams<{ orderId: string; orderData: string }>()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)

  const { mutate: confirmOrder, isPending } = useComfirmOrder(orderId)

  console.log('This is new datas', order)


  useEffect(() => {
    if (orderData) {
      setOrder(JSON.parse(orderData))
    }
  }, [orderData])

  if (!order) {
    return (
      <SafeAreaView className="bg-white flex-1 justify-center items-center">
        <Text className="text-lg" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
          No order data found
        </Text>
      </SafeAreaView>
    )
  }

  // Calculate totalAmount based on discounted_price * quantity
  const totalAmount = order.order_items.reduce(
    (sum: number, item: any) => sum + item.product.discounted_price * item.count,
    0,
  )

  const mainProduct = order.order_items[0]?.product
  const mainOrderItem = order.order_items[0]

  const handleChatWithBuyer = () => {
    console.log("Chat with buyer:", order.buyer.username)
  }

  const handleCancelOrder = () => {
    console.log("Cancel order:", order.order_id)
  }

  const handleConfirmOrder = () => {
    console.log("🔍 Attempting to confirm order:", orderId)
    console.log("🔍 Order data:", order)

    confirmOrder(
      {},
      {
        onSuccess: (data) => {
          console.log("✅ Order confirmed successfully:", data)
          setShowSuccessModal(true)
        },
        onError: (error) => {
          console.error("❌ Error confirming order:", error)
          console.error("❌ Error details:", {
            message: error?.message,
            data: (error as any)?.response?.data.data.message,
          })
          setErrorDetails((error as any)?.response?.data)
          setShowErrorModal(true)
        },
      },
    )
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    router.push("/(access)/(user_tabs)/(drawer)/orders")
  }

  const handleErrorModalClose = () => {
    setShowErrorModal(false)
    setErrorDetails(null)
  }

  const handleBackPress = () => {
    router.back()
  }

  return (
    <SafeAreaView className="bg-white flex-1">
      <LoadingOverlay visible={isPending} />

      <View className="flex-row items-center px-4 py-1 border-b border-gray-100">
        <Pressable onPress={handleBackPress} className="w-10 h-10 rounded-full bg-white items-center justify-center">
          <MaterialIcons name="arrow-back-ios" size={16} color="black" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          New Order
        </Text>
        <View className="w-10" />
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="">
          <View className="bg-gray-100 mb-4 relative">
            <Image
              source={{ uri: mainProduct?.product_images[0]?.image_url }}
              style={{ width: "100%", height: 310 }}
              resizeMode="cover"
              className=""
            />
            {/* Image counter */}
            <View className="absolute bottom-3 right-6 bg-black/50 px-2 py-1 rounded-full">
              <Text className="text-white text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {mainProduct?.product_images?.length || 1}/{mainProduct?.product_images?.length || 1}
              </Text>
            </View>
          </View>
          <View className="px-5 py-5">
            {/* Product Title */}
            <Text className="text-lg font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              {mainProduct?.title}
            </Text>
            {/* Price and Quantity */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold" style={{ fontFamily: "HankenGrotesk_700Bold" }}>
                  ₦ {totalAmount.toLocaleString()}
                </Text>
                <Text className="text-sm line-through text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  ₦{" "}
                  {order.order_items
                    .reduce((sum: number, item: any) => sum + item.product.original_price, 0)
                    .toLocaleString()}
                </Text>
                {/* Removed discount percentage display */}
              </View>
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                QTY: {order.order_items.reduce((sum: number, item: any) => sum + item.count, 0)}
              </Text>
            </View>
            {/* Rating */}
            {/* <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-row">
                {[1, 2, 3, 4].map((star) => (
                  <MaterialIcons key={star} name="star" size={16} color="#FBBC05" />
                ))}
                <MaterialIcons name="star-border" size={16} color="#FBBC05" />
              </View>
              <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                (1,020)
              </Text>
              <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                May 19, 2025 | 7:14 am
              </Text>
            </View> */}
          </View>
        </View>
        {/* Order Details */}
        <View className="px-5 py-4 border-t border-gray-200">
          <View className="flex-col gap-4">
            {/* Order ID */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Order ID:
              </Text>
              <Text className="text-base font-bold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                {order.order_id}
              </Text>
            </View>
            {/* Buyer Name */}
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Buyer Name:
              </Text>
              <Text className="text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.buyer.fullname}
              </Text>
            </View>
            {/* Buyer Phone */}
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Buyer Phone Number:
              </Text>
              <Text className="text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.buyer.phone_number}
              </Text>
            </View>
            {/* Color Variation */}
            {mainProduct?.size && (
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  Size:
                </Text>
                <Text className="text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {mainProduct.size}
                </Text>
              </View>
            )}
            {/* Delivery Option */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Delivery Option:
              </Text>
              {order.delivery[0].delivery_method === 'movbay_dispatch' && 
                <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  Movbay Dispatch
                </Text>
              }
            </View>
            {/* Status */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Status:
              </Text>
              <View className="bg-orange-100 px-3 py-1 rounded-full">
                <Text
                  className="text-orange-600 text-sm font-medium capitalize"
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                >
                  {order.status}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Delivery Address */}
        <View className="px-5 py-4 border-t border-gray-200">
          <Text className="text-lg font-semibold mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            Delivery Address
          </Text>
          <View className="bg-orange-50 p-5 rounded-lg flex-col gap-2">
            <View className="flex-row gap-2 items-center ">
              <MaterialIcons name="person-2" size={15} />
              <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.delivery.fullname || order.buyer.fullname}
              </Text>
            </View>
            <View className="flex-row gap-2 items-center">
              <Ionicons name="location" size={15} />
              <Text className="text-base" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {order.delivery[0].delivery_address}, {order.delivery[0].city}, {order.delivery[0].state}
              </Text>
            </View>
            <Text className="text-base text-black" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Landmark: {order.delivery.landmark}
            </Text>
          </View>
        </View>
        {/* All Order Items */}
        {order.order_items.length > 1 && (
          <View className="px-5 py-4 border-t border-gray-200">
            <Text className="text-lg font-semibold mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              All Items ({order.order_items.length})
            </Text>
            {order.order_items.map((item: any, index: number) => (
              <View key={index} className="flex-row items-center mb-3 p-3 bg-gray-50 rounded-lg">
                <Image
                  source={{ uri: item.product.product_images[0]?.image_url }}
                  style={{ width: 60, height: 60 }}
                  resizeMode="cover"
                  className="rounded-lg"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                    {item.product.title}
                  </Text>
                  <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Qty: {item.count}
                  </Text>
                  <Text className="text-sm font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    ₦ {item.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {/* Chat with Buyer Button */}
        <View className="px-5 py-4">
          <Pressable
            onPress={handleChatWithBuyer}
            className="flex-row items-center justify-center gap-2 bg-gray-100 p-4 rounded-full"
          >
            <Ionicons name="chatbubble-outline" size={20} color="black" />
            <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              Chat with Buyer
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      {/* Fixed Bottom Buttons */}
      <View style={styles.fixedBottomContainer} className="bg-white border-t border-gray-200">
        <View className="flex-row gap-3 justify-center">
          <View className="w-[48%]">
            <SolidLightButton text="Reject Order" onPress={handleCancelOrder} />
          </View>
          <View className="w-[48%]">
            <SolidMainButton text={"Confirm Order"} onPress={handleConfirmOrder} />
          </View>
        </View>
      </View>
      {/* Success Modal */}
      <SuccessModal visible={showSuccessModal} onClose={handleSuccessModalClose} orderId={order.order_id} />
      {/* Error Modal */}
      <ErrorModal visible={showErrorModal} onClose={handleErrorModalClose} error={errorDetails} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fixedBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
})

export default OrderConfirm
