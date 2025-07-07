import { View, Text, Image, TouchableOpacity, Dimensions, Animated, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { TextInput } from "react-native-gesture-handler"
import { StyleSheet } from "react-native"
import { useGetSingleStatus } from "@/hooks/mutations/sellerAuth"
import { useLocalSearchParams, router } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator } from "react-native"

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

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

const UserStatusView = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { singleStatusData, isLoading } = useGetSingleStatus(id)
  
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progressAnimations, setProgressAnimations] = useState<Animated.Value[]>([])
  const [isHolding, setIsHolding] = useState(false)
  const [messageText, setMessageText] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>(null)
  
  const statusData: StatusItem[] = singleStatusData?.data || []
  
  // Initialize progress animations
  useEffect(() => {
    if (statusData.length > 0) {
      const animations = statusData.map(() => new Animated.Value(0))
      setProgressAnimations(animations)
    }
  }, [statusData])
  
  // Auto-progress status every 5 seconds
  useEffect(() => {
    if (statusData.length === 0 || isPaused || isHolding) return
    
    const startProgress = () => {
      const currentAnimation = progressAnimations[currentStatusIndex]
      if (!currentAnimation) return
      
      currentAnimation.setValue(0)
      const animation = Animated.timing(currentAnimation, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      })
      
      currentAnimationRef.current = animation
      
      animation.start(({ finished }) => {
        if (finished && !isPaused && !isHolding) {
          moveToNextStatus()
        }
      })
    }
    
    startProgress()
    
    return () => {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop()
      }
    }
  }, [currentStatusIndex, statusData, isPaused, progressAnimations, isHolding])
  
  const moveToNextStatus = () => {
    if (currentStatusIndex < statusData.length - 1) {
      setCurrentStatusIndex(currentStatusIndex + 1)
    } else {
      router.back()
    }
  }
  
  const moveToPreviousStatus = () => {
    if (currentStatusIndex > 0) {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop()
      }
      progressAnimations[currentStatusIndex]?.setValue(0)
      
      setCurrentStatusIndex(currentStatusIndex - 1)
    }
  }
  
  const handleImagePressIn = () => {
    setIsHolding(true)
    if (currentAnimationRef.current) {
      currentAnimationRef.current.stop()
    }
  }
  
  const handleImagePressOut = () => {
    setIsHolding(false)
  }
  
  const handleTapLeft = () => {
    moveToPreviousStatus()
  }
  
  const handleTapRight = () => {
    moveToNextStatus()
  }

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Sending message:', messageText)
      setMessageText('')
    }
  }
  
  if (isLoading || statusData.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#F75F15" />
      </SafeAreaView>
    )
  }
  
  const currentStatus = statusData[currentStatusIndex]
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center pt-4 gap-1.5 px-4">
          {statusData.map((_, index) => (
            <View key={index} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              {index < currentStatusIndex ? (
                <View className="w-full h-full bg-white rounded-full" />
              ) : index === currentStatusIndex ? (
                <Animated.View
                  className="h-full bg-white rounded-full"
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
            >
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <View className="relative">
              <View className="w-11 h-11 rounded-full bg-gray-100 justify-center items-center overflow-hidden">
                <Image
                  source={require("../../../../assets/images/profile.png")}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </View>
              <View className="absolute -right-0.5 -top-0.5 rounded-full bg-white p-0.5">
                <MaterialIcons name="verified" color={"#4285F4"} size={12} />
              </View>
            </View>
            <View>
              <Text className="text-base text-white font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Store Name
              </Text>
              <Text className="text-xs text-white/60" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {new Date(currentStatus.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View>
            <SolidLightButton text="Follow" />
          </View>
        </View>

        {/* Main content area - image */}
        <View className="flex-1 relative">
          <TouchableOpacity
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            onPress={handleTapLeft}
            activeOpacity={1}
          />
          <TouchableOpacity
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            onPress={handleTapRight}
            activeOpacity={1}
          />
          
          <View className="flex-1 justify-center px-4">
            <View style={styles.imageContainer}>
              <View className="absolute inset-0 bg-neutral-950 rounded-xl" />
              
              <TouchableOpacity
                className="absolute inset-0 z-20"
                onPressIn={handleImagePressIn}
                onPressOut={handleImagePressOut}
                activeOpacity={1}
              >
                <Image 
                  source={{ uri: currentStatus.image_url }} 
                  style={styles.image}
                  resizeMode="contain"
                />
                
                {isHolding && (
                  <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 rounded-full p-3">
                    <MaterialIcons name="pause" size={24} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {currentStatus.content && (
            <View className="px-4 py-3">
              <Text className="text-white text-sm text-center leading-5" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {currentStatus.content}
              </Text>
            </View>
          )}
          
          <View className="flex-row justify-between mx-4 mb-4 gap-3">
            <View className="flex-1">
              <SolidMainButton text="Buy Now" />
            </View>
            <View className="flex-1">
              <SolidLightButton text="Add to Cart" />
            </View>
          </View>
        </View>
        
        <View className="px-4 pb-4">
          <View className="bg-neutral-800 rounded-full flex-row items-end p-2">
            <TextInput
              placeholder="Send a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={200}
              style={styles.whatsappInput}
              className="flex-1 text-white px-4 py-3"
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              className="bg-[#F75F15] rounded-full p-3 ml-2"
              disabled={!messageText.trim()}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
          {messageText.length > 0 && (
            <Text className="text-white/70 text-xs mt-2 text-right" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
              {messageText.length}/200
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default UserStatusView

const styles = StyleSheet.create({
  imageContainer: {
    aspectRatio: 1,
    overflow: 'hidden',
    maxHeight: screenHeight * 0.5,
    borderRadius: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  whatsappInput: {
    fontSize: 16,
    fontFamily: 'HankenGrotesk_400Regular',
    textAlignVertical: 'top',
    lineHeight: 20,
  },
})