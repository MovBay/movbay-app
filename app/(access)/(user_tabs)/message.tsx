import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, RefreshControl, AppState, AppStateStatus } from "react-native"
import { useState, useMemo, useEffect, useRef } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { router, useFocusEffect } from "expo-router"
import { useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useGetChats } from "@/hooks/mutations/chatAuth"
import LoadingOverlay from "@/components/LoadingOverlay"

const Message = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [userToken, setUserToken] = useState("")
  const [currentUserId, setCurrentUserId] = useState("")
  const [isScreenFocused, setIsScreenFocused] = useState(false)

  // Refs for managing intervals and timeouts
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const appStateRef = useRef(AppState.currentState)

  const { getChats, isLoading: isChatLoading, refetch } = useGetChats()
  const allChats = getChats?.data || []
  console.log('all chats', allChats)

  const getUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("movebay_token")
      const userId = await AsyncStorage.getItem("user_id") // Adjust key name as needed
      
      if (token) {
        setUserToken(token)
      }
      if (userId) {
        setCurrentUserId(userId)
      }
    } catch (error) {
      console.error("Error getting data from AsyncStorage:", error)
    }
  }

  // Silent background refresh function
  const silentRefresh = useCallback(async () => {
    try {
      console.log("Performing silent refresh for new messages...")
      await refetch()
    } catch (error) {
      console.error("Error during silent refresh:", error)
    }
  }, [refetch])

  // Start auto-refresh when screen is focused
  const startAutoRefresh = useCallback(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    // Set up interval to check for new messages every 10 seconds
    refreshIntervalRef.current = setInterval(() => {
      if (isScreenFocused && appStateRef.current === 'active') {
        silentRefresh()
      }
    }, 10000) // 10 seconds interval - adjust as needed

    console.log("Auto-refresh started - checking every 10 seconds")
  }, [isScreenFocused, silentRefresh])

  // Stop auto-refresh when screen loses focus
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
      console.log("Auto-refresh stopped")
    }
  }, [])

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log("App state changed:", nextAppState)
      appStateRef.current = nextAppState

      if (nextAppState === 'active' && isScreenFocused) {
        startAutoRefresh()
        silentRefresh()
      } else {
        stopAutoRefresh()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription?.remove()
      stopAutoRefresh()
    }
  }, [isScreenFocused, startAutoRefresh, stopAutoRefresh, silentRefresh])

  // Get token on component mount
  useEffect(() => {
    getUserData()
  }, [])

  // Refetch data when screen comes into focus and manage auto-refresh
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true)
      
      const fetchData = async () => {
        try {
          await getUserData() // Refresh user data in case it changed
          await refetch() // Refetch chats data
        } catch (error) {
          console.error("Error refetching data:", error)
        }
      }

      fetchData()
      
      // Start auto-refresh if app is in foreground
      if (appStateRef.current === 'active') {
        startAutoRefresh()
      }

      // Cleanup when screen loses focus
      return () => {
        setIsScreenFocused(false)
        stopAutoRefresh()
      }
    }, [refetch, startAutoRefresh, stopAutoRefresh])
  )

  // Format time to show like "2:27pm" or relative time for today/yesterday
  const formatTime = (dateString: any) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
      const diffInDays = Math.floor(diffInHours / 24)

      // If it's today (less than 24 hours ago)
      if (diffInHours < 24 && date.getDate() === now.getDate()) {
        return date
          .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .toLowerCase()
      }
      
      // If it's yesterday
      if (diffInDays === 1 || (diffInHours < 48 && date.getDate() === now.getDate() - 1)) {
        return "Yesterday"
      }
      
      // If it's within this week (less than 7 days)
      if (diffInDays < 7) {
        return date.toLocaleDateString("en-US", { weekday: "short" })
      }
      
      // If it's older than a week
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      })
    } catch (error) {
      return dateString
    }
  }

  // Get last message from messages array with proper sorting
  const getLastMessage = (messages: any) => {
    if (!messages || messages.length === 0) return { content: "No messages", timestamp: null }
    
    // Sort messages by created_at timestamp to get the most recent
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    const lastMessage = sortedMessages[0]
    return {
      content: lastMessage?.content || "No content",
      timestamp: lastMessage?.created_at || null
    }
  }

  // Get the timestamp for sorting conversations
  const getConversationTimestamp = (chat: any) => {
    const lastMessage = getLastMessage(chat.messages)
    // Use last message timestamp if available, otherwise use chat creation time
    return lastMessage.timestamp || chat.created_at || chat.updated_at
  }

  // Truncate message if longer than 40 characters
  const truncateMessage = (message: any) => {
    if (message.length > 40) {
      return message.substring(0, 40) + "..."
    }
    return message
  }

  // Get the other person in the conversation (not the current user)
  const getOtherPerson = (chat: any) => {
    // If current user is the sender, show receiver data
    if (chat.sender?.id === currentUserId || chat.sender_id === currentUserId) {
      return {
        id: chat.receiver?.id || chat.receiver_id,
        name: chat.receiver?.name,
        image: chat.receiver?.store_image_url || chat.receiver?.store_image,
      }
    }
    // If current user is the receiver, show sender data
    else {
      return {
        id: chat.sender?.id || chat.sender_id,
        name: chat.sender?.user_profile?.fullname,
        image: chat.sender?.user_profile?.profile_picture,
      }
    }
  }

  // Check if the other person in the conversation is online
  const isOtherPersonOnline = (chat: any) => {
    // Return the user_online status from the chat object
    return chat.user_online === true || chat.user_online === 'true'
  }

  // Sort chats by last message timestamp (most recent first)
  const sortedChats = useMemo(() => {
    return [...allChats].sort((a, b) => {
      const timestampA = getConversationTimestamp(a)
      const timestampB = getConversationTimestamp(b)
      
      // Sort in descending order (newest first)
      return new Date(timestampB).getTime() - new Date(timestampA).getTime()
    })
  }, [allChats])

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return sortedChats

    return sortedChats.filter(
      (chat: any) => {
        const otherPerson = getOtherPerson(chat)
        const lastMessage = getLastMessage(chat.messages)
        return (
          otherPerson.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      },
    )
  }, [sortedChats, searchQuery, currentUserId])

  // Handle pull to refresh (manual refresh)
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      console.log("Manual refresh triggered")
      await getUserData() // Refresh user data
      await refetch()
    } catch (error) {
      console.error("Error refreshing chats:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const renderConversationItem = (item: any) => {
    const lastMessageData = getLastMessage(item.messages)
    const truncatedMessage = truncateMessage(lastMessageData.content)
    const formattedTime = formatTime(lastMessageData.timestamp || item.created_at)
    const otherPerson = getOtherPerson(item)
    const isOnline = isOtherPersonOnline(item)

    return (
      <TouchableOpacity
        key={item.id}
        className="flex-row items-center px-4 py-3 pb-5 my-2 border-b border-gray-100"
        activeOpacity={0.7}
        onPress={() => {
          // Stop auto-refresh when navigating to chat detail
          stopAutoRefresh()
          router.push({
            pathname: "/(access)/(user_stacks)/chat",
            params: {
              conversationId: item.id,
              roomId: item.room_name,
              token: userToken,
              receiverName: otherPerson.name,
              receiverImage: otherPerson.image,
              receiverId: otherPerson.id,
              isUserOnline: item.user_online
            },
          })
        }}
      >
        {/* Avatar with online status indicator */}
        <View className="relative mr-3">
          <View className="w-12 h-12 rounded-full bg-gray-200 items-center overflow-hidden justify-center">
            {otherPerson.image ? (
              <Image
                source={{ uri: otherPerson.image }}
                className="object-cover w-full h-full"
              />
            ) : (
              <Ionicons name="person" size={24} color="#9CA3AF" />
            )}
          </View>
          
          {/* Online status indicator - Enhanced Design */}
          <View className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
            {isOnline && (
              <View className="w-full h-full rounded-full bg-green-500 animate-pulse" />
            )}
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center flex-1">
              <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1} style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                {otherPerson.name || "Unknown"}
              </Text>
              
              {/* <View className="flex-row items-center ml-2">
                {isOnline ? (
                  <View className="flex-row items-center bg-green-50 border border-green-200 rounded-full px-2 py-1">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5 shadow-sm">
                      <View className="w-full h-full rounded-full bg-green-400 opacity-70" />
                    </View>
                    <Text className="text-xs text-green-700 font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                      Online
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
                    <View className="w-2 h-2 rounded-full bg-gray-400 mr-1.5" />
                    <Text className="text-xs text-gray-500 font-medium" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                      Offline
                    </Text>
                  </View>
                )}
              </View> */}
            </View>
            
            <Text className="text-sm text-gray-500 ml-2" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              {formattedTime}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm flex-1 mr-2 text-gray-600" numberOfLines={1} style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              {truncatedMessage}
            </Text>
            {/* Optional: Add unread message count indicator */}
            {/* <View className="bg-orange-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-white text-xs font-medium">2</Text>
            </View> */}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isChatLoading} />

      {allChats.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={50} color="#9CA3AF" />
          <Text className="text-sm text-gray-500 pt-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
            No conversations yet
          </Text>
        </ScrollView>
      ) : (
        <>
          {/* Header with Search */}
          <View className="px-6 pt-4 pb-4">
            <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-4">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search for products, stores, or categories"
                className="flex-1 ml-3 text-gray-700"
                style={{ fontFamily: "HankenGrotesk_400Regular" }}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Auto-refresh indicator with online users count */}
            {isScreenFocused && refreshIntervalRef.current && (
              <View className="flex-row items-center justify-end mt-2">
                {/* Show count of online users */}
                {allChats.length > 0 && (
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500 mr-1" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      {allChats.filter((chat: any) => isOtherPersonOnline(chat)).length} user online
                    </Text>
                    <View className="w-2 h-2 bg-green-600 rounded-full" />
                  </View>
                )}
              </View>
            )}
          </View>

          <ScrollView
            className="flex-1 px-3"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filteredChats.map(renderConversationItem)}
            {filteredChats.length === 0 && searchQuery ? (
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="search" size={50} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 pt-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  No conversations found
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  )
}

export default Message