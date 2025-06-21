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
  FadeIn, 
  FadeOut, 
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
      setRemoveModalVisible(false)
      setItemToRemove(null)
    }
  }

  // Handle clear cart
  const handleClearCart = () => {
    setClearCartModalVisible(true)
  }

  // Confirm clear cart
  const confirmClearCart = async () => {
    await clearCart()
    setClearCartModalVisible(false)
  }

  // Animate remove modal
  useEffect(() => {
    if (removeModalVisible) {
      removeModalOpacity.value = withTiming(1, { duration: 200 })
      removeModalScale.value = withSpring(1, { damping: 15, stiffness: 150 })
    } else {
      removeModalOpacity.value = withTiming(0, { duration: 150 })
      removeModalScale.value = withTiming(0.8, { duration: 150 })
    }
  }, [removeModalVisible])

  // Animate clear modal
  useEffect(() => {
    if (clearCartModalVisible) {
      clearModalOpacity.value = withTiming(1, { duration: 200 })
      clearModalScale.value = withSpring(1, { damping: 15, stiffness: 150 })
    } else {
      clearModalOpacity.value = withTiming(0, { duration: 150 })
      clearModalScale.value = withTiming(0.8, { duration: 150 })
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

  // Remove Item Modal
  const RemoveItemModal = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={removeModalVisible}
      onRequestClose={() => setRemoveModalVisible(false)}
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
              <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
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
              onPress={() => setRemoveModalVisible(false)}
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
      onRequestClose={() => setClearCartModalVisible(false)}
    >
      <Animated.View 
        style={[clearModalBackdropStyle]}
        className="flex-1 justify-center items-center bg-black/50"
      >
        <Animated.View
          style={[clearModalContentStyle]}
          className="bg-white rounded-2xl p-10 mx-5 w-[70%]"
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
              onPress={() => setClearCartModalVisible(false)}
              className="flex-1 bg-gray-100 py-3 rounded-full items-center"
            >
              <Text className="text-gray-700 font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmClearCart}
              className="flex-1 bg-orange-500 py-3 rounded-full items-center"
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

  // Render cart item
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
        {/* Product Image */}
        <View className="bg-blue-500 rounded-xl p-3 mr-4">
          <Image source={{ uri: item.image }} className="w-16 h-16 rounded-lg" resizeMode="contain" />
        </View>

        {/* Product Details */}
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-gray-800 mb-1"
            style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text className="text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: "HankenGrotesk_700Bold" }}>
            {formatPrice(item.discounted_price || item.price)}
          </Text>

          {/* Quantity Controls */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center"
                disabled={isUpdating || item.quantity <= 1}
              >
                <MaterialIcons name="remove" size={16} color="#666" />
              </TouchableOpacity>

              <Text className="mx-4 text-lg font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                {item.quantity}
              </Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center"
                disabled={isUpdating}
              >
                <MaterialIcons name="add" size={16} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.id)}
              className="w-10 h-10 bg-red-50 rounded-full items-center justify-center"
              disabled={isUpdating}
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
          <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            Cart
          </Text>
          {cartLength > 0 && (
            <TouchableOpacity onPress={handleClearCart} className="p-2">
              <MaterialIcons name="clear-all" size={30} color="#EF4444" />
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
                  className="text-lg font-semibold text-gray-600"
                  style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
                >
                  Total ({cartLength} {cartLength === 1 ? "item" : "items"})
                </Text>
                <Text className="text-2xl font-bold text-gray-900" style={{ fontFamily: "HankenGrotesk_700Bold" }}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>

              <SolidMainButton text="Checkout" onPress={() => router.push("/")} />
            </Animated.View>
          </View>
        )}
      </>
    </SafeAreaView>
  )
}

export default Cart