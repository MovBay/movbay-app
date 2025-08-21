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
} from "react-native"
import { useState, useEffect, useRef, useCallback } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { router, useLocalSearchParams, useFocusEffect } from "expo-router"
import { useContinueChat } from "@/hooks/mutations/chatAuth"
import { KeyboardAvoidingView } from "react-native"

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
  name: string
  category: string
  store_image_url: string
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

  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const textInputRef = useRef<TextInput>(null)

  // Get route parameters
  const { roomId, token } = useLocalSearchParams<{
    roomId: string
    token: string
  }>()

  // Continue chat mutation
  const continueChat = useContinueChat(roomId)

  // NOTE: The previous keyboard listeners were removed.
  // We'll rely solely on KeyboardAvoidingView and its behavior for a more reliable experience.

  // Clear messages when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused - clearing messages and reconnecting")
      setMessages([])
      setCurrentUserId(null)
      setIsLoading(true)
      
      // Reconnect WebSocket
      if (roomId && token) {
        setTimeout(() => {
          connect()
        }, 100)
      }

      return () => {
        disconnect()
      }
    }, [roomId, token])
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
      const wsUrl = `ws://movbay.com/ws/chat/${roomId}/?token=${token}`
      console.log("Connecting to WebSocket:", wsUrl)

      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log("WebSocket connected successfully")
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received WebSocket data:", data)
          
          // Handle different message types
          if (data.type === 'new_message' && data.message) {
            console.log("Processing new message:", data.message)
            handleNewMessage(data.message)
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
      }
    } catch (error) {
      console.error("Error creating WebSocket connection:", error)
      setIsConnecting(false)
    }
  }

  // Handle new single message with improved scrolling
  const handleNewMessage = (newMessage: Message) => {
    console.log("Adding new message to UI:", newMessage.content)
    
    setMessages(prevMessages => {
      // Check if message already exists
      if (messageExists(newMessage, prevMessages)) {
        console.log("Message already exists, skipping")
        return prevMessages
      }

      // Add the new message
      const updatedMessages = [...prevMessages, newMessage]
      
      // Scroll to bottom after adding message with a longer delay for better UX
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
    
    // Set current user ID if not set
    if (newMessages.length > 0 && !currentUserId) {
      // Find the current user ID from the messages
      // This assumes the first message helps identify current user
      setCurrentUserId(newMessages[0].sender.id)
    }

    setMessages(newMessages)
    
    // Scroll to bottom after loading messages
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
      ws.current.close(1000, "User disconnected")
      ws.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
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
    
    // Clear input immediately
    setMessageText("")
    setInputHeight(40) // Reset input height

    try {
      // Send via HTTP API - message will appear via WebSocket once confirmed
      await continueChat.mutateAsync({
        content: messageContent
      })

      console.log("Message sent successfully via HTTP")

    } catch (error) {
      console.error("Error sending message:", error)
      // Restore message text on failure
      setMessageText(messageContent)
    }
  }

  // Handle input content size change (for multiline)
  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 100)
    setInputHeight(newHeight)
  }

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
        room: roomId
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
  }, [isConnected, roomId])

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  // Get chat partner info
  const getChatPartnerInfo = () => {
    if (messages.length > 0) {
      const firstMessage = messages[0]
      return {
        name: firstMessage.receiver.name,
        image: firstMessage.receiver.store_image_url,
        category: firstMessage.receiver.category,
        description: firstMessage.receiver.description
      }
    }
    return null
  }

  const chatPartner = getChatPartnerInfo()

  // Render individual message
  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = currentUserId ? message.sender.id === currentUserId : index === 0
    const shouldShowProduct = message.product && message.product.id > 0

    return (
      <View key={`${message.sender.id}-${message.created_at}-${index}`} className="px-4 mb-4">
        <View className={`flex-row ${isCurrentUser ? "justify-end" : "justify-start"}`}>
          {!isCurrentUser && (
            <Image
              source={{
                uri: message.sender.user_profile.profile_picture || chatPartner?.image || "",
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
                {message.content}
              </Text>
            </View>

            <View className={`flex-row items-center mt-1 px-1`}>
              <Text className="text-xs text-gray-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                {formatTime(message.created_at)}
              </Text>
              {isCurrentUser && (
                <View className="ml-1">
                  <Ionicons name="checkmark-done" size={14} color="#10B981" />
                </View>
              )}
            </View>
          </View>

          {isCurrentUser && (
            <Image
              source={{ 
                uri: message.sender.user_profile.profile_picture || ''
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>

        {chatPartner ? (
          <View className="flex-row items-center flex-1">
            {chatPartner.image ? (
              <Image source={{ uri: chatPartner.image }} className="w-10 h-10 rounded-full mr-3" />
            ) : (
              <View className="w-10 h-10 rounded-full bg-orange-100 mr-3 items-center justify-center">
                <Ionicons name="storefront" size={20} color="#F97316" />
              </View>
            )}

            <View className="flex-1">
              <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-gray-900 text-base mb-1">
                {chatPartner.name}
              </Text>

              {chatPartner.description.length > 35 ? (
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-gray-500 text-xs mb-1 pt-0">
                  {chatPartner.description.slice(0, 35)}...
                </Text>
              ) : (
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-gray-900 text-xs mb-1">
                  {chatPartner.description}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <Text className="text-lg font-medium flex-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
            Chat
          </Text>
        )}

        <View className="flex-row items-center relative">
          {!isConnected && !isConnecting && (
            <TouchableOpacity onPress={retry} className="p-2 mr-1">
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
      </View>

      {/* Close options menu overlay */}
      {showOptionsMenu && (
        <TouchableOpacity
          className="absolute inset-0 z-40"
          onPress={() => setShowOptionsMenu(false)}
        />
      )}

      {/* Main Container with KeyboardAvoidingView */}
      {/* This is the primary fix. By wrapping the content and input in KeyboardAvoidingView,
        the input area will automatically move up with the keyboard.
        The `keyboardVerticalOffset` can be adjusted if there's a header you need to account for.
      */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages Container */}
        <View className="flex-1 bg-gray-50">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingTop: 16, 
              paddingBottom: 16,
              flexGrow: 1
            }}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading ? (
              <View className="flex-1 justify-center items-center px-4 min-h-[400px]">
                <View className="bg-white rounded-full p-6 shadow-sm mb-4">
                  <Ionicons name="sync" size={48} color="#F97316" />
                </View>
                <Text
                  className="text-lg mb-2 text-gray-700 text-center"
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                >
                  Fetching messages...
                </Text>
                <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Please wait while we load your conversation
                </Text>
              </View>
            ) : messages.length > 0 ? (
              messages.map((message, index) => renderMessage(message, index))
            ) : (
              <View className="flex-1 justify-center items-center px-4 min-h-[400px]">
                <View className="bg-white rounded-full p-6 shadow-sm mb-4">
                  <Ionicons name="chatbubbles-outline" size={48} color="#F97316" />
                </View>
                <Text
                  className="text-lg mb-2 text-gray-700 text-center"
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                >
                  No messages yet
                </Text>
                <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Start a conversation with this store
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Section - Fixed to bottom */}
        {!isLoading && (
          <View className="px-4 py-4 bg-white border-t border-gray-100">
            {/* The input container now has rounded corners and a shadow for a neater look */}
            <View className="bg-neutral-200 rounded-3xl flex-row items-end px-2 py-1 shadow-sm">
              <TextInput
                ref={textInputRef}
                placeholder="Send a Message"
                placeholderTextColor="#9CA3AF"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={1000}
                style={[styles.whatsappInput, { height: Math.max(40, inputHeight) }]}
                className="flex-1 px-2"
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                blurOnSubmit={false}
                onContentSizeChange={handleContentSizeChange}
                textAlignVertical="center"
              />
              <TouchableOpacity
                onPress={sendMessage}
                className={`rounded-full p-3 ml-2 transition-transform duration-200 ease-in-out ${
                  !messageText.trim() || continueChat.isPending
                    ? "bg-gray-400"
                    : "bg-[#F75F15]"
                }`}
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
