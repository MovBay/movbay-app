"use client"

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from "react-native"
import { useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"

const ChatDetailScreen = () => {
  const [message, setMessage] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)

  const messages = [
    {
      id: 1,
      type: "received",
      content: "Sleek Nike comfortable and affordable Brown shoe",
      time: "15:18",
      hasImage: true,
      imageUrl: "https://i.pinimg.com/1200x/39/76/7a/39767a22a5d96943d80a6e4e4196061d.jpg",
    },
    {
      id: 2,
      type: "sent",
      content: "Sleek Nike comfortable and affordable Brown shoe",
      time: "15:18",
    },
    {
      id: 3,
      type: "sent",
      content: "How much is this please",
      time: "15:18",
    },
    {
      id: 4,
      type: "received",
      content: "Amazing!",
      time: "15:22",
    },
    {
      id: 5,
      type: "received",
      content: "Thanks for contacting us! The selected product is ₦ 54,000",
      time: "15:22",
    },
  ]

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageModalVisible(true)
  }

  const closeImageModal = () => {
    setIsImageModalVisible(false)
    setSelectedImage(null)
  }

  const renderMessage = (item: any) => {
    const isReceived = item.type === "received"

    return (
      <View key={item.id} className={`mb-4 ${isReceived ? "items-start" : "items-end"} px-6`}>
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-5 ${
            isReceived ? "bg-gray-100 rounded-bl-sm" : "bg-[#F75F15] rounded-br-sm"
          }`}
        >
          {item.hasImage && (
            <View className="mb-3 rounded-lg overflow-hidden">
              <TouchableOpacity onPress={() => handleImagePress(item.imageUrl)}>
                <Image source={{ uri: item.imageUrl }} className="w-full h-56 rounded-3xl" resizeMode="cover" />
              </TouchableOpacity>
            </View>
          )}

          <Text
            style={{ fontFamily: "HankenGrotesk_500Medium" }}
            className={`text-base ${isReceived ? "text-gray-800" : "text-white"}`}
          >
            {item.content}
          </Text>
        </View>

        <View className={`flex-row items-center mt-1 ${isReceived ? "" : "flex-row-reverse"}`}>
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-gray-500 mr-1">
            {item.time}
          </Text>
          {!isReceived && <Ionicons name="checkmark-done" size={12} color="#10B981" />}
        </View>
      </View>
    )
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm">
            👩‍💼
          </Text>
        </View>

        <View className="flex-1">
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="font-semibold text-gray-900">
            Sharon Store
          </Text>
          <View className="flex-row items-center">
            {[1, 2, 3, 4].map((i) => (
              <Ionicons key={i} name="star" size={12} color="#FCD34D" />
            ))}
            <Ionicons name="star-outline" size={12} color="#FCD34D" />
          </View>
        </View>

        <TouchableOpacity>
          <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          className="flex-1 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Message Input */}
        <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
          <View className="flex-1 flex-row items-center bg-gray-200 rounded-full px-4 py-4 mr-3">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Send a Message"
              className="flex-1 text-gray-700"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              style={{ fontFamily: "HankenGrotesk_500Regular" }}
            />

            <TouchableOpacity className="ml-2">
              <Ionicons name="attach" size={23} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSendMessage}
            className={`p-4 px-5 rounded-full items-center justify-center ${
              message.trim() ? "bg-[#F75F15]" : "bg-gray-300"
            }`}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={18} color={message.trim() ? "white" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isImageModalVisible} transparent={true} animationType="fade" onRequestClose={closeImageModal}>
        <View className="flex-1 bg-black bg-opacity-90 justify-center items-center">
          <TouchableOpacity className="absolute top-12 right-6 z-10" onPress={closeImageModal}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 justify-center items-center w-full"
            onPress={closeImageModal}
            activeOpacity={1}
          >
            {selectedImage && <Image source={{ uri: selectedImage }} className="w-full h-full" resizeMode="contain" />}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default ChatDetailScreen
