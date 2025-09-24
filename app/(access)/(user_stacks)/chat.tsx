"use client"

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  Linking,
  Animated,
  Keyboard,
} from "react-native"
import { useState, useEffect, useRef, useCallback } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { router, useLocalSearchParams, useFocusEffect } from "expo-router"
import { useContinueChat } from "@/hooks/mutations/chatAuth"
import { KeyboardAvoidingView } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Define the required interfaces
interface UserProfile {
  username: string
  fullname: string
  phone_number: string
  address: string
  profile_picture: string
}

interface Sender {
  id: string
  user_profile: UserProfile
}

interface Receiver {
  id?: string
  name: string
  category: string
  store_image_url: string
  store_image?: string
  description: string
  owner: string
  address1: string
}

interface ProductImage {
  id: number
  image: string | null
  image_url: string
}

interface Product {
  id: number
  product_images: ProductImage[]
  title: string
  description: string
  category: string
}

interface Message {
  chatbox: number
  content: string
  sender: Sender
  receiver: Receiver
  delivered: boolean
  product: Product | null
  created_at: string
  sender_id?: string
  receiver_id?: string
}

// Loading Dots Component
const LoadingDots = () => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current
  const dot2Opacity = useRef(new Animated.Value(0.3)).current
  const dot3Opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animateDots = () => {
      const duration = 600
      const delay = 200

      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start()

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start()
      }, delay)

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start()
      }, delay * 2)
    }

    animateDots()
    const interval = setInterval(animateDots, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <View className="flex-row items-center justify-center mb-4">
      <Animated.View 
        style={{ 
          opacity: dot1Opacity,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#F97316',
          marginHorizontal: 4
        }} 
      />
      <Animated.View 
        style={{ 
          opacity: dot2Opacity,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#F97316',
          marginHorizontal: 4
        }} 
      />
      <Animated.View 
        style={{ 
          opacity: dot3Opacity,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#F97316',
          marginHorizontal: 4
        }} 
      />
    </View>
  )
}

