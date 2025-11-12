import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Animated, Dimensions, PanResponder, RefreshControl, Linking, Alert } from 'react-native'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { router, useFocusEffect } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SolidLightButton, SolidLightGreenButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useGetUserCompletedParcelOrders, useGetUserOngoingParcelOrders } from '@/hooks/mutations/sellerAuth'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Helper function to get icon based on package type
const getPackageIcon = (packageType: string) => {
  const type = packageType?.toLowerCase() || ''
  
  const iconMap: { [key: string]: { name: string; library: 'Ionicons' | 'MaterialIcons' | 'FontAwesome5'; color: string } } = {
    'envelope': { name: 'mail', library: 'Ionicons', color: '#3B82F6' },
    'parcel': { name: 'cube', library: 'Ionicons', color: '#F75F15' },
    'food': { name: 'restaurant', library: 'Ionicons', color: '#10B981' },
    'fragile': { name: 'notifications', library: 'Ionicons', color: 'gray' },
    'electronics': { name: 'laptop', library: 'Ionicons', color: '#8B5CF6' },
    'box': { name: 'cube-outline', library: 'Ionicons', color: '#F59E0B' },
    'crate': { name: 'grid', library: 'Ionicons', color: '#6B7280' },
    'pallet': { name: 'apps', library: 'Ionicons', color: '#059669' },
    'others': { name: 'ellipsis-horizontal', library: 'Ionicons', color: '#6B7280' },
  }

  return iconMap[type] || iconMap['others']
}

// Animated Delivery In Progress Component
const DeliveryInProgress = () => {
  const bikeAnimation = useRef(new Animated.Value(0)).current
  const pulseAnimation = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Bike moving animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bikeAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bikeAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Pulse animation for the status indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const translateX = bikeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  })

  return (
    <View className="bg-white rounded-xl p-6 mb-4 items-center">
      <View className="items-center mb-2">
        <Text className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          Delivery In Progress
        </Text>
        <Text className="text-sm text-gray-600 text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
          Your rider is on the way to deliver your parcel
        </Text>
      </View>

      {/* Animated Road/Path */}
      <View className="w-full h-12 relative overflow-hidden mb-0">
        <View className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200" style={{ transform: [{ translateY: -1 }] }} />
        
        <Animated.View 
          style={{ 
            transform: [{ translateX }],
            position: 'absolute',
            top: 8,
            left: '45%',
          }}
        >
          <Ionicons name="bicycle" size={28} color="#F75F15" />
        </Animated.View>
        <View className="absolute left-0 top-1/2 w-3 h-3 bg-gray-500 rounded-full" style={{ transform: [{ translateY: -6 }] }} />
        <View className="absolute right-0 top-1/2 w-3 h-3 bg-green-700 rounded-full" style={{ transform: [{ translateY: -6 }] }} />
      </View>

      <View className="flex-row items-center gap-3">
        <View className="w-2 h-2 bg-orange-500 rounded-full" />
        <View className="w-2 h-2 bg-orange-300 rounded-full" />
        <View className="w-2 h-2 bg-orange-200 rounded-full" />
      </View>
    </View>
  )
}

