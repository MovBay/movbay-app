import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import LoadingOverlay from '@/components/LoadingOverlay'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useTrackOrders } from '@/hooks/mutations/sellerAuth'

const TrackOrder = () => {
  const [currentOrderStatus, setCurrentOrderStatus] = useState(0)
  const { orderTrackData } = useLocalSearchParams()

  const parsedOrderData = orderTrackData ? JSON.parse(orderTrackData as string) : null
  const orderID = parsedOrderData?.order_id
  const { newTrackOrder, isLoading, refetch } = useTrackOrders(orderID)
  const newOrderTrackData = newTrackOrder?.data
  console.log('This is order track', newOrderTrackData)

  // Refetch data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (orderID) {
        refetch()
      }
    }, [orderID, refetch])
  )

  // Determine order status and update state when API data changes
  useEffect(() => {
    if (newOrderTrackData) {
      const status = determineOrderStatus(newOrderTrackData)
      setCurrentOrderStatus(status)
    }
  }, [newOrderTrackData])

  // Function to determine order status based on API response
  const determineOrderStatus = (trackData: any) => {
    // Check if order is completed/delivered (you may need to add a completed field to your API)
    if (trackData.completed) {
      return 4 // Delivered/Completed
    } else if (trackData.arriving_soon) {
      return 4 // Arriving Soon (also final step)
    } else if (trackData.rider_en_route) {
      return 3 // Rider En Route
    } else if (trackData.item_picked) {
      return 2 // Item Picked Up by Rider
    } else if (trackData.order_accepted) {
      return 1 // Order Accepted by Seller
    } else {
      return 0 // Order is Processing (default state)
    }
  }

  // Get status text based on current status
  const getStatusText = () => {
    if (!newOrderTrackData) return "Loading status..."

    if (newOrderTrackData.completed) {
      return "Order Completed"
    } else if (newOrderTrackData.arriving_soon) {
      return "Order Arriving Soon"
    } else if (newOrderTrackData.rider_en_route) {
      return "Order is Out for Delivery"
    } else if (newOrderTrackData.item_picked) {
      return "Order Picked Up by Rider"
    } else if (newOrderTrackData.order_accepted) {
      return "Order Accepted by Seller"
    } else {
      return "Your Order is Being Processed"
    }
  }

  const orderSteps = [
    {
      id: 0,
      title: 'Order is Processing..',
      icon: <MaterialIcons name='hourglass-empty' size={12} />,
      activeColor: 'bg-green-600',
      inactiveColor: 'bg-gray-200'
    },
    {
      id: 1,
      title: 'Order Accepted by Seller',
      icon: <MaterialIcons name='check' size={12} />,
      activeColor: 'bg-green-600',
      inactiveColor: 'bg-gray-200'
    },
    {
      id: 2,
      title: 'Item Picked Up by Rider',
      icon: <MaterialIcons name='check' size={12} />,
      activeColor: 'bg-green-600',
      inactiveColor: 'bg-gray-200'
    },
    {
      id: 3,
      title: 'Rider En Route to You',
      icon: <MaterialIcons name='directions-bike' size={12} />,
      activeColor: 'bg-green-600',
      inactiveColor: 'bg-gray-200'
    },
    {
      id: 4,
      title: 'Order Delivered',
      icon: <MaterialIcons name='check-circle' size={13} />,
      activeColor: 'bg-green-600',
      inactiveColor: 'bg-gray-200'
    }
  ]

  const CustomRadioButton = ({ step, isActive, isLast }: any) => {
    return (
      <View className="flex-row items-center mb-6">
        <View className="relative">
          {/* Radio Button */}
          <View className={`w-5 h-5 rounded-full items-center justify-center ${
            isActive ? step.activeColor : step.inactiveColor
          }`}>
            <Text className={`text-xs ${
              isActive ? 'text-white' : 'text-gray-500'
            }`}>
              {step.icon}
            </Text>
          </View>
          {/* Connecting Line */}
          {!isLast && (
            <View className={`absolute top-6 left-2 w-0.5 h-6 ${
              isActive ? step.activeColor : 'bg-gray-200'
            }`} />
          )}
        </View>
        <Text className={`ml-3 text-sm ${
          isActive ? 'text-gray-900' : 'text-gray-500'
        }`} style={{
          fontFamily: isActive ? "HankenGrotesk_500Medium" : "HankenGrotesk_400Regular"
        }}>
          {step.title}
        </Text>
      </View>
    )
  }

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    if (orderID) {
      refetch()
    }
  }, [orderID, refetch])

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} />

      {/* Header with optional refresh button */}
      <View className="flex-row items-center gap-2 mb-6 px-4 pt-2">
        <OnboardArrowTextHeader onPressBtn={() => router.back()} />
        <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          Track Order
        </Text>
        <TouchableOpacity
          onPress={handleManualRefresh}
          className="p-2"
          disabled={isLoading}
        >
          <MaterialIcons
            name="refresh"
            size={24}
            color={isLoading ? "#9CA3AF" : "#374151"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Order Illustration */}
        <View className='w-full bg-white rounded-lg p-4 mb-6'>
          <View className='w-full items-center justify-center'>
            <Image
              source={require('../../../assets/images/bike.png')}
              className='w-80 h-48'
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Order Status */}
        <View className="bg-white rounded-lg p-4 mb-2">
          <Text className="text-base mb-4" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            {getStatusText()}
          </Text>

          {/* Status Timeline with Custom Radio Buttons */}
          <View className="">
            {orderSteps.map((step, index) => (
              <CustomRadioButton
                key={step.id}
                step={step}
                isActive={index <= currentOrderStatus}
                isLast={index === orderSteps.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Courier Info Card */}
        <View className="bg-white rounded-lg p-4 mb-6 pt-0 mt-0">
          <Text className="text-base mb-4" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            {newOrderTrackData?.driver ? 'Courier Information' : 'Courier Information (Not assigned yet)'}
          </Text>

          {newOrderTrackData?.driver ? (
            <View className="flex-col gap-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Name:
                </Text>
                <Text className="text-gray-900 text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {newOrderTrackData?.driver?.name || 'Driver Name'}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Vehicle:
                </Text>
                <Text className="text-gray-900 text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {newOrderTrackData?.driver?.vehicle || 'Vehicle Info'}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Phone:
                </Text>
                <Text className="text-gray-900 text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {newOrderTrackData?.driver?.phone || 'Phone Number'}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="text-sm text-gray-600 text-left" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                A courier will be assigned to your order soon. You'll be notified once a driver is assigned.
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Conditionally rendered */}
        {newOrderTrackData?.driver && (
          <View className='flex-row justify-between items-center'>
            <View className='w-[48%]'>
              <SolidLightButton
                text='Message Courier'
                onPress={() => {
                  // Add messaging logic here
                  console.log('Message courier functionality')
                }}
              />
            </View>
            <View className='w-[48%]'>
              <SolidMainButton
                text='Call Courier'
                onPress={() => {
                  // Add calling logic here
                  console.log('Call courier functionality')
                }}
              />
            </View>
          </View>
        )}

        {/* Safety Tip */}
        <View className="bg-red-50 border border-red-200 rounded-2xl p-5 my-6">
          <Text className="text-[#E82728] text-lg mb-0.5" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            Safety Tip
          </Text>
          <Text className="text-red-950 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
            • Verify the package and rider before accepting delivery.
            {newOrderTrackData?.driver && (
              <>
                {'\n'}• Confirm the courier's identity matches the assigned driver information.
              </>
            )}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default TrackOrder