const ChatDetailScreen = () => {
  // WebSocket states
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [inputHeight, setInputHeight] = useState(40)
  const [chatPartnerInfo, setChatPartnerInfo] = useState<any>(null)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false) 
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  console.log("This is message:", messages)

  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const textInputRef = useRef<TextInput>(null)

  // Get route parameters
  const { roomId, isUserOnline, token, receiverName, receiverImage, receiverId } = useLocalSearchParams<{
    roomId: string
    token: string
    isUserOnline: string
    receiverName: string
    receiverImage: string
    receiverId: string
  }>()

  // Continue chat mutation
  const continueChat = useContinueChat(roomId)

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        // Scroll to bottom when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }
    )

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
      }
    )

    return () => {
      keyboardWillShowListener.remove()
      keyboardWillHideListener.remove()
    }
  }, [])

  // Function to detect and parse links and phone numbers
  const parseMessageContent = (content: string, isCurrentUser: boolean) => {
    // Regex patterns
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi
    const phoneRegex = /(\+?[\d\s\-\(\)]{7,})/g
    
    // Split content by both patterns
    const parts = content.split(/(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?|\+?[\d\s\-\(\)]{7,})/gi)
    
    return parts.map((part, index) => {
      const isUrl = urlRegex.test(part)
      const isPhone = phoneRegex.test(part) && part.trim().length >= 7
      
      // Reset regex lastIndex to avoid issues with global flag
      urlRegex.lastIndex = 0
      phoneRegex.lastIndex = 0
      
      if (isUrl || isPhone) {
        const handlePress = () => {
          if (isUrl) {
            let url = part
            if (!url.startsWith('http')) {
              url = `https://${url}`
            }
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err))
          } else if (isPhone) {
            const cleanPhone = part.replace(/[^\d+]/g, '')
            Linking.openURL(`tel:${cleanPhone}`).catch(err => console.error("Couldn't make call", err))
          }
        }

        return (
          <Text
            key={index}
            onPress={handlePress}
            style={{
              color: isCurrentUser ? 'white' : '#F97316',
              textDecorationLine: 'underline',
              fontWeight: '500',
            }}
          >
            {part}
          </Text>
        )
      }
      
      return <Text key={index}>{part}</Text>
    })
  }

  // Get user data from AsyncStorage
  const getUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id")
      if (userId) {
        setCurrentUserId(userId)
        console.log("Current user ID set to:", userId)
      }
    } catch (error) {
      console.error("Error getting user data from AsyncStorage:", error)
    }
  }

  // Clear messages when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setMessages([])
      setIsLoading(true)
      setIsPartnerOnline(isUserOnline === "true")
      getUserData()
      setChatPartnerInfo({
        name: receiverName,
        image: receiverImage,
        id: receiverId
      })
      if (roomId && token) {
        setTimeout(() => {
          connect()
        }, 100)
      }

      return () => {
        disconnect()
      }
    }, [roomId, token, receiverName, receiverImage, receiverId, isUserOnline])
  )

  // Check if message already exists (more strict checking)
  const messageExists = (newMessage: Message, existingMessages: Message[]) => {
    return existingMessages.some(msg => 
      msg.content === newMessage.content && 
      Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000 &&
      msg.sender.id === newMessage.sender.id
    )
  }

  // WebSocket connection function
  const connect = () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)

    try {
      const wsUrl = `wss://movbay.com/ws/chat/${roomId}/?token=${token}`
      ws.current = new WebSocket(wsUrl)
      ws.current.onopen = () => {
        console.log("WebSocket connected successfully")
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttempts.current = 0
        if (ws.current) {
          ws.current.send(JSON.stringify({
            type: 'user_presence',
            status: 'online'
          }))
        }
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'new_message' && data.message) {
            console.log("Processing new message:", data.message)
            handleNewMessage(data.message)
          } else if (data.type === 'user_presence') {
            if (data.user_id !== currentUserId) {
              setIsPartnerOnline(data.status === 'online')
              console.log(`Partner ${data.user_id} is now ${data.status}`)
            }
          } else if (data.type === 'partner_status') {
            setIsPartnerOnline(data.is_online)
            console.log("Partner online status:", data.is_online)
          } else if (Array.isArray(data)) {
            console.log("Received messages array:", data.length, "messages")
            handleMessagesArray(data)
          } else if (data.messages && Array.isArray(data.messages)) {
            console.log("Received wrapped messages:", data.messages.length, "messages")
            handleMessagesArray(data.messages)
          } else if (data.type === 'chat_history' && data.messages) {
            console.log("Received chat history:", data.messages.length)
            handleMessagesArray(data.messages)
          } else {
            if (data.chatbox && data.content && data.sender) {
              console.log("Processing direct message object:", data)
              handleNewMessage(data)
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error, event.data)
        }
      }

      ws.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        setIsPartnerOnline(false) // Partner goes offline when WebSocket disconnects

        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`)

          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnecting(false)
        setIsPartnerOnline(false)
      }
    } catch (error) {
      console.error("Error creating WebSocket connection:", error)
      setIsConnecting(false)
    }
  }

  // Handle new single message with improved scrolling
  const handleNewMessage = (newMessage: Message) => {
    setMessages(prevMessages => {
      if (messageExists(newMessage, prevMessages)) {
        console.log("Message already exists, skipping")
        return prevMessages
      }
      const updatedMessages = [...prevMessages, newMessage]
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 150)
      
      return updatedMessages
    })
  }

  // Handle array of messages (initial load or batch update)
  const handleMessagesArray = (newMessages: Message[]) => {
    console.log("Setting messages array:", newMessages.length, "messages")
    setIsLoading(false)
    setMessages(newMessages)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false })
    }, 200)
  }

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }

    if (ws.current) {
      // Send offline status before closing
      try {
        ws.current.send(JSON.stringify({
          type: 'user_presence',
          status: 'offline'
        }))
      } catch (error) {
        console.log("Could not send offline status:", error)
      }
      
      ws.current.close(1000, "User disconnected")
      ws.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setIsPartnerOnline(false)
    reconnectAttempts.current = 0
  }

  const retry = () => {
    reconnectAttempts.current = 0
    connect()
  }

  // Send message function with improved UX
  const sendMessage = async () => {
    if (!messageText.trim() || continueChat.isPending) return

    const messageContent = messageText.trim()
    setMessageText("")
    setInputHeight(40)

    try {
      await continueChat.mutateAsync({
        content: messageContent
      })

    } catch (error) {
      console.error("Error sending message:", error)
      setMessageText(messageContent)
    }
  }

  // Handle input content size change (for multiline)
  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 100)
    setInputHeight(newHeight)
  }

  // Auto-scroll when input height changes
  useEffect(() => {
    if (inputHeight > 40) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [inputHeight])

  // Options menu handlers
  const handleBlock = () => {
    setShowOptionsMenu(false)
    Alert.alert(
      "Block User",
      "Are you sure you want to block this user? They won't be able to contact you anymore.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => {
          console.log("Block user")
        }}
      ]
    )
  }

  const handleReport = () => {
    setShowOptionsMenu(false)
    Alert.alert(
      "Report User",
      "Please let us know why you're reporting this user.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Report", style: "destructive", onPress: () => {
          console.log("Report user")
        }}
      ]
    )
  }

  const handleClearChat = () => {
    setShowOptionsMenu(false)
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => {
          setMessages([])
        }}
      ]
    )
  }

  // Request chat history when connected
  useEffect(() => {
    if (isConnected && ws.current) {
      const historyRequest = {
        type: "get_chat_history",
        room: roomId,
        isUserOnline: isUserOnline
      }
      console.log("Requesting chat history:", historyRequest)
      ws.current.send(JSON.stringify(historyRequest))
      
      // Set a timeout to hide loading after 3 seconds if no messages received
      setTimeout(() => {
        if (messages.length === 0) {
          setIsLoading(false)
        }
      }, 3000)
    }
  }, [isConnected, roomId, isUserOnline])

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  // Render delivery status icon based on online status
  const renderDeliveryStatus = (message: Message, isCurrentUser: boolean) => {
    if (!isCurrentUser) return null

    // Show double tick (delivered and read) if partner is online, single tick if offline
    if (isPartnerOnline && isConnected) {
      return <Ionicons name="checkmark-done" size={14} color="#10B981" />
    } else {
      return <Ionicons name="checkmark" size={14} color="#6B7280" />
    }
  }

  // Render individual message
  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = currentUserId && (message.sender?.id === currentUserId || message.sender_id === currentUserId)
    const shouldShowProduct = message.product && message.product.id > 0

    // Get the appropriate profile image and name for the message
    const messageProfile = isCurrentUser ? {
      image: message.sender?.user_profile?.profile_picture || "",
      name: message.sender?.user_profile?.fullname || "You"
    } : {
      image: message.sender?.user_profile?.profile_picture || chatPartnerInfo?.image || "",
      name: message.sender?.user_profile?.fullname || chatPartnerInfo?.name || "Unknown"
    }
    
    return (
      <View key={`${message.sender.id}-${message.created_at}-${index}`} className="px-4 mb-4">
        <View className={`flex-row ${isCurrentUser ? "justify-end" : "justify-start"}`}>
          {!isCurrentUser && (
            <Image
              source={{
                uri: messageProfile.image || "",
              }}
              className="w-8 h-8 rounded-full mr-2 mt-0.5"
              style={{ marginTop: 2 }}
            />
          )}

          <View className={`max-w-[85%] ${isCurrentUser ? "items-end" : "items-start"}`}>
            {shouldShowProduct && (
              <View className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 mb-2 w-full max-w-[280px]">
                <View className="w-full">
                  {message.product!.product_images.length > 0 && (
                    <View className="w-full mb-3">
                      <Image
                        source={{ uri: message.product!.product_images[0].image_url }}
                        className="w-full h-40 rounded-xl"
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  <Text
                    className="text-gray-900 text-sm font-medium leading-5"
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    numberOfLines={2}
                  >
                    {message.product!.title}
                  </Text>
                  {message.product!.description && (
                    <Text
                      className="text-gray-600 text-xs mt-1"
                      style={{ fontFamily: "HankenGrotesk_400Regular" }}
                      numberOfLines={1}
                    >
                      {message.product!.description}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View
              className={`rounded-2xl px-4 py-3 max-w-[280px] ${
                isCurrentUser ? "bg-[#F75F15] rounded-tr-sm" : "bg-gray-200 rounded-tl-sm"
              }`}
            >
              <Text
                className={`text-base leading-5 ${isCurrentUser ? "text-white" : "text-gray-900"}`}
                style={{ fontFamily: "HankenGrotesk_400Regular" }}
              >
                {parseMessageContent(message.content, !!isCurrentUser)}
              </Text>
            </View>

            <View className={`flex-row items-center mt-1 px-1`}>
              <Text className="text-xs text-gray-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {formatTime(message.created_at)}
              </Text>
              {isCurrentUser && (
                <View className="ml-1">
                  {renderDeliveryStatus(message, isCurrentUser)}
                </View>
              )}
            </View>
          </View>

          {isCurrentUser && (
            <Image
              source={{ 
                uri: messageProfile.image || ''
              }}
              className="w-8 h-8 rounded-full ml-2 mt-0.5"
              style={{ marginTop: 2 }}
            />
          )}
        </View>
      </View>
    )
  }

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>

        {chatPartnerInfo ? (
          <View className="flex-row items-center flex-1">
            <View className="relative mr-3">
              {chatPartnerInfo.image ? (
                <Image
                  source={{ uri: chatPartnerInfo.image }}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center">
                  <Ionicons name="storefront" size={20} color="#F97316" />
                </View>
              )}
              {isPartnerOnline && isConnected && (
                <View className="absolute bottom-0 -right-2 w-4 h-4 bg-green-600 border-2 border-white rounded-full" />
              )}
            </View>

            <View className="flex-1">
              <Text
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
                className="text-gray-900 text-base mb-1"
              >
                {chatPartnerInfo.name}
              </Text>
              <View className="flex-row items-center">
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className={`text-xs ${
                    isPartnerOnline && isConnected
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {isPartnerOnline && isConnected ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text
            className="text-lg font-medium flex-1"
            style={{ fontFamily: "HankenGrotesk_500Medium" }}
          >
            Chat
          </Text>
        )}

        <View className="flex-row items-center relative">
          {!isConnected && !isConnecting && (
            <TouchableOpacity onPress={() => {
              reconnectAttempts.current = 0
              ws.current?.close()
            }} className="p-2 mr-1">
              <Ionicons name="refresh" size={20} color="#F97316" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="p-2"
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#6B7280" />
          </TouchableOpacity>

          {showOptionsMenu && (
            <View className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[140px]">
              <TouchableOpacity onPress={handleBlock} className="flex-row items-center px-4 py-3">
                <Ionicons name="ban-outline" size={18} color="#EF4444" />
                <Text className="ml-3 text-red-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Block
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleReport} className="flex-row items-center px-4 py-3">
                <Ionicons name="flag-outline" size={18} color="#EF4444" />
                <Text className="ml-3 text-red-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Report
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClearChat} className="flex-row items-center px-4 py-3">
                <Ionicons name="trash-outline" size={18} color="#6B7280" />
                <Text className="ml-3 text-gray-700" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Clear Chat
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Close options menu overlay */}
        {showOptionsMenu && (
          <TouchableOpacity
            className="absolute inset-0 z-40"
            onPress={() => setShowOptionsMenu(false)}
          />
        )}
      </View>

      {/* The KEY CHANGE HERE: Wrap ScrollView and Input Section in a single flex:1 View */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={{ flex: 1 }}>
          {/* Messages Container */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 4,
              flexGrow: 1,
              justifyContent: messages.length === 0 ? "center" : "flex-start", // center if no messages
            }}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 50,
            }}
          >
            {isLoading ? (
              <View className="flex-1 justify-center items-center px-4 min-h-[400px]">
                <LoadingDots />
                <Text
                  className="text-sm text-gray-500 text-center"
                  style={{ fontFamily: "HankenGrotesk_400Regular" }}
                >
                  Loading messages...
                </Text>
              </View>
            ) : messages.length > 0 ? (
              messages.map((message, index) => renderMessage(message, index))
            ) : (
              <View className="flex-1 justify-center items-center px-4 min-h-[400px]">
                <View className="bg-white rounded-full p-6 shadow-sm mb-4">
                  <Ionicons
                    name="chatbubbles-outline"
                    size={48}
                    color="#F97316"
                  />
                </View>
                <Text
                  className="text-lg mb-2 text-gray-700 text-center"
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                >
                  No messages yet
                </Text>
                <Text
                  className="text-sm text-gray-500 text-center"
                  style={{ fontFamily: "HankenGrotesk_400Regular" }}
                >
                  Start a conversation with this store
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Input Section */}
          {!isLoading && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === "android" ? 8 : 8,
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
                backgroundColor: "white",
              }}
            >
              <View
                className="bg-neutral-200 rounded-full flex-row items-end px-2 py-1 "
                style={{ flexDirection: "row", alignItems: "flex-end" }}
              >
                <TextInput
                  ref={textInputRef}
                  placeholder="Send a Message"
                  placeholderTextColor="#9CA3AF"
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={1000}
                  style={[
                    styles.whatsappInput,
                    { height: Math.max(40, inputHeight), flex: 1, paddingHorizontal: 8 },
                  ]}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onContentSizeChange={handleContentSizeChange}
                  textAlignVertical="center"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true })
                    }, 300)
                  }}
                  scrollEnabled={true}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  style={{
                    borderRadius: 50,
                    padding: 12,
                    marginLeft: 8,
                    backgroundColor:
                      !messageText.trim() || continueChat.isPending
                        ? "gray"
                        : "#F75F15",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  disabled={!messageText.trim() || continueChat.isPending}
                >
                  <MaterialIcons
                    name={continueChat.isPending ? "hourglass-top" : "send"}
                    size={18}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default ChatDetailScreen

const styles = StyleSheet.create({
  whatsappInput: {
    fontSize: 14,
    fontFamily: 'HankenGrotesk_400Regular',
    textAlignVertical: 'top',
    lineHeight: 20,
    minHeight: 40,
    maxHeight: 100,
    color: '#374151',
  },
})