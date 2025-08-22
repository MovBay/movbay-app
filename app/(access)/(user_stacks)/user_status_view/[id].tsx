"use client"

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { TextInput } from "react-native-gesture-handler"
import {
  useFollowStore,
  useGetFollowedStores,
  useGetOpenStore,
  useGetSingleStatus,
  useGetStore,
  useUnFollowStore,
} from "@/hooks/mutations/sellerAuth"
import { useLocalSearchParams, router } from "expo-router"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Toast } from "react-native-toast-notifications"
import { Ionicons } from "@expo/vector-icons"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
const STATUS_DURATION = 15000

interface StatusItem {
  id: number
  content: string
  created_at: string
  expires_at: string
  image: string | null
  image_url: string
  product: any
  store: number
}

interface ImageLoadingState {
  [key: number]: boolean
}

const isStoreFollowed = (storeId: any, followedStores: any) => {
  if (!followedStores || !Array.isArray(followedStores)) return false
  return followedStores.some((item) => item.followed_store.id === storeId)
}

const UserStatusView = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { singleStatusData, isLoading } = useGetSingleStatus(id)

  const { storeData, isLoading: storeDataLoading } = useGetStore()
  const { openStore, isLoading: openStoreLoading } = useGetOpenStore(singleStatusData?.data[0]?.store)
  const openStoreData = openStore?.data
  const storeId = openStoreData?.id

  console.log("This is single own status data", openStoreData)

  const { getFollowedStores } = useGetFollowedStores()

  const followedStoresData = getFollowedStores?.data || []
  const isCurrentStoreFollowed = isStoreFollowed(storeId, followedStoresData)

  // Convert storeId to proper type for hooks
  const numericStoreId = Number.parseInt(storeId?.toString() || "0")
  const { isPending, mutate } = useFollowStore(numericStoreId)
  const { isPending: unFollowPending, mutate: unfollowMutate } = useUnFollowStore(numericStoreId)

  const handleFollowUnfollowStore = async () => {
    if (!storeId) {
      Toast.show("Store ID not found", { type: "error" })
      return
    }

    try {
      if (isCurrentStoreFollowed) {
        await unfollowMutate(numericStoreId)
        // Toast.show("Store unfollowed successfully", { type: "success" })
      } else {
        await mutate(numericStoreId)
        // Toast.show("Store followed successfully", { type: "success" })
      }
    } catch (error) {
      console.error("Error following/unfollowing store:", error)
      const errorMessage = isCurrentStoreFollowed ? "Failed to unfollow store" : "Failed to follow store"
      Toast.show(errorMessage, { type: "error" })
    }
  }

  // State management
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progressAnimations, setProgressAnimations] = useState<Animated.Value[]>([])
  const [isHolding, setIsHolding] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [imageLoadingStates, setImageLoadingStates] = useState<ImageLoadingState>({})

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>(null)
  const statusDataRef = useRef<StatusItem[]>([])

  // Memoized status data
  const statusData: StatusItem[] = useMemo(() => {
    const data = singleStatusData?.data || []
    statusDataRef.current = data
    return data
  }, [singleStatusData?.data])

  // Initialize progress animations
  useEffect(() => {
    if (statusData.length > 0 && progressAnimations.length !== statusData.length) {
      const animations = statusData.map(() => new Animated.Value(0))
      setProgressAnimations(animations)

      setImageLoadingStates(
        statusData.reduce((acc, _, index) => {
          acc[index] = true
          return acc
        }, {} as ImageLoadingState),
      )
    }
  }, [statusData.length])

  // Memoized current status
  const currentStatus = useMemo(() => statusData[currentStatusIndex], [statusData, currentStatusIndex])

  // Auto-progress with cleanup
  useEffect(() => {
    if (statusData.length === 0 || isPaused || isHolding) {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop()
      }
      return
    }

    const currentAnimation = progressAnimations[currentStatusIndex]
    if (!currentAnimation) return

    currentAnimation.setValue(0)

    const animation = Animated.timing(currentAnimation, {
      toValue: 1,
      duration: STATUS_DURATION,
      useNativeDriver: false,
    })

    currentAnimationRef.current = animation

    animation.start(({ finished }) => {
      if (finished && !isPaused && !isHolding) {
        moveToNextStatus()
      }
    })

    return () => {
      animation.stop()
    }
  }, [currentStatusIndex, statusData.length, isPaused, isHolding, progressAnimations])

  // Navigation functions
  const moveToNextStatus = useCallback(() => {
    if (currentStatusIndex < statusData.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1)
    } else {
      router.back()
    }
  }, [currentStatusIndex, statusData.length])

  const moveToPreviousStatus = useCallback(() => {
    if (currentStatusIndex > 0) {
      currentAnimationRef.current?.stop()
      progressAnimations[currentStatusIndex]?.setValue(0)

      setCurrentStatusIndex((prev) => prev - 1)
    }
  }, [currentStatusIndex, progressAnimations])

  // Touch handlers for pause functionality
  const handleContentPressIn = useCallback(() => {
    setIsHolding(true)
    currentAnimationRef.current?.stop()
  }, [])

  const handleContentPressOut = useCallback(() => {
    setIsHolding(false)
  }, [])

  // Message handling
  const handleSendMessage = useCallback(() => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText)
      setMessageText("")
    }
  }, [messageText])

  // Image loading handlers
  const handleImageLoad = useCallback((index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }))
  }, [])

  const handleImageLoadStart = useCallback((index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: true }))
  }, [])

  const handleImageError = useCallback((index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }))
  }, [])

  // Memoized formatted date
  const formattedDate = useMemo(() => {
    return currentStatus ? new Date(currentStatus.created_at).toLocaleDateString() : ""
  }, [currentStatus])

  // Loading state
  if (isLoading || statusData.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#F75F15" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {/* Progress bars */}
        <View className="flex-row items-center pt-4 gap-1.5 px-4">
          {statusData.map((_, index) => (
            <View key={index} className="flex-1 h-1 bg-white/20 rounded-sm overflow-hidden">
              {index < currentStatusIndex ? (
                <View className="w-full h-full bg-white rounded-sm" />
              ) : index === currentStatusIndex ? (
                <Animated.View
                  className="h-full bg-white rounded-sm"
                  style={{
                    width:
                      progressAnimations[index]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }) || "0%",
                  }}
                />
              ) : (
                <View className="w-full h-full bg-transparent" />
              )}
            </View>
          ))}
        </View>

        {/* Header with profile and follow button */}
        <View className="flex-row justify-between items-center px-4 mt-4 mb-3">
          {openStoreLoading ? (
            <ActivityIndicator size="small" color="#F75F15" />
          ) : (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.back()} className="p-1" activeOpacity={0.7}>
                <MaterialIcons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>

              <View className="relative">
                <View className="w-11 h-11 rounded-full bg-gray-100 justify-center items-center overflow-hidden">
                  <Image source={{ uri: openStoreData?.store_image }} className="w-full h-full" resizeMode="cover" />
                </View>
                <View className="absolute -right-0.5 -top-0.5 rounded-lg bg-white p-0.5">
                  <MaterialIcons name="verified" color="#4285F4" size={12} />
                </View>
              </View>

              <View>
                <Text className="text-base text-white font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {openStoreData?.name}
                </Text>
                <Text className="text-xs text-white/60" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  {formattedDate}
                </Text>
              </View>
            </View>
          )}

          {storeData?.data?.id !== storeId && (
            <>
              {isPending || unFollowPending ? (
                <TouchableOpacity className="bg-[#FEEEE6] px-6 py-2.5 rounded-full" disabled>
                  <ActivityIndicator size="small" color="#A53F0E" />
                </TouchableOpacity>
              ) : (
                <View>
                  {isCurrentStoreFollowed ? (
                    <SolidLightButton text="unfollow" onPress={handleFollowUnfollowStore} />
                  ) : (
                    <SolidLightButton text="Follow" onPress={handleFollowUnfollowStore} />
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* Main content area */}
        <TouchableOpacity
          className="flex-1 relative"
          onPressIn={handleContentPressIn}
          onPressOut={handleContentPressOut}
          activeOpacity={1}
        >
          {/* Image section with pause functionality - but excluding arrow areas */}
          <View className="flex-1 justify-center px-4">
            <View
              className="aspect-square overflow-hidden rounded-xl relative bg-neutral-950"
              style={{ maxHeight: screenHeight * 0.5 }}
            >
              <Image
                source={{ uri: currentStatus.image_url }}
                className="w-full h-full rounded-xl"
                resizeMode="contain"
                onLoadStart={() => handleImageLoadStart(currentStatusIndex)}
                onLoad={() => handleImageLoad(currentStatusIndex)}
                onError={() => handleImageError(currentStatusIndex)}
              />

              {/* Image loading indicator */}
              {imageLoadingStates[currentStatusIndex] && (
                <View className="absolute inset-0 justify-center items-center bg-black/30 rounded-xl">
                  <ActivityIndicator size="large" color="#F75F15" />
                </View>
              )}

              {/* Pause indicator when holding */}
              {isHolding && (
                <View
                  className="absolute bg-black/60 rounded-2xl p-3"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: [{ translateX: -20 }, { translateY: -20 }],
                  }}
                >
                  <MaterialIcons name="pause" size={24} color="white" />
                </View>
              )}
            </View>
          </View>

          {/* Navigation arrows - positioned absolutely over the image */}
          <View className="absolute inset-0 flex-row justify-between items-center px-6 pointer-events-box-none">
            {/* Left arrow */}
            <TouchableOpacity
              onPress={moveToPreviousStatus}
              className="bg-black/50 rounded-full p-3 pointer-events-auto"
              style={{
                opacity: currentStatusIndex > 0 ? 1 : 0.3,
              }}
              disabled={currentStatusIndex === 0}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chevron-left" size={28} color="white" />
            </TouchableOpacity>

            {/* Right arrow */}
            <TouchableOpacity
              onPress={moveToNextStatus}
              className="bg-black/50 rounded-full p-3 pointer-events-auto"
              style={{
                opacity: currentStatusIndex < statusData.length - 1 ? 1 : 0.3,
              }}
              disabled={currentStatusIndex >= statusData.length - 1}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chevron-right" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Status content text */}
          {currentStatus.content && (
            <View className="px-4 py-3">
              <Text
                className="text-white text-base text-center leading-5"
                style={{ fontFamily: "HankenGrotesk_400Regular" }}
              >
                {currentStatus.content}
              </Text>
            </View>
          )}

        </TouchableOpacity>

        {storeDataLoading? <>
          <Text className="text-neutral-500 text-sm" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Loading . . .</Text>
        </> : <>
        
          {storeData?.data?.id !== storeId && (
            <View className="flex-row justify-between mx-4 my-4 gap-3 pointer-events-auto">
              <View className="flex-1">
                <SolidMainButton text="Buy Now" />
              </View>
              <View className="flex-1">
                <SolidLightButton text="Add to Cart" />
              </View>
            </View>
          )}

          {storeData?.data?.id !== storeId && (
            <View className="px-4 pb-4 w-full">

              <View className="flex-row justify-between items-center w-full">

                <View className="bg-neutral-900 rounded-full flex-row items-end p-2">
                  <TextInput
                    placeholder="Send a message..."
                    placeholderTextColor="#9CA3AF"
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={200}
                    className="flex-1 text-white px-4 py-3 text-base leading-5"
                    style={{
                      fontFamily: "HankenGrotesk_400Regular",
                      textAlignVertical: "top",
                      maxHeight: 100,
                    }}
                    returnKeyType="send"
                    onSubmitEditing={handleSendMessage}
                  />
                  <TouchableOpacity
                    onPress={handleSendMessage}
                    className="bg-[#F75F15] rounded-full p-3 px-5 ml-2"
                    style={{ opacity: messageText.trim() ? 1 : 0.5 }}
                    disabled={!messageText.trim()}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="send" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {messageText.length > 0 && (
                <Text
                  className="text-white/70 text-xs mt-2 text-right"
                  style={{ fontFamily: "HankenGrotesk_400Regular" }}
                >
                  {messageText.length}/200
                </Text>
              )}
            </View>
          )}
        </>}


      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default UserStatusView