// Custom Bottom Sheet Component for Parcel Details
const ParcelDetailsBottomSheet = ({ visible, onClose, parcel, isOngoing }: any) => {
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

  const handleCallRider = () => {
    const phoneNumber = parcel?.package_ride[0]?.rider?.phone_number
    
    if (!phoneNumber) {
      Alert.alert('No Contact', 'Rider contact information is not available yet.')
      return
    }

    Alert.alert(
      'Call Rider',
      `Do you want to call ${parcel?.driver?.name || parcel?.assigned_driver?.name || 'the rider'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert('Error', 'Unable to make a call. Please try again.')
            })
          },
        },
      ]
    )
  }

  if (!visible || !parcel) return null

  const packageIcon = getPackageIcon(parcel.package_type)

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
            maxHeight: SCREEN_HEIGHT * 0.85,
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
            {isOngoing && parcel.completed !== true && parcel?.package_ride[0]?.out_for_delivery !== false  && <DeliveryInProgress />}

            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-white rounded-lg mr-3 overflow-hidden items-center justify-center">
                  <View 
                    className="rounded-full p-2" 
                    style={{ backgroundColor: `${packageIcon.color}20` }}
                  >
                    {packageIcon.library === 'Ionicons' && (
                      <Ionicons name={packageIcon.name as any} size={24} color={packageIcon.color} />
                    )}
                    {packageIcon.library === 'MaterialIcons' && (
                      <MaterialIcons name={packageIcon.name as any} size={24} color={packageIcon.color} />
                    )}
                    {packageIcon.library === 'FontAwesome5' && (
                      <FontAwesome5 name={packageIcon.name as any} size={24} color={packageIcon.color} />
                    )}
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
                      ₦{(parcel?.package_ride[0]?.fare_amount)?.toLocaleString()}
                    </Text>
                    {/* <Text className="text-xs text-gray-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      {new Date(parcel.createdAt || parcel.date).toLocaleDateString()}
                    </Text> */}
                  </View>
                </View>
              </View>
            </View>

            {/* Driver Information */}
            {(parcel.package_ride[0]?.rider) && (
              <View className="bg-purple-50 rounded-xl p-4 mb-4">
                <Text className="text-sm font-semibold mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Driver Information
                </Text>
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="person" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                    {parcel.package_ride[0]?.rider?.fullname}
                  </Text>
                </View>
                {(parcel.package_ride[0]?.rider?.phone_number) && (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="call" size={16} color="#4B5563" />
                    <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      {parcel.package_ride[0]?.rider?.phone_number}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Pickup Information */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-sm font-semibold mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Pickup Information
              </Text>
              <View className="flex-row items-start gap-2 mb-2">
                <Ionicons name="location" size={16} color="#4B5563" style={{ marginTop: 2 }} />
                <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {parcel.pick_address || 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="call" size={16} color="#4B5563" />
                <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  {parcel.sender?.phone_number || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Delivery Information */}
            <View className="bg-blue-50 rounded-xl p-4 mb-4">
              <Text className="text-sm font-semibold mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Delivery Information
              </Text>
              <View className="flex-row items-start gap-2 mb-2">
                <Ionicons name="location-sharp" size={16} color="#4B5563" style={{ marginTop: 2 }} />
                <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {parcel.drop_address || 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="call" size={16} color="#4B5563" />
                <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  {parcel.alternative_number || 'N/A'}
                </Text>
              </View>
            </View>


          </ScrollView>

          {/* Bottom Actions */}
          <View className="px-4 gap-2">
            {/* Call Rider Button - Only show for ongoing parcels with driver info */}
            {isOngoing && (parcel.package_ride[0]?.rider?.phone_number) && (
              <TouchableOpacity
                className="bg-green-800 py-4 rounded-full flex-row items-center justify-center"
                onPress={handleCallRider}
              >
                <Ionicons name="call" size={20} color="white" />
                <Text className="text-white font-semibold ml-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Call Rider
                </Text>
              </TouchableOpacity>
            )}
            
            <SolidLightGreenButton text="Close" onPress={onClose} />
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
  const ongoingParcels = newUserOngoinParcelOrdersData?.data || []
  const completedParcels = newUserCompletedParcelOrdersData?.data || []

  console.log('This is the parcel', completedParcels)
  console.log('This is the ongoingParcels parcel', ongoingParcels)

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
    const parcelAmount = parcel?.package_ride[0]?.fare_amount || 0
    const parcelDate = new Date(parcel.createdAt || parcel.date || Date.now()).toLocaleDateString()
    const packageIcon = getPackageIcon(parcelType)
    
    return (
      <View key={parcel._id || parcel.id || index} className="bg-white rounded-xl p-4 mb-4 relative">
        {/* Status Badge in Top Right */}
        <View className={`absolute top-3 right-3 ${isCompleted ? 'bg-green-100' : 'bg-orange-100'} rounded-full px-3 py-1`}>
          <Text className={`text-xs font-medium ${isCompleted ? 'text-green-600' : 'text-orange-600'}`} style={{ fontFamily: "HankenGrotesk_500Medium" }}>
            {parcel.completed === true ? 'Completed' : 'Ongoing'}
          </Text>
        </View>

        <View className="flex-row items-center mb-4 pr-20">
          {/* Dynamic Icon based on parcel type */}
          <View className="w-20 h-20 mr-4 items-center justify-center">
            <View 
              className="rounded-full p-3" 
              style={{ backgroundColor: `${packageIcon.color}20` }}
            >
              {packageIcon.library === 'Ionicons' && (
                <Ionicons name={packageIcon.name as any} size={32} color={packageIcon.color} />
              )}
              {packageIcon.library === 'MaterialIcons' && (
                <MaterialIcons name={packageIcon.name as any} size={32} color={packageIcon.color} />
              )}
              {packageIcon.library === 'FontAwesome5' && (
                <FontAwesome5 name={packageIcon.name as any} size={32} color={packageIcon.color} />
              )}
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
        isOngoing={activeTab === 'Ongoing'}
      />
    </SafeAreaView>
  )
}

export default ParcelHistoryBuyer