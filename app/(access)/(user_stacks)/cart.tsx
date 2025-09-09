import { View, Text, Image, TouchableOpacity, Modal } from "react-native"
import { useCallback, useState, useEffect } from "react"
import { router } from "expo-router"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from "react-native-reanimated"
import { useFocusEffect } from "@react-navigation/native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useCart } from "@/context/cart-context"

const Cart = () => {
  const {
    cartItems,
    cartLength,
    isLoading,
    isUpdating,
    totalAmount,
    removeFromCart,
    updateQuantity,
    loadCart,
    formatPrice,
    clearCart,
  } = useCart()

  // Modal states
  const [removeModalVisible, setRemoveModalVisible] = useState(false)
  const [clearCartModalVisible, setClearCartModalVisible] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<string | null>(null)

  // Animation values for modals
  const removeModalOpacity = useSharedValue(0)
  const removeModalScale = useSharedValue(0.8)
  const clearModalOpacity = useSharedValue(0)
  const clearModalScale = useSharedValue(0.8)

  // Reload cart when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadCart()
    }, [loadCart]),
  )

  // Handle remove item
  const handleRemoveItem = (itemId: string) => {
    setItemToRemove(itemId)
    setRemoveModalVisible(true)
  }

  // Confirm remove item
  const confirmRemoveItem = async () => {
    if (itemToRemove) {
      await removeFromCart(itemToRemove)
      removeModalOpacity.value = withTiming(0, { duration: 200 })
      removeModalScale.value = withTiming(0.8, { duration: 200 })
      setTimeout(() => {
        setRemoveModalVisible(false)
        setItemToRemove(null)
      }, 200)
    }
  }

  // Handle clear cart
  const handleClearCart = () => {
    setClearCartModalVisible(true)
  }

  // Confirm clear cart
  const confirmClearCart = async () => {
    await clearCart()
    clearModalOpacity.value = withTiming(0, { duration: 200 })
    clearModalScale.value = withTiming(0.8, { duration: 200 })
    setTimeout(() => {
      setClearCartModalVisible(false)
    }, 200)
  }

  // Close remove modal with smooth animation
  const closeRemoveModal = () => {
    removeModalOpacity.value = withTiming(0, { duration: 200 })
    removeModalScale.value = withTiming(0.8, { duration: 200 })
    setTimeout(() => {
      setRemoveModalVisible(false)
    }, 200)
  }

  // Close clear cart modal with smooth animation
  const closeClearCartModal = () => {
    clearModalOpacity.value = withTiming(0, { duration: 200 })
    clearModalScale.value = withTiming(0.8, { duration: 200 })
    setTimeout(() => {
      setClearCartModalVisible(false)
    }, 200)
  }

  // Animate remove modal
  useEffect(() => {
    if (removeModalVisible) {
      removeModalOpacity.value = withTiming(1, { duration: 200 })
      removeModalScale.value = withSpring(1, { damping: 15, stiffness: 150 })
    }
  }, [removeModalVisible])

  // Animate clear modal
  useEffect(() => {
    if (clearCartModalVisible) {
      clearModalOpacity.value = withTiming(1, { duration: 200 })
      clearModalScale.value = withSpring(1, { damping: 15, stiffness: 150 })
    }
  }, [clearCartModalVisible])

  // Animated styles
  const removeModalBackdropStyle = useAnimatedStyle(() => ({
    opacity: removeModalOpacity.value,
  }))

  const removeModalContentStyle = useAnimatedStyle(() => ({
    opacity: removeModalOpacity.value,
    transform: [{ scale: removeModalScale.value }],
  }))

  const clearModalBackdropStyle = useAnimatedStyle(() => ({
    opacity: clearModalOpacity.value,
  }))

  const clearModalContentStyle = useAnimatedStyle(() => ({
    opacity: clearModalOpacity.value,
    transform: [{ scale: clearModalScale.value }],
  }))

  const truncateTitle = (title: string) => {
    if (title.length > 20) {
      return title.substring(0, 20) + "..."
    }
    return title
  }

  // MODIFIED: Simplified handleCheckout to directly navigate
  const handleCheckout = () => {
    const cartData = {
      items: cartItems.map(item => ({
        store: item?.store?.id,
        product: item?.id,
        product_name: item.title,
        amount: item.discounted_price || item.price,
        quantity: item.quantity
      })),
      total_amount: totalAmount,
      cart_summary: {
        total_items: cartLength,
        subtotal: totalAmount,
      },
    }

    router.push({
      pathname: "/(access)/(user_stacks)/delivery_details",
      params: { cartData: JSON.stringify(cartData) }
    })
  }

  // Remove Item Modal
  const RemoveItemModal = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={removeModalVisible}
      onRequestClose={closeRemoveModal}
    >
      <Animated.View
        style={[removeModalBackdropStyle]}
        className="flex-1 justify-center items-center bg-black/50"
      >
        <Animated.View
          style={[removeModalContentStyle]}
          className="bg-white rounded-2xl p-10 mx-5 w-[80%]"
        >
          <View className="items-center mb-4">
            <View className="bg-red-100 p-3 rounded-full mb-3">
              <MaterialIcons name="delete-outline" size={24} color="#F75F15" />
            </View>
            <Text
              className="text-xl font-semibold text-gray-900 mb-2"
              style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
            >
              Remove Item
            </Text>
            <Text className="text-base text-gray-600 text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Are you sure you want to remove this item from your cart?
            </Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={closeRemoveModal}
              className="flex-1 bg-gray-100 py-3 rounded-full items-center"
            >
              <Text className="text-gray-700 font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmRemoveItem}
              className="flex-1 bg-[#F75F15] py-3 rounded-full items-center"
              disabled={isUpdating}
            >
              <Text className="text-white font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )

  // Clear Cart Modal
  const ClearCartModal = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={clearCartModalVisible}
      onRequestClose={closeClearCartModal}
    >
      <Animated.View
        style={[clearModalBackdropStyle]}
        className="flex-1 justify-center items-center bg-black/50"
      >
        <Animated.View
          style={[clearModalContentStyle]}
          className="bg-white rounded-2xl p-10 mx-5 w-[80%]"
        >
          <View className="items-center mb-4">
            <View className="bg-orange-100 p-3 rounded-full mb-3">
              <Ionicons name="cart-outline" size={24} color="#F75F15" />
            </View>
            <Text
              className="text-xl font-semibold text-gray-900 mb-2"
              style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
            >
              Clear Cart
            </Text>
            <Text className="text-base text-gray-600 text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Are you sure you want to remove all items from your cart?
            </Text>
          </View>
          <View className="flex-row gap-3 pt-4">
            <TouchableOpacity
              onPress={closeClearCartModal}
              className="flex-1 bg-gray-100 py-3 rounded-full items-center"
            >
              <Text className="text-gray-700 font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmClearCart}
              className="flex-1 bg-[#F75F15] py-3 rounded-full items-center"
              disabled={isUpdating}
            >
              <Text className="text-white font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )

  // Render cart item with optimized quantity controls
  const renderCartItem = (item: any, index: number) => (
    <Animated.View
      key={item.id}
      entering={FadeInDown.duration(500)
        .delay(index * 100)
        .springify()}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
    >
      {item.isNewArrival && (
        <View className="absolute top-2 left-2 bg-orange-500 px-2 py-1 rounded-full z-10">
          <Text className="text-white text-xs font-semibold">New Arrival</Text>
        </View>
      )}
      <View className="flex-row items-center">
        {/* Product Image - FIXED: Now properly rounded */}
        <View className="mr-4">
          <Image
            source={{ uri: item.image }}
            className="w-20 h-20 rounded-2xl"
            resizeMode="cover"
          />
        </View>
        {/* Product Details */}
        <View className="flex-1">
          <Text
            className="text-sm font-semibold text-gray-800"
            style={{ fontFamily: "HankenGrotesk_400Regular" }}
            numberOfLines={2}
          >
            {truncateTitle(item.title)}
          </Text>
          <Text className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            {formatPrice(item.discounted_price || item.price)}
          </Text>
          {/* Quantity Controls - OPTIMIZED: Removed isUpdating checks for instant response */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center"
                disabled={item.quantity <= 1}
              >
                <MaterialIcons name="remove" size={16} color={item.quantity <= 1 ? "#ccc" : "#666"} />
              </TouchableOpacity>
              <Text className="mx-4 text-base font-semibold min-w-[24px] text-center" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                {item.quantity}
              </Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center"
                disabled={item.quantity >= item.stock_available}
              >
                <MaterialIcons name="add" size={16} color={item.quantity >= item.stock_available ? "#ccc" : "#666"} />
              </TouchableOpacity>
            </View>
            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.id)}
              className="w-10 h-10 bg-red-50 rounded-full items-center justify-center"
            >
              <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoading} />

      {/* Modals */}
      <RemoveItemModal />
      <ClearCartModal />

      <View className="px-5 pt-3 pb-4 border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <OnboardArrowTextHeader onPressBtn={() => router.back()} />
          <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            Cart
          </Text>
          {cartLength > 0 && (
            <TouchableOpacity onPress={handleClearCart} className="p-2 bg-neutral-100 rounded-full ">
              <Ionicons name="trash" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <>
        {cartLength === 0 && !isLoading ? (
          <View className="items-center justify-center flex-1 px-5">
            <Animated.View
              entering={FadeInDown.duration(500).springify()}
              className="bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center"
            >
              <Ionicons name="cart-outline" size={35} color={"#F75F15"} />
            </Animated.View>
            <Animated.View className="w-[60%]" entering={FadeInDown.duration(500).delay(200).springify()}>
              <Text className="text-xl pt-3 text-center" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Cart Empty
              </Text>
              <Text
                className="text-base text-center text-neutral-600 pt-2"
                style={{ fontFamily: "HankenGrotesk_400Regular" }}
              >
                Your cart's feeling lonely. Start adding what you love.
              </Text>
            </Animated.View>
            <Animated.View className="w-[50%] pt-5" entering={FadeInDown.duration(500).delay(400).springify()}>
              <SolidMainButton text="Start Shopping" onPress={() => router.push("/(access)/(user_tabs)/home")} />
            </Animated.View>
          </View>
        ) : (
          <View className="flex-1">
            <KeyboardAwareScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {cartItems.map((item, index) => renderCartItem(item, index))}
              <View className="h-20" />
            </KeyboardAwareScrollView>

            {/* Checkout Section */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(300).springify()}
              className="bg-white p-5 border-t border-gray-100"
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className="text-base font-semibold text-gray-600"
                  style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
                >
                  Total ({cartLength} {cartLength === 1 ? "item" : "items"})
                </Text>
                <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: "HankenGrotesk_700Bold" }}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>

              {/* Single Checkout Button */}
              <SolidMainButton
                text={"Checkout"}
                onPress={handleCheckout}
              />
            </Animated.View>
          </View>
        )}
      </>
    </SafeAreaView>
  )
}

export default Cart