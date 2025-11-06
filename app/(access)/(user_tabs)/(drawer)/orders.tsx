import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  RefreshControl,
  AppState,
  // Linking, // Uncomment if you want to use Linking for phone calls
} from "react-native"
import React, { useState, useRef, useCallback, useMemo } from "react"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import {
  useGetNewOrders,
  useGetProcessingOrders,
  useGetOutForDeliveryOrders,
  useGetCompletedOrders,
  useGetCancelledOrders,
  useRejectOrder,
} from "@/hooks/mutations/sellerAuth"
import { MaterialIcons } from "@expo/vector-icons"
import LoadingOverlay from "@/components/LoadingOverlay"
import { DrawerHeaderMany } from "@/components/btns/DrawerHeader"
import { DrawerActions, useNavigation, useFocusEffect } from "@react-navigation/native"
import { useNotification } from "@/context/NotificationContext"
import { Toast } from "react-native-toast-notifications"
import { Linking } from "react-native"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

// Types - Updated with assigned field
interface Order {
  order_id: string
  assigned?: boolean // Added assigned field
  order_items: Array<{
    product: {
      title: string
      description: string
      original_price: number
      discounted_price: number
      product_images: Array<{
        image_url: string
      }>
      size?: string
    }
    count: number
    amount: number
  }>
  buyer: {
    fullname: string
    username: string
  }
  delivery: {
    delivery_method: string
    delivery_address: string
    city: string
    state: string
    postal_code: string
    landmark: string
    phone_number: string
    fullname?: string
  }
  status: string
}

interface OrderTotals {
  totalPrice: number
  totalQuantity: number
}

interface RejectOrderBottomSheetProps {
  visible: boolean
  onClose: () => void
  order: Order | null
  onConfirmReject: (order: Order) => void
}

// Constants
const TABS = ["New Orders", "Processing", "Out for Delivery", "Completed", "Cancelled"] as const
type TabType = (typeof TABS)[number]

// Reject Order Confirmation Bottom Sheet (unchanged)
const RejectOrderBottomSheet = ({ visible, onClose, order, onConfirmReject }: RejectOrderBottomSheetProps) => {
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
  }, [visible, slideAnim, backdropOpacity])

  const handleConfirmReject = useCallback(() => {
    if (order) {
      onConfirmReject(order)
      onClose()
    }
  }, [order, onConfirmReject, onClose])

  if (!visible || !order) return null

  return (
    <Modal transparent={true} visible={visible} animationType="none" onRequestClose={onClose}>
      <View className="flex-1">
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: backdropOpacity,
          }}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
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
          {/* Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="cancel" size={32} color="#F75F15" />
            </View>
          </View>
          {/* Content */}
          <View className="items-center mb-6">
            <Text
              className="text-xl font-semibold mb-2 text-center"
              style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
            >
              Do you want to reject order?
            </Text>
            <Text className="text-gray-600 text-center px-10" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Are you sure you want to reject this order? This action cannot be undone.
            </Text>
            <Text
              className="text-sm text-gray-500 mt-5 mb-5 text-center"
              style={{ fontFamily: "HankenGrotesk_400Regular" }}
            >
              Order ID: {order.order_id}
            </Text>
          </View>
          {/* Buttons */}
          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <TouchableOpacity className="py-4 px-6 rounded-full bg-gray-100" onPress={onClose}>
                <Text className="text-center text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            <View className="w-[48%]">
              <SolidMainButton text="Reject Order" onPress={handleConfirmReject} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

// Empty State Component (unchanged)
const EmptyState = ({
  icon,
  title,
  description,
  buttonText,
  onButtonPress,
}: {
  icon: string
  title: string
  description: string
  buttonText: string
  onButtonPress: () => void
}) => (
  <View className="items-center justify-center flex-1 py-20">
    <Animated.View className="bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center">
      <MaterialIcons name={icon as any} size={30} color={"#F75F15"} />
    </Animated.View>
    <Animated.View className="w-[70%]">
      <Text className="text-lg pt-3 text-center" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
        {title}
      </Text>
      <Text className="text-sm text-center text-neutral-600 pt-2" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
        {description}
      </Text>
    </Animated.View>
    <Animated.View className="w-[50%] pt-5">
      <SolidMainButton text={buttonText} onPress={onButtonPress} />
    </Animated.View>
  </View>
)

