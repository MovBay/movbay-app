import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, RefreshControl } from "react-native"
import { useState, useMemo, useEffect } from "react"
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

  const { getChats, isLoading: isChatLoading, refetch } = useGetChats()
  const allChats = getChats?.data || []

  // Get user token from AsyncStorage
  const getUserToken = async () => {
    try {
      const token = await AsyncStorage.getItem("movebay_token")
      if (token) {
        setUserToken(token)
      }
    } catch (error) {
      console.error("Error getting token from AsyncStorage:", error)
    }
  }

  // Get token on component mount
  useEffect(() => {
    getUserToken()
  }, [])

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          await getUserToken() // Refresh token in case it changed
          await refetch() // Refetch chats data
        } catch (error) {
          console.error("Error refetching data:", error)
        }
      }

      fetchData()
    }, [refetch])
  )

  console.log("All Chats:", allChats, "User Token:", userToken)

  // Format time to show like "2:27pm"
  const formatTime = (dateString: any) => {
    try {
      const date = new Date(dateString)
      return date
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase()
    } catch (error) {
      return dateString
    }
  }

  // Get last message content from messages array
  const getLastMessage = (messages: any) => {
    if (!messages || messages.length === 0) return "No messages"
    const lastMessage = messages[messages.length - 1]
    return lastMessage?.content || "No content"
  }

  // Truncate message if longer than 40 characters
  const truncateMessage = (message: any) => {
    if (message.length > 40) {
      return message.substring(0, 40) + "..."
    }
    return message
  }

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return allChats

    return allChats.filter(
      (chat: any) =>
        chat.receiver?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getLastMessage(chat.messages).toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [allChats, searchQuery])

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await getUserToken() // Refresh token
      await refetch()
    } catch (error) {
      console.error("Error refreshing chats:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const renderConversationItem = (item: any) => {
    const lastMessage = getLastMessage(item.messages)
    const truncatedMessage = truncateMessage(lastMessage)
    const formattedTime = formatTime(item.created_at)

    return (
      <TouchableOpacity
        key={item.id}
        className="flex-row items-center px-4 py-3 pb-5 my-2 border-b border-gray-100"
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: "/(access)/(user_stacks)/chat",
            params: {
              conversationId: item.id,
              roomId: item.room_name, // Now uses the specific chat's room_name
              token: userToken,
              receiverName: item.receiver?.name,
              receiverImage: item.receiver?.store_image_url || item.receiver?.store_image,
            },
          })
        }}
      >
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center overflow-hidden justify-center mr-3">
          <Image
            source={{ uri: item.receiver?.store_image_url || item.receiver?.store_image }}
            className="object-cover w-full h-full"
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900">{item.receiver?.name}</Text>
            <Text className="text-sm text-gray-500">{formattedTime}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm flex-1 mr-2 text-gray-600" numberOfLines={1}>
              {truncatedMessage}
            </Text>
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
                <Text className="text-sm text-gray-500 pt-2">No conversations found</Text>
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  )
}

export default Message