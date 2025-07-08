import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'

const OrderSuccess = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1 px-6">
        {/* Success Animation/Illustration */}
        <View className="items-center justify-center mt-16 mb-8">
          <View className="relative">
            {/* Avatar Circle */}
            <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center">
              <View className="w-20 h-20 bg-gray-300 rounded-full items-center justify-center">
                <Text className="text-2xl">👨‍💻</Text>
              </View>
            </View>
            
            {/* Decorative Elements */}
            <View className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full"></View>
            <View className="absolute -top-4 left-2 w-3 h-3 bg-red-500 rounded-full"></View>
            <View className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-sm"></View>
            <View className="absolute -bottom-4 right-2 w-3 h-3 bg-yellow-500 rounded-sm"></View>
            <View className="absolute top-2 -left-6 w-3 h-3 bg-purple-500 rounded-full"></View>
            <View className="absolute -top-6 right-6 w-4 h-4 bg-blue-600 rounded-sm"></View>
            <View className="absolute bottom-6 -right-6 w-3 h-3 bg-yellow-400 rounded-sm"></View>
            <View className="absolute -bottom-6 left-6 w-4 h-4 bg-red-600 transform rotate-45"></View>
          </View>
        </View>

        {/* Success Message */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-3">Order Placed!</Text>
          <Text className="text-gray-600 text-center leading-6 px-4">
            We've received your order. A seller is prepping it now, and your courier will be on the way shortly.
          </Text>
        </View>

        {/* Details Block */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Details Block</Text>
          
          <View className="space-y-4">
            {/* Order Number */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Order Number:</Text>
              <Text className="font-medium text-gray-900">#MOV4829KJA</Text>
            </View>
            
            {/* Expected Delivery */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Expected Delivery:</Text>
              <Text className="font-medium text-gray-900">Today by 4:30 PM</Text>
            </View>
            
            {/* Payment */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Payment:</Text>
              <Text className="font-medium text-gray-900">₦12,800 (Paid via Wallet)</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 pb-6 pt-4 bg-white border-t border-gray-100">
        <View className="flex-row space-x-4">
          {/* Go back home button */}
          <TouchableOpacity 
            className="flex-1 bg-orange-50 py-4 rounded-lg items-center justify-center"
            onPress={() => router.push('/')}
          >
            <Text className="text-orange-600 font-medium">Go back home</Text>
          </TouchableOpacity>
          
          {/* Track Order button */}
          <TouchableOpacity 
            className="flex-1 bg-orange-500 py-4 rounded-lg items-center justify-center"
            onPress={() => router.push('/')}
          >
            <Text className="text-white font-medium">Track Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default OrderSuccess