// Order Card Component (MODIFIED)
interface OrderCardProps {
  order: Order
  renderActions: (order: Order) => React.ReactNode // Function to render buttons based on tab
}

const OrderCard = ({ order, renderActions }: OrderCardProps) => {
  const { totalPrice, totalQuantity } = useMemo(() => {
    let totalPrice = 0
    let totalQuantity = 0
    order.order_items.forEach((item) => {
      const itemPrice = item.product.discounted_price > 0 ? item.product.discounted_price : item.product.original_price
      totalPrice += itemPrice * item.count
      totalQuantity += item.count
    })
    return { totalPrice, totalQuantity }
  }, [order.order_items])

  const firstProduct = order.order_items[0]?.product
  const productImage = firstProduct?.product_images[0]?.image_url

  return (
    <View className="bg-white rounded-xl p-4 mb-4 relative">
      {/* Quantity Badge */}
      <View className="absolute top-3 right-3 bg-orange-100 rounded-full px-3 py-1">
        <Text className="text-xs font-medium text-orange-600" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
          {totalQuantity} item{totalQuantity > 1 ? "s" : ""}
        </Text>
      </View>
      <View className="flex-row items-center mb-4 pr-16">
        <View className="w-20 h-20 bg-gray-100 rounded-lg mr-4 items-center justify-center overflow-hidden">
          {productImage ? (
            <Image source={{ uri: productImage }} className="w-full h-full rounded-lg" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-gray-200 items-center justify-center">
              <Text className="text-gray-400 text-xs">No Image</Text>
            </View>
          )}
        </View>
        <View className="flex-1">

           {firstProduct?.title.length > 30 ?
              <Text className="text-neutral-800 mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {firstProduct?.title.slice(0, 30) || "Product Title"} ...
              </Text>: 
              <Text className="text-neutral-800 mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                {firstProduct?.title || "Product Title"}
              </Text>
            }


          {firstProduct?.description.length > 35 ?
            <Text className="text-sm text-neutral-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              {firstProduct?.description.slice(0, 35) || "Product Description"}...
            </Text> : 
            <Text className="text-sm text-neutral-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              {firstProduct?.description || "Product Description"}
            </Text>
          }
          <Text className="text-base font-bold text-black" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            ₦{totalPrice.toLocaleString()}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center">
        {renderActions(order)}
      </View>
    </View>
  )
}

const Orders = () => {
  const [activeTab, setActiveTab] = useState<TabType>("New Orders")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showRejectSheet, setShowRejectSheet] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()

  // Fetch data for each tab using dedicated hooks
  const { newOrdersData, isLoading: newOrdersLoading, refetch: newOrdersRefetch } = useGetNewOrders()
  const {
    processingOrdersData,
    isLoading: processingOrdersLoading,
    refetch: processingOrdersRefetch,
  } = useGetProcessingOrders()
  const {
    outForDeliveryOrdersData,
    isLoading: outForDeliveryLoading,
    refetch: outForDeliveryRefetch,
  } = useGetOutForDeliveryOrders()

  // console.log('This is new data', newOrdersData?.data)
  console.log('This is processing data', processingOrdersData?.data)
  // console.log('This is processing data', processingOrdersData?.data)
  const {
    completedOrdersData,
    isLoading: completedOrdersLoading,
    refetch: completedOrdersRefetch,
  } = useGetCompletedOrders()
  const {
    cancelledOrdersData,
    isLoading: cancelledOrdersLoading,
    refetch: cancelledOrdersRefetch,
  } = useGetCancelledOrders()

  // Get notification context data
  const { notification, error, expoPushToken, tokenSent } = useNotification()

  // Memoize data for each tab
  const newUserOrders = useMemo(() => newOrdersData?.data || [], [newOrdersData?.data])
  const processingOrders = useMemo(
    () => processingOrdersData?.data || [],
    [processingOrdersData?.data],
  )
  const outForDeliveryOrders = useMemo(
    () => outForDeliveryOrdersData?.data || [],
    [outForDeliveryOrdersData?.data],
  )
  const completedOrders = useMemo(() => completedOrdersData?.data || [], [completedOrdersData?.data])
  const cancelledOrders = useMemo(() => cancelledOrdersData?.data || [], [cancelledOrdersData?.data])

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  // Pull to refresh handler - refetches all order types
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        newOrdersRefetch(),
        processingOrdersRefetch(),
        outForDeliveryRefetch(),
        completedOrdersRefetch(),
        cancelledOrdersRefetch(),
      ])
    } catch (error) {
      console.error("Error refreshing orders:", error)
    } finally {
      setRefreshing(false)
    }
  }, [newOrdersRefetch, processingOrdersRefetch, outForDeliveryRefetch, completedOrdersRefetch, cancelledOrdersRefetch])

  // Refetch all data when screen is focused
  useFocusEffect(
    useCallback(() => {
      newOrdersRefetch()
      processingOrdersRefetch()
      outForDeliveryRefetch()
      completedOrdersRefetch()
      cancelledOrdersRefetch()
    }, [
      newOrdersRefetch,
      processingOrdersRefetch,
      outForDeliveryRefetch,
      completedOrdersRefetch,
      cancelledOrdersRefetch,
    ]),
  )

  // Initial refetch for all data when component mounts
  React.useEffect(() => {
    newOrdersRefetch()
    processingOrdersRefetch()
    outForDeliveryRefetch()
    completedOrdersRefetch()
    cancelledOrdersRefetch()
  }, [newOrdersRefetch, processingOrdersRefetch, outForDeliveryRefetch, completedOrdersRefetch, cancelledOrdersRefetch])

  // Refetch all data on new notification
  React.useEffect(() => {
    if (notification) {
      console.log("📱 New notification received, refetching orders...")
      newOrdersRefetch()
      processingOrdersRefetch()
      outForDeliveryRefetch()
      completedOrdersRefetch()
      cancelledOrdersRefetch()
    }
  }, [
    notification,
    newOrdersRefetch,
    processingOrdersRefetch,
    outForDeliveryRefetch,
    completedOrdersRefetch,
    cancelledOrdersRefetch,
  ])

  // Refetch when returning from background (app state change)
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        newOrdersRefetch()
        processingOrdersRefetch()
        outForDeliveryRefetch()
        completedOrdersRefetch()
        cancelledOrdersRefetch()
      }
    }
    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [newOrdersRefetch, processingOrdersRefetch, outForDeliveryRefetch, completedOrdersRefetch, cancelledOrdersRefetch])

  const handleRejectOrder = useCallback((order: Order) => {
    setSelectedOrder(order)
    setShowRejectSheet(true)
  }, [])

  const handleCloseRejectSheet = useCallback(() => {
    setShowRejectSheet(false)
    setSelectedOrder(null)
  }, [])

  const {mutate: cancleOrder, isPending: cancelPending} = useRejectOrder(selectedOrder?.order_id)

    const handleConfirmReject = () => {
      cancleOrder(
        {},
        {
          onSuccess: (data) => {
            console.log("✅ Order Canceled successfully:", data)
            Toast.show("Order Canceled successfully", {type: 'success'})
            // setShowSuccessModal(true)
          },
          onError: (error) => {
            console.error("❌ Error Canceled order:", error)
            console.error("❌ Error details:", {
              message: error?.message,
              data: (error as any)?.response?.data.data.message,
            })
            Toast.show((error as any)?.response?.data, {type: 'success'})

          },
        },
      )
    }
  

  // const handleConfirmReject = useCallback(
  //   (order: Order) => {
  //     console.log("Rejecting order:", order.order_id)
  //     // In a real app, you'd call a mutation here to reject the order
  //     // For now, just refetch all orders to reflect potential changes
  //     onRefresh() // Use onRefresh to refetch all data
  //   },
  //   [onRefresh],
  // )

  const handleViewToConfirm = useCallback((order: Order) => {
    router.push({
      pathname: "/(access)/(user_stacks)/order-confirm",
      params: {
        orderId: order.order_id,
        orderData: JSON.stringify(order),
      },
    })
  }, [])

  // New handler functions for other actions
  const handleCancelOrder = useCallback((order: Order) => {
    console.log("Cancelling order:", order.order_id)
    // Implement actual cancellation logic here (e.g., API call)
    onRefresh() // Refetch orders after action
  }, [onRefresh])

  const handleMarkForDelivery = useCallback((order: Order) => {
    console.log("Marking order for delivery:", order.order_id)
     router.push({
      pathname: "/(access)/(user_stacks)/order-mark-delivery",
      params: {
        orderId: order.order_id,
        orderData: JSON.stringify(order),
      },
    })
  }, [])

  const handleCallCourier = useCallback((order: Order) => {
    console.log("Calling courier for order:", order.order_id)
    // Implement call functionality, e.g.:
    if (order.delivery.phone_number) {
      Linking.openURL(`tel:${order.delivery.phone_number}`);
    }
  }, [])

  const handleTrackCourier = useCallback((order: Order) => {
    console.log("Tracking courier for order:", order.order_id)
    // Implement tracking functionality, e.g.:
    router.push({ 
      pathname: "/(access)/(user_stacks)/order-track", 
      params: { 
        orderId: order.order_id,
        orderData: JSON.stringify(order),
      } 
    });
  }, [])

  const navigateToHome = useCallback(() => {
    router.push("/home")
  }, [])

  const emptyStates = useMemo(
    () => ({
      "New Orders": {
        icon: "receipt",
        title: "No New Orders",
        description: "You don't have any new orders at the moment.",
        buttonText: "Start Shopping",
      },
      Processing: {
        icon: "hourglass-empty",
        title: "No Processing Orders",
        description: "You don't have any orders being processed at the moment.",
        buttonText: "Start Shopping",
      },
      "Out for Delivery": {
        icon: "directions-bike",
        title: "No Orders Out for Delivery",
        description: "You don't have any orders out for delivery at the moment.",
        buttonText: "Browse Products",
      },
      Completed: {
        icon: "check-circle",
        title: "No Completed Orders",
        description: "Your completed orders will appear here once they are delivered.",
        buttonText: "Start Shopping",
      },
      Cancelled: {
        icon: "cancel",
        title: "No Cancelled Orders",
        description: "You don't have any cancelled orders at the moment.",
        buttonText: "Start Shopping",
      },
    }),
    [],
  )

  // Function to render buttons based on the active tab - UPDATED with assigned field handling
  const renderOrderCardActions = useCallback(
    (order: Order) => {
      switch (activeTab) {
        case "New Orders":
          return (
            <View className="flex-row justify-between">
              {/* <View className="w-[48%]">
                <SolidLightButton text="Reject Order" onPress={() => handleRejectOrder(order)} />
              </View> */}
              <View className="w-full">
                <SolidMainButton text="View to Confirm" onPress={() => handleViewToConfirm(order)} />
              </View>
            </View>
          )
        case "Processing":
          if (order.assigned) {
            return (
              <View className="w-full">
                <View className="bg-gray-100 py-3 px-4 rounded-full">
                  <Text 
                    className="text-center text-neutral-400 font-medium" 
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  >
                    Waiting for Rider to Accept Order
                  </Text>
                </View>
              </View>
            )
          } else {
            return (
              <View className="flex-row justify-between">
                <View className="w-[48%]">
                  <SolidMainButton text="Mark for Delivery" onPress={() => handleMarkForDelivery(order)} />
                </View>
              </View>
            )
          }
        case "Out for Delivery":
          return (
            <View className="flex-row justify-between">
              <View className="w-[48%]">
                <SolidLightButton text="Call Courier" onPress={() => handleCallCourier(order)} />
              </View>
              <View className="w-[48%]">
                <SolidMainButton text="Track Courier" onPress={() => handleTrackCourier(order)} />
              </View>
            </View>
          )
        case "Completed":
        case "Cancelled":
          return null // No buttons for these tabs
        default:
          return null
      }
    },
    [
      activeTab,
      handleRejectOrder,
      handleViewToConfirm,
      handleCancelOrder,
      handleMarkForDelivery,
      handleCallCourier,
      handleTrackCourier,
    ],
  )

  const renderTabContent = () => {
    let ordersToDisplay: Order[] = []
    let currentLoading = false
    switch (activeTab) {
      case "New Orders":
        ordersToDisplay = newUserOrders
        currentLoading = newOrdersLoading
        break
      case "Processing":
        ordersToDisplay = processingOrders
        currentLoading = processingOrdersLoading
        break
      case "Out for Delivery":
        ordersToDisplay = outForDeliveryOrders
        currentLoading = outForDeliveryLoading
        break
      case "Completed":
        ordersToDisplay = completedOrders
        currentLoading = completedOrdersLoading
        break
      case "Cancelled":
        ordersToDisplay = cancelledOrders
        currentLoading = cancelledOrdersLoading
        break
      default:
        ordersToDisplay = []
        currentLoading = false
    }

    return ordersToDisplay.length > 0 ? (
      <View className="space-y-4">
        {ordersToDisplay.map((order: Order, index: number) => (
          <OrderCard
            key={order.order_id || index}
            order={order}
            renderActions={renderOrderCardActions} // Pass the render function
          />
        ))}
      </View>
    ) : (
      <EmptyState {...emptyStates[activeTab]} onButtonPress={navigateToHome} />
    )
  }

  if (error) {
    console.error("Notification Error:", error)
  }

  console.log("Push Token:", expoPushToken)

  // Global loading overlay for initial data fetch of all tabs
  const globalLoading =
    newOrdersLoading &&
    processingOrdersLoading &&
    outForDeliveryLoading &&
    completedOrdersLoading &&
    cancelledOrdersLoading &&
    !refreshing

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Global loading overlay for initial data fetch */}
      <LoadingOverlay visible={globalLoading || cancelPending} />
      <View className="flex-row items-center gap-2 mb-6 px-4 pt-2">
        <DrawerHeaderMany onPress={openDrawer} />
        <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          Orders
        </Text>
      </View>
      {/* Tab Bar */}
      <View className="mb-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          className="flex-grow-0"
        >
          <View className="flex-row bg-white rounded-full p-1 mx-0">
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`py-3 px-6 rounded-full min-w-[100px] ${
                  activeTab === tab ? "bg-orange-100" : "bg-transparent"
                }`}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className={`text-center text-sm ${
                    activeTab === tab ? "text-orange-600 font-medium" : "text-gray-500"
                  }`}
                  style={{
                    fontFamily: activeTab === tab ? "HankenGrotesk_500Medium" : "HankenGrotesk_400Regular",
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      {/* Content with Pull-to-Refresh */}
      <KeyboardAwareScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F75F15"]} // Android
            tintColor="#F75F15" // iOS
            title="Pull to refresh orders..."
            titleColor="#F75F15"
          />
        }
      >
        {renderTabContent()}
      </KeyboardAwareScrollView>
      <RejectOrderBottomSheet
        visible={showRejectSheet}
        onClose={handleCloseRejectSheet}
        order={selectedOrder}
        onConfirmReject={handleConfirmReject}
      />
    </SafeAreaView>
  )
}

export default Orders