import { View, Text, Image, Pressable, ScrollView, StyleSheet, Dimensions } from "react-native"
import React, { useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"

const { width: screenWidth } = Dimensions.get("window")

const OrderConfirm = () => {
  const { orderId, orderData } = useLocalSearchParams<{ orderId: string; orderData: string }>()
  
  // Parse the order data
  const order = orderData ? JSON.parse(orderData) : null
  
  if (!order) {
    return (
      <SafeAreaView className="bg-white flex-1 justify-center items-center">
        <Text className="text-lg" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
          No order data found
        </Text>
      </SafeAreaView>
    )
  }

  const totalAmount = order.order_items.reduce((sum: number, item: any) => sum + item.amount, 0)
  const mainProduct = order.order_items[0]?.product
  const mainOrderItem = order.order_items[0]

  const handleChatWithBuyer = () => {
    console.log("Chat with buyer:", order.buyer.username)
  }

  const handleCancelOrder = () => {
    console.log("Cancel order:", order.order_id)
  }

  const handleMarkForDelivery = () => {
    console.log("Mark for delivery:", order.order_id)
  }

  return (
    <SafeAreaView className="bg-white flex-1">
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
                  ₦ {order.order_items.reduce((sum: number, item: any) => sum + item.product.original_price, 0).toLocaleString()}
                </Text>
                <View className="bg-red-100 px-2 py-1 rounded">
                  <Text className="text-red-600 text-sm font-medium">
                    {Math.round(((order.order_items.reduce((sum: number, item: any) => sum + item.product.original_price, 0) - totalAmount) / order.order_items.reduce((sum: number, item: any) => sum + item.product.original_price, 0)) * 100)}%
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                QTY: {order.order_items.reduce((sum: number, item: any) => sum + item.count, 0)}
              </Text>
            </View>

            {/* Rating */}
            <View className="flex-row items-center gap-2 mb-4">
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
            </View>
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
              <Text className="text-base font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Buyer Name:
              </Text>
              <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.buyer.fullname}
              </Text>
            </View>

            {/* Buyer Phone */}
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Buyer Phone Number:
              </Text>
              <Text className="text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.delivery.phone_number}
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
              <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.delivery.delivery_method}
              </Text>
            </View>

            {/* Status */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Status:
              </Text>
              <View className="bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-600 text-base font-medium capitalize" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
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
              <MaterialIcons name="person-2" size={15}/>
              <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.delivery.fullname || order.buyer.fullname}
              </Text>
            </View>

            <View className="flex-row gap-2 items-center">
              <Ionicons name="location" size={15}/>
              <Text className="text-base" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {order.delivery.delivery_address}, {order.delivery.city}, {order.delivery.state}, {order.delivery.postal_code}
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
            <SolidMainButton text="Confirm Order" onPress={handleMarkForDelivery} />
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

export default OrderConfirm