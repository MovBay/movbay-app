import { View, Text, Image, Pressable, ScrollView, StyleSheet, Dimensions } from "react-native"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"

const { width: screenWidth, height: SCREEN_HEIGHT } = Dimensions.get("window")

const OrderTrack = () => {
  const { orderId, orderData } = useLocalSearchParams<{ orderId: string; orderData: string }>()
  const [order, setOrder] = useState<any>(null)

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
    // Navigate to chat screen or open chat modal
  }

  const handleMessageCourier = () => {
    console.log("Message courier for order:", orderId)
    // Navigate to courier chat or open messaging interface
  }

  const handleCallCourier = () => {
    console.log("Call courier for order:", orderId)
    // Initiate phone call to courier
  }

  const handleBackPress = () => {
    router.back()
  }

  // Calculate discount percentage
  const originalPrice = order.order_items.reduce((sum: number, item: any) => sum + item.product.original_price * item.count, 0)
  const discountPercentage = Math.round(((originalPrice - totalAmount) / originalPrice) * 100)

  return (
    <SafeAreaView className="bg-white flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-1 border-b border-gray-100">
        <Pressable onPress={handleBackPress} className="w-10 h-10 rounded-full bg-white items-center justify-center">
          <MaterialIcons name="arrow-back-ios" size={16} color="black" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          Track Order
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Product Image */}
        <View className="bg-gray-100 relative">
          <Image
            source={{ uri: mainProduct?.product_images[0]?.image_url }}
            style={{ width: "100%", height: 300 }}
            resizeMode="cover"
          />
          {/* Image counter */}
          <View className="absolute bottom-3 right-4 bg-black/60 px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              {mainProduct?.product_images?.length || 1}/28
            </Text>
          </View>
        </View>

        {/* Product Details */}
        <View className="px-5 py-4">
          {/* Product Title */}
          <Text className="text-lg font-semibold mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            {mainProduct?.title}
          </Text>

          {/* Price Section */}
          <View className="flex-row items-center gap-3 mb-4">
            <Text className="text-2xl font-bold text-black" style={{ fontFamily: "HankenGrotesk_700Bold" }}>
              ₦ {totalAmount.toLocaleString()}
            </Text>
            <Text className="text-base line-through text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              ₦ {originalPrice.toLocaleString()}
            </Text>
            <Text className="text-sm font-medium ml-auto" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              QTY: {order.order_items.reduce((sum: number, item: any) => sum + item.count, 0)}
            </Text>
          </View>

          {/* Rating and Date */}
          {/* <View className="flex-row items-center gap-2 mb-6">
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

        {/* Order Information */}
        <View className="px-5 py-4 border-t border-gray-200">
          <View className="flex-col gap-4">
            {/* Order ID */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Order ID:
              </Text>
              <Text className="text-base font-semibold text-black" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                {order.order_id}
              </Text>
            </View>

            {/* Buyer Name */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Buyer Name:
              </Text>
              <Text className="text-base font-medium text-black" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.buyer.fullname}
              </Text>
            </View>

            {/* Buyer Phone Number */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Buyer Phone Number:
              </Text>
              <Text className="text-base font-medium text-black" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.buyer.phone_number}
              </Text>
            </View>

            {/* Status */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Status
              </Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text
                  className="text-green-600 text-sm font-medium"
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                >
                  Out for delivery
                </Text>
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
                    {order.delivery[0].delivery_address}, {order.delivery[0].city}, {order.delivery[0].state},{" "}
                    {order.delivery[0].postal_code}
                    </Text>
                </View>
                <Text className="text-base text-black" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Landmark: {!order.delivery.landmark ? "N/A" : order.delivery.landmark}
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
          </View>
        </View>

        {/* Chat with Buyer */}
        <View className="px-5 py-4 border-t border-gray-200">
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

      {/* Fixed Bottom Action Buttons */}
      <View style={styles.fixedBottomContainer} className="bg-white border-t border-gray-200">
        <View className="flex-row gap-3 justify-center">
          {/* Message Courier Button */}
          <View className="w-[48%]">
            <Pressable
              onPress={handleCallCourier}
              className="flex-row items-center justify-center gap-2 bg-gray-100 p-4 rounded-full"
            >
              <Ionicons name="chatbubble-outline" size={20} color="black" />
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Call Courier
              </Text>
            </Pressable>
          </View>

          {/* Call Courier Button */}
          <View className="w-[48%]">
            <SolidMainButton
              text="Mark as Delivered"
              onPress={handleCallCourier}
            />
          </View>
        </View>
      </View>
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

export default OrderTrack