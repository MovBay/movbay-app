import { View, Text, TextInput, TouchableOpacity } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidMainButton } from "@/components/btns/CustomButtoms"

const RateMovBay = () => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  const handleStarPress = (starIndex:any) => {
    setRating(starIndex + 1)
  }

  const handleSubmit = () => {
    // Handle submit logic here
    console.log("Rating:", rating, "Comment:", comment)
    router.back()
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(index)}
        className="p-2"
      >
        <Text className={`text-xl ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
          ⭐
        </Text>
      </TouchableOpacity>
    ))
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 20,
          }}
        >
          <View className="">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            </View>

            <View className="items-center" style={{paddingTop: 30}}>
              <Text className="text-2xl font-bold text-neutral-800 mb-4">
                Rate the MovBay
              </Text>
              
              <Text className="text-sm text-neutral-600 text-center mb-8 px-4">
                How would you rate your experience{'\n'}using MovBay?
              </Text>

              <View className="flex-row justify-center mb-8">
                {renderStars()}
              </View>

              <View className="w-full mb-8">
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Leave a comment..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  className="w-full bg-gray-100 rounded-xl p-4 text-sm text-gray-800 min-h-[120px]"
                  textAlignVertical="top"
                />
              </View>

              <SolidMainButton text="Submit" onPress={handleSubmit}/>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  )
}

export default RateMovBay