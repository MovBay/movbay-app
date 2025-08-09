import { View, Text, TextInput, TouchableOpacity } from "react-native"
import { useState } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import { useReviewProduct } from "@/hooks/mutations/sellerAuth"
import { useToast } from "react-native-toast-notifications"
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import LoadingOverlay from '@/components/LoadingOverlay'

const RateProduct = () => {
  const { productId } = useLocalSearchParams()
  const toast = useToast()
  const { mutate, isPending } = useReviewProduct(productId as string)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  console.log("Product ID:", productId)

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex + 1)
  }

  const handleSubmit = () => {
    if (rating === 0) {
      toast.show("Please select a rating", { type: "warning" })
      return
    }

    const payload = {
      comment: comment.trim(),
      rating: `${rating}Star`
    }

    mutate(payload, {
      onSuccess: (response) => {
        toast.show("Review submitted successfully!", { type: "success" })
        console.log("Review submitted:", response)
        router.back()
      },
      onError: (error) => {
        toast.show("Failed to submit review. Please try again.", { type: "danger" })
        console.error("Review submission error:", error)
      }
    })
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(index)}
        className="p-1 mx-1"
        activeOpacity={0.7}
      >
        <Ionicons 
          name={index < rating ? "star" : "star-outline"} 
          size={27} 
          color={index < rating ? "#FFA500" : "#FBBC05"}
        />
      </TouchableOpacity>
    ))
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Loading Overlay */}
      <LoadingOverlay visible={isPending} />

      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            </View>

            <View className="items-center" style={{ paddingTop: 30 }}>
              <Text 
                className="text-2xl text-neutral-800 mb-4 text-center"
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
              >
                Rate the Product
              </Text>
              
              <Text 
                className="text-sm text-neutral-600 text-center mb-8 px-4"
                style={{ fontFamily: "HankenGrotesk_400Regular" }}
              >
                How would you rate your item and{'\n'}delivery experience?
              </Text>

              {/* Star Rating */}
              <View className="flex-row justify-center items-center mb-2">
                {renderStars()}
              </View>
              
              {/* Comment Input */}
              <View className="w-full mb-8 mt-4">
               
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Share your thoughts about the product and delivery..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  className="w-full bg-gray-100 rounded-xl p-4 text-sm text-gray-800 min-h-[120px]"
                  style={{ fontFamily: "HankenGrotesk_400Regular" }}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text 
                  className="text-xs text-gray-500 mt-1 text-right"
                  style={{ fontFamily: "HankenGrotesk_400Regular" }}
                >
                  {comment.length}/500
                </Text>
              </View>

              {/* Submit Button */}
              <SolidMainButton 
                text="Submit Review" 
                onPress={handleSubmit}
              />
              
              {rating === 0 && (
                <Text 
                  className="text-xs text-red-500 mt-2 text-center"
                  style={{ fontFamily: "HankenGrotesk_400Regular" }}
                >
                  Please select a rating to continue
                </Text>
              )}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  )
}

export default RateProduct