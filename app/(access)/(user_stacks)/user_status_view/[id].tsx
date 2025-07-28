import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { TextInput } from "react-native-gesture-handler"
import { useGetSingleStatus } from "@/hooks/mutations/sellerAuth"
import { useLocalSearchParams, router } from "expo-router"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// Reduced status duration to 30 seconds
const STATUS_DURATION = 10000

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

const UserStatusView = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { singleStatusData, isLoading } = useGetSingleStatus(id)
  
  // State management
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progressAnimations, setProgressAnimations] = useState<Animated.Value[]>([])
  const [isHolding, setIsHolding] = useState(false)
  const [messageText, setMessageText] = useState('')
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
  
  // Initialize progress animations - optimized to run only when statusData changes
  useEffect(() => {
    if (statusData.length > 0 && progressAnimations.length !== statusData.length) {
      const animations = statusData.map(() => new Animated.Value(0))
      setProgressAnimations(animations)
      
      // Initialize image loading states more efficiently
      setImageLoadingStates(
        statusData.reduce((acc, _, index) => {
          acc[index] = true
          return acc
        }, {} as ImageLoadingState)
      )
    }
  }, [statusData.length])
  
  // Memoized current status
  const currentStatus = useMemo(() => 
    statusData[currentStatusIndex], 
    [statusData, currentStatusIndex]
  )
  
  // Optimized auto-progress with cleanup
  useEffect(() => {
    if (statusData.length === 0 || isPaused || isHolding) {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop()
      }
      return
    }
    
    const currentAnimation = progressAnimations[currentStatusIndex]
    if (!currentAnimation) return
    
    // Reset current animation
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
  
  // Navigation functions with better performance
  const moveToNextStatus = useCallback(() => {
    if (currentStatusIndex < statusData.length - 1) {
      setCurrentStatusIndex(prev => prev + 1)
    } else {
      router.back()
    }
  }, [currentStatusIndex, statusData.length])
  
  const moveToPreviousStatus = useCallback(() => {
    if (currentStatusIndex > 0) {
      // Stop current animation
      currentAnimationRef.current?.stop()
      progressAnimations[currentStatusIndex]?.setValue(0)
      
      setCurrentStatusIndex(prev => prev - 1)
    }
  }, [currentStatusIndex, progressAnimations])
  
  // Touch handlers with improved performance
  const handleImagePressIn = useCallback(() => {
    setIsHolding(true)
    currentAnimationRef.current?.stop()
  }, [])
  
  const handleImagePressOut = useCallback(() => {
    setIsHolding(false)
  }, [])
  
  // Tap handlers
  const handleTapLeft = useCallback(() => {
    moveToPreviousStatus()
  }, [moveToPreviousStatus])
  
  const handleTapRight = useCallback(() => {
    moveToNextStatus()
  }, [moveToNextStatus])

  // Message handling
  const handleSendMessage = useCallback(() => {
    if (messageText.trim()) {
      console.log('Sending message:', messageText)
      setMessageText('')
    }
  }, [messageText])
  
  // Image loading handlers - optimized with single state update
  const handleImageLoad = useCallback((index: number) => {
    setImageLoadingStates(prev => ({ ...prev, [index]: false }))
  }, [])
  
  const handleImageLoadStart = useCallback((index: number) => {
    setImageLoadingStates(prev => ({ ...prev, [index]: true }))
  }, [])
  
  const handleImageError = useCallback((index: number) => {
    setImageLoadingStates(prev => ({ ...prev, [index]: false }))
  }, [])
  
  // Memoized formatted date
  const formattedDate = useMemo(() => {
    return currentStatus ? new Date(currentStatus.created_at).toLocaleDateString() : ''
  }, [currentStatus?.created_at])
  
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
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
                    width: progressAnimations[index]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) || '0%',
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
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-1"
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            
            <View className="relative">
              <View className="w-11 h-11 rounded-full bg-gray-100 justify-center items-center overflow-hidden">
                <Image
                  source={require("../../../../assets/images/profile.png")}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <View className="absolute -right-0.5 -top-0.5 rounded-lg bg-white p-0.5">
                <MaterialIcons name="verified" color="#4285F4" size={12} />
              </View>
            </View>
            
            <View>
              <Text className="text-base text-white font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Store Name
              </Text>
              <Text className="text-xs text-white/60" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {formattedDate}
              </Text>
            </View>
          </View>
          
          <View>
            <SolidLightButton text="Follow" />
          </View>
        </View>

        {/* Main content area - image */}
        <View className="flex-1 relative">
          {/* Left tap area */}
          <TouchableOpacity
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            onPress={handleTapLeft}
            activeOpacity={1}
          />
          
          {/* Right tap area */}
          <TouchableOpacity
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            onPress={handleTapRight}
            activeOpacity={1}
          />
          
          {/* Image section */}
          <View className="flex-1 justify-center px-4">
            <View 
              className="aspect-square overflow-hidden rounded-xl relative bg-neutral-950"
              style={{ maxHeight: screenHeight * 0.5 }}
            >
              <TouchableOpacity
                className="absolute inset-0 z-20"
                onPressIn={handleImagePressIn}
                onPressOut={handleImagePressOut}
                activeOpacity={1}
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
                      top: '50%',
                      left: '50%',
                      transform: [{ translateX: -20 }, { translateY: -20 }]
                    }}
                  >
                    <MaterialIcons name="pause" size={24} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
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
          
          {/* Action buttons */}
          <View className="flex-row justify-between mx-4 my-4 gap-3">
            <View className="flex-1">
              <SolidMainButton text="Buy Now" />
            </View>
            <View className="flex-1">
              <SolidLightButton text="Add to Cart" />
            </View>
          </View>
        </View>
        
        {/* Message input */}
        <View className="px-4 pb-4">
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
                fontFamily: 'HankenGrotesk_400Regular',
                textAlignVertical: 'top',
                maxHeight: 100
              }}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              className="bg-orange-500 rounded-full p-3 ml-2"
              style={{ opacity: messageText.trim() ? 1 : 0.5 }}
              disabled={!messageText.trim()}
              activeOpacity={0.8}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {messageText.length > 0 && (
            <Text 
              className="text-white/70 text-xs mt-2 text-right"
              style={{ fontFamily: 'HankenGrotesk_400Regular' }}
            >
              {messageText.length}/200
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default UserStatusView