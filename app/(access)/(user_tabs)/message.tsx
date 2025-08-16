import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

const Message = () => {
  const conversations = [
    {
      id: 1,
      name: "Henry Nwankwo",
      message: "Hello ma, I'm at your gate now.",
      time: "1:27pm",
      avatar: "👨‍💼",
      unreadCount: 1,
      isUnread: true
    },
    {
      id: 2,
      name: "Sharon Store",
      message: "Hello ma, how much does this cost?",
      time: "1:27pm",
      avatar: "👩‍💼",
      unreadCount: 0,
      isUnread: false
    },
    {
      id: 3,
      name: "MovBay Gadget Hub",
      message: "Sending the item soon",
      time: "1:27pm",
      avatar: "📱",
      unreadCount: 0,
      isUnread: false
    },
    {
      id: 4,
      name: "Quickbite",
      message: "I need further clarification on this",
      time: "1:27pm",
      avatar: "🍔",
      unreadCount: 0,
      isUnread: false
    },
    {
      id: 5,
      name: "Stephen Kalio",
      message: "Thanks.",
      time: "1:27pm",
      avatar: "👨",
      unreadCount: 0,
      isUnread: false
    }
  ]

  const renderConversationItem = (item:any) => (
    <TouchableOpacity 
      key={item.id}
      className="flex-row items-center px-4 py-3 pb-5 my-2 border-b border-gray-100"
      activeOpacity={0.7}
      onPress={()=>router.push(`/(access)/(user_stacks)/chat?conversationId=${item.id}`)}
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
        <Text className="text-lg">{item.avatar}</Text>
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-base font-semibold text-gray-900">
            {item.name}
          </Text>
          <Text className="text-sm text-gray-500">
            {item.time}
          </Text>
        </View>
        
        <View className="flex-row items-center justify-between">
          <Text 
            className={`text-sm flex-1 mr-2 ${
              item.isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}
            numberOfLines={1}
          >
            {item.message}
          </Text>
          
          {/* Unread indicator */}
          {item.isUnread && (
            <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center">
              <Text className="text-xs text-white font-bold">
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark"/>
      
      {/* Header with Search */}
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-4">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search for products, stores, or categories"
            className="flex-1 ml-3 text-gray-700"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
        {conversations.map(renderConversationItem)}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Message