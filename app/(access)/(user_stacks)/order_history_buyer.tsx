import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Animated, Dimensions, PanResponder } from 'react-native'
import React, { useState, useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { router } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useGetUserOrders } from '@/hooks/mutations/sellerAuth'
import { MaterialIcons } from '@expo/vector-icons'
import LoadingOverlay from '@/components/LoadingOverlay'
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Custom Bottom Sheet Component
const OrderDetailsBottomSheet = ({ visible, onClose, order }:any) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  React.useEffect(() => {
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

  if (!visible || !order) return null

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
              Order Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Order ID */}
          <View className="px-4 mb-4">
            <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Order ID: {order.order_id}
            </Text>
            <Text className="text-sm text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Status: {order.status}
            </Text>
          </View>

          {/* Products List */}
          <ScrollView className="px-4 mb-4" showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-semibold mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Items ({order.order_items.length})
            </Text>
            
            {order.order_items.map((item:any, index:any) => (
              <View key={index} className="bg-gray-50 rounded-xl p-4 mb-3">
                <View className="flex-row items-center">
                  <View className="w-16 h-16 bg-white rounded-lg mr-3 overflow-hidden">
                    {item.product.product_images && item.product.product_images.length > 0 ? (
                      <Image 
                        source={{ uri: item.product.product_images[0].image_url }} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                      />
                    ) : (
                      <View className="w-full h-full bg-gray-200 items-center justify-center">
                        <Text className="text-gray-400 text-xs">No Image</Text>
                      </View>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-sm font-medium mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                      {item.product.title}
                    </Text>
                    <Text className="text-xs text-gray-600 mb-2" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      {item.product.description}
                    </Text>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-bold text-black" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        ₦{item.product.discounted_price > 0 ? item.product.discounted_price.toLocaleString() : item.product.original_price.toLocaleString()}
                      </Text>
                      <Text className="text-xs text-gray-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                        Qty: {item.count}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* Store Info */}
            <View className="bg-blue-50 rounded-xl p-4 mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Store Information
              </Text>
              <Text className="text-sm text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {order.store.name}
              </Text>
              <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {order.store.description}
              </Text>
            </View>

            {/* Delivery Info */}
            {order.delivery && (
              <View className="bg-orange-50 rounded-xl p-4 mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Delivery Information
                </Text>
                <Text className="text-sm text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  Method: {order.delivery.delivery_method}
                </Text>
                <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Address: {order.delivery.delivery_address}
                </Text>
                <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  City: {order.delivery.city}, {order.delivery.state}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View className="px-4">
            <SolidMainButton text="Track Order" onPress={() => {
              onClose()
              // Add your track order logic here
            }} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const OrderHistoryBuyer = () => {
  const [activeTab, setActiveTab] = useState('Ongoing')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showBottomSheet, setShowBottomSheet] = useState(false)

  const { newUserOrdersData, isLoading } = useGetUserOrders()
  console.log('This is New Order data', newUserOrdersData?.data)
  const newUserOrder = newUserOrdersData?.data || []

  const handleViewOrder = (order:any) => {
    setSelectedOrder(order)
    setShowBottomSheet(true)
  }

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false)
    setSelectedOrder(null)
  }

  // Helper function to calculate total price and quantity for an order
  const calculateOrderTotals = (order:any) => {
    let totalPrice = 0
    let totalQuantity = 0
    
    order.order_items.forEach((item:any) => {
      const itemPrice = item.product.discounted_price > 0 ? item.product.discounted_price : item.product.original_price
      totalPrice += itemPrice * item.count
      totalQuantity += item.count
    })
    
    return { totalPrice, totalQuantity }
  }

  // Empty state component for ongoing orders
  const EmptyOngoingState = () => (
    <View className='items-center justify-center flex-1 py-20'>
      <Animated.View className='bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center'>
        <MaterialIcons name='shopping-bag' size={35} color={'#F75F15'}/>
      </Animated.View>

      <Animated.View className='w-[60%]'>
        <Text className='text-xl pt-3 text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>No Ongoing Orders</Text>
        <Text className='text-base text-center text-neutral-600 pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
          You don't have any ongoing orders at the moment. Start shopping to see your orders here.
        </Text>
      </Animated.View>

      <Animated.View className='w-[50%] pt-5' >
        <SolidMainButton text='Start Shopping' onPress={()=>router.push('/home')}/>
      </Animated.View>
    </View>
  )

  // Empty state component for past orders
  const EmptyPastState = () => (
    <View className='items-center justify-center flex-1 py-20'>
      <Animated.View className='bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center'>
        <MaterialIcons name='history' size={35} color={'#F75F15'}/>
      </Animated.View>

      <Animated.View className='w-[60%]'>
        <Text className='text-xl pt-3 text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>No Past Orders</Text>
        <Text className='text-base text-center text-neutral-600 pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
          Your completed orders will appear here once you finish shopping.
        </Text>
      </Animated.View>

      <Animated.View className='w-[50%] pt-5' >
        <SolidMainButton text='Browse Products' onPress={()=>router.push('/home')}/>
      </Animated.View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} />
      
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-6 px-4 pt-2">
        <OnboardArrowTextHeader onPressBtn={() => router.back()} />
        <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          Order History
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
        <KeyboardAwareScrollView className="flex-1 px-4">
          {activeTab === 'Ongoing' && (
            <View className="flex-1">
              {newUserOrder.length > 0 ? (
                <View className="space-y-4">
                  {/* Product Orders */}
                  {newUserOrder.map((order:any, index:any) => {
                    const { totalPrice, totalQuantity } = calculateOrderTotals(order)
                    
                    return (
                      <View key={order.order_id || index} className="bg-white rounded-xl p-4 mb-4 relative">
                        {/* Quantity Badge in Top Right */}
                        <View className="absolute top-3 right-3 bg-orange-100 rounded-full px-3 py-1">
                          <Text className="text-xs font-medium text-orange-600" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                            {totalQuantity} item{totalQuantity > 1 ? 's' : ''}
                          </Text>
                        </View>

                        <View className="flex-row items-center mb-4 pr-16">
                          <View className="w-20 h-20 bg-blue-100 rounded-lg mr-4 items-center justify-center overflow-hidden">
                            {order?.order_items?.[0]?.product?.product_images?.[0]?.image_url ? (
                              <Image 
                                source={{ uri: order.order_items[0].product.product_images[0].image_url }} 
                                className="w-full h-full rounded-lg" 
                                resizeMode="cover" 
                              />
                            ) : (
                              <View className="w-full h-full bg-gray-200 items-center justify-center">
                                <Text className="text-gray-400 text-xs">No Image</Text>
                              </View>
                            )}
                          </View>
                          
                          <View className="flex-1">
                            <Text className="text-neutral-800 mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                              {order?.order_items?.[0]?.product?.title || 'Product Title'}
                            </Text>
                            <Text className="text-sm text-neutral-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                              {order?.order_items?.[0]?.product?.description || 'Product Description'}
                            </Text>
                            <Text className="text-lg font-bold text-black" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                              ₦{totalPrice.toLocaleString()}
                            </Text>
                          </View>
                        </View>

                        <View className='flex-row justify-between items-center'>
                          <View className='w-[48%]'>
                            <SolidLightButton text='View Order' onPress={() => handleViewOrder(order)} />
                          </View>

                          <View className='w-[48%]'>
                            <SolidMainButton text='Track order' />
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              ) : (
                <EmptyOngoingState />
              )}
            </View>
          )}

          {activeTab === 'Past' && (
            <View className="flex-1">
              <EmptyPastState />
            </View>
          )}
        </KeyboardAwareScrollView>
      )}

      {/* Custom Bottom Sheet */}
      <OrderDetailsBottomSheet 
        visible={showBottomSheet}
        onClose={handleCloseBottomSheet}
        order={selectedOrder}
      />
    </SafeAreaView>
  )
}

export default OrderHistoryBuyer