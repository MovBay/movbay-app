import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Animated, Dimensions, PanResponder, RefreshControl } from 'react-native'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { router, useFocusEffect } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useGetUserCompletedParcelOrders, useGetUserOngoingParcelOrders } from '@/hooks/mutations/sellerAuth'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Custom Bottom Sheet Component for Parcel Details
const ParcelDetailsBottomSheet = ({ visible, onClose, parcel }: any) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
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
  }, [visible])

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0 && gestureState.vy > 0
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy)
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        onClose()
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start()
      }
    },
  })

  if (!visible || !parcel) return null

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
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
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

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
            maxHeight: SCREEN_HEIGHT * 0.8,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          {...panResponder.panHandlers}
        >
          {/* Handle Bar */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className="text-xl font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Parcel Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-lg mr-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Parcel Information */}
          <ScrollView className="px-4 mb-4" showsVerticalScrollIndicator={false}>
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-white rounded-lg mr-3 overflow-hidden items-center justify-center">
                    <View className="bg-orange-100 rounded-full p-2">
                        <Ionicons name="pizza" size={24} color="#F75F15" />
                    </View>
                </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-medium mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                    {parcel.package_type}
                  </Text>
                  <Text className="text-xs text-gray-600 mb-2" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    {parcel.package_description}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-black" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                      ₦{(parcel.amount || parcel.price)?.toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      {new Date(parcel.createdAt || parcel.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Pickup Information */}
            <View className="p-4 mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Pickup Information
              </Text>
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="location" size={15} color="#4B5563" />
                <Text className="text-sm text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  From: {parcel.pick_address || 'N/A'}
                </Text>
              </View>
              <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Contact: {parcel.sender.phone_number || 'N/A'}
              </Text>
            </View>

            {/* Delivery Information */}
            <View className="bg-blue-50 rounded-xl p-4 mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Delivery Information
              </Text>
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="location-sharp" size={15} color="#4B5563" />
                <Text className="text-sm text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  To: {parcel.drop_address || 'N/A'}
                </Text>
              </View>
              <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Contact: {parcel.alternative_number || 'N/A'}
              </Text>
            </View>

            {/* Driver Information */}
            {(parcel.driver || parcel.assigned_driver) && (
              <View className="bg-purple-50 rounded-xl p-4 mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Driver Information
                </Text>
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="person" size={15} color="#4B5563" />
                  <Text className="text-sm text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                    {parcel.driver?.name || parcel.assigned_driver?.name || 'Not assigned yet'}
                  </Text>
                </View>
                {(parcel.driver?.phone || parcel.assigned_driver?.phone) && (
                  <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Phone: {parcel.driver?.phone || parcel.assigned_driver?.phone}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View className="px-4">
            <SolidMainButton text="Close" onPress={() => {
              onClose()
            }} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const ParcelHistoryBuyer = () => {
  const [activeTab, setActiveTab] = useState('Ongoing')
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Use your actual hooks
  const { newUserOngoinParcelOrdersData, isLoading: ongoingLoading, refetch: refetchOngoing } = useGetUserOngoingParcelOrders()
  const { newUserCompletedParcelOrdersData, isLoading: completedLoading, refetch: refetchCompleted } = useGetUserCompletedParcelOrders()
  
  // Get the actual data from hooks
  const ongoingParcels = newUserOngoinParcelOrdersData || []
  const completedParcels = newUserCompletedParcelOrdersData?.data || []

  console.log('This is the parcel', completedParcels)

  // Combined loading state
  const isLoading = ongoingLoading || completedLoading

  // Refetch data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchOngoing()
      refetchCompleted()
    }, [refetchOngoing, refetchCompleted])
  )

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (activeTab === 'Ongoing') {
        await refetchOngoing()
      } else {
        await refetchCompleted()
      }
    } catch (error) {
      console.log('Error refreshing parcels:', error)
    } finally {
      setRefreshing(false)
    }
  }, [activeTab, refetchOngoing, refetchCompleted])

  const handleViewParcel = (parcel: any) => {
    setSelectedParcel(parcel)
    setShowBottomSheet(true)
  }

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false)
    setSelectedParcel(null)
  }


  // Empty state component for ongoing parcels
  const EmptyOngoingState = () => (
    <View className='items-center justify-center flex-1 py-20'>
      <Animated.View className='bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center'>
        <MaterialIcons name='local-shipping' size={35} color={'#F75F15'} />
      </Animated.View>

      <Animated.View className='w-[70%]'>
        <Text className='text-lg pt-3 text-center' style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>No Ongoing Deliveries</Text>
        <Text className='text-sm text-center text-neutral-500 pt-2' style={{ fontFamily: 'HankenGrotesk_400Regular' }}>
          You don't have any ongoing parcels at the moment. Book a delivery to see your parcels here.
        </Text>
      </Animated.View>

      <Animated.View className='w-[50%] pt-5'>
        <SolidMainButton text='Send Package' onPress={() => router.push('/(access)/(user_stacks)/courier/deliver-parcel-home')} />
      </Animated.View>
    </View>
  )

  // Empty state component for past parcels
  const EmptyPastState = () => (
    <View className='items-center justify-center flex-1 py-20'>
      <Animated.View className='bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center'>
        <MaterialIcons name='history' size={35} color={'#F75F15'} />
      </Animated.View>

      <Animated.View className='w-[70%]'>
        <Text className='text-lg pt-3 text-center' style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>No Past Deliveries</Text>
        <Text className='text-sm text-center text-neutral-500 pt-2' style={{ fontFamily: 'HankenGrotesk_400Regular' }}>
          Your completed deliveries will appear here once you finish using our delivery service.
        </Text>
      </Animated.View>

      <Animated.View className='w-[50%] pt-5'>
        <SolidMainButton text='Send A Parcel' onPress={() => router.push('/(access)/(user_stacks)/courier/deliver-parcel-home')} />
      </Animated.View>
    </View>
  )

  // Component to render parcel item (matches screenshot design)
  const renderParcelItem = (parcel: any, index: any, isCompleted: boolean = false) => {
    const parcelType = parcel.package_type
    const parcelAmount = parcel.amount || parcel.price || 0
    const parcelDate = new Date(parcel.createdAt || parcel.date || Date.now()).toLocaleDateString()
    
    return (
      <View key={parcel._id || parcel.id || index} className="bg-white rounded-xl p-4 mb-4 relative">
        {/* Status Badge in Top Right */}
        <View className={`absolute top-3 right-3 ${isCompleted ? 'bg-green-100' : 'bg-orange-100'} rounded-full px-3 py-1`}>
          <Text className={`text-xs font-medium ${isCompleted ? 'text-green-600' : 'text-orange-600'}`} style={{ fontFamily: "HankenGrotesk_500Medium" }}>
            {parcel.completed === true ? 'Completed': 'Ongoin'}
          </Text>
        </View>

        <View className="flex-row items-center mb-4 pr-20">
          {/* Icon based on parcel type */}
          <View className="w-20 h-20 mr-4 items-center justify-center">
              <View className="bg-orange-100 rounded-full p-3">
                <MaterialIcons name="local-shipping" size={32} color="#F75F15" />
              </View>
          </View>
          
          <View className="flex-1">
            <Text className="text-neutral-800 mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              {parcelType}
            </Text>
            
            <Text className="text-sm text-neutral-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              {parcel.package_description || 'N/A'}
            </Text>
            
            <Text className="text-lg font-bold text-black" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              ₦{parcelAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View className='flex-row justify-between items-center'>
          <View className='w-[100%]'>
            <TouchableOpacity className='bg-[#F6F6F6] border border-gray-200 p-4 rounded-full' onPress={() => handleViewParcel(parcel)}>
                <Text style={{fontFamily: 'HankenGrotesk_600SemiBold'}} className='text-center text-sm'>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // Get current data based on active tab
  const currentParcels = activeTab === 'Ongoing' ? ongoingParcels : completedParcels

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} />
      
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-6 px-4 pt-2">
        <OnboardArrowTextHeader onPressBtn={() => router.replace('/(access)/(user_tabs)/profile')} />
        <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          Parcel History
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row items-center justify-between mx-4 mb-6">
        <View className='w-[48%]'>
          {activeTab === 'Ongoing' ? 
            <SolidLightButton text='Ongoing' onPress={() => setActiveTab('Ongoing')} /> : 
            <TouchableOpacity
              className={`py-4 px-6 rounded-full mr-2 bg-white`}
              onPress={() => setActiveTab('Ongoing')}
            >
              <Text className={`text-center text-neutral-600`} style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Ongoing
              </Text>
            </TouchableOpacity>
          }
        </View>

        <View className='w-[48%]'>
          {activeTab === 'Past' ? 
            <SolidLightButton text='Past' onPress={() => setActiveTab('Past')} /> : 
            <TouchableOpacity
              className={`py-4 px-6 rounded-full mr-2 bg-white`}
              onPress={() => setActiveTab('Past')}
            >
              <Text className={`text-center text-neutral-600`} style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Past
              </Text>
            </TouchableOpacity>
          }
        </View>
      </View>

      {/* Content */}
      {!isLoading && (
        <KeyboardAwareScrollView 
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#F75F15']} // Android
              tintColor="#F75F15" // iOS
              title="Pull to refresh" // iOS
              titleColor="#F75F15" // iOS
            />
          }
        >
          {activeTab === 'Ongoing' && (
            <View className="flex-1">
              {currentParcels.length > 0 ? (
                <View className="space-y-4">
                  {currentParcels.map((parcel: any, index: any) => 
                    renderParcelItem(parcel, index, false)
                  )}
                </View>
              ) : (
                <EmptyOngoingState />
              )}
            </View>
          )}

          {activeTab === 'Past' && (
            <View className="flex-1">
              {currentParcels.length > 0 ? (
                <View className="space-y-4">
                  {currentParcels.map((parcel: any, index: any) => 
                    renderParcelItem(parcel, index, true)
                  )}
                </View>
              ) : (
                <EmptyPastState />
              )}
            </View>
          )}
        </KeyboardAwareScrollView>
      )}

      {/* Custom Bottom Sheet */}
      <ParcelDetailsBottomSheet 
        visible={showBottomSheet}
        onClose={handleCloseBottomSheet}
        parcel={selectedParcel}
      />
    </SafeAreaView>
  )
}

export default ParcelHistoryBuyer