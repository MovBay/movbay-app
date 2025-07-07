import { View, Text, Image, Pressable, TextInput, StyleSheet, ScrollView, Dimensions } from "react-native"
import { useState, useRef } from "react"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useCreateStory } from "@/hooks/mutations/sellerAuth"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import {SolidMainButton } from "@/components/btns/CustomButtoms"
import { useToast } from "react-native-toast-notifications"
import LoadingOverlay from "@/components/LoadingOverlay"
import { TouchableOpacity } from "react-native"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import * as ImagePicker from 'expo-image-picker'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

interface StoryImage {
  uri: string;
  description: string;
}

interface FormDataFile {
  uri: string;
  name: string;
  type: string;
}

const UserStoryPost = () => {
  const toast = useToast()
  const [storyImages, setStoryImages] = useState<StoryImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentDescription, setCurrentDescription] = useState('')
  const scrollViewRef = useRef<ScrollView>(null)

  const { mutate, isPending } = useCreateStory()

  const pickStoryImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 4,
    })

    if (!result.canceled && result.assets) {
      const newImages: StoryImage[] = result.assets.map(asset => ({
        uri: asset.uri,
        description: ''
      }))
      setStoryImages(prev => [...prev, ...newImages])
      const count = newImages.length
      toast.show(`${count} image${count > 1 ? 's' : ''} added`, { 
        type: 'success' 
      })
    }
  }

  const updateCurrentDescription = (text: string) => {
    setCurrentDescription(text)
    const updatedImages = [...storyImages]
    updatedImages[currentImageIndex].description = text
    setStoryImages(updatedImages)
  }

  const handleImageScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const imageIndex = Math.round(scrollPosition / screenWidth)
    if (imageIndex !== currentImageIndex && imageIndex >= 0 && imageIndex < storyImages.length) {
      setCurrentImageIndex(imageIndex)
      setCurrentDescription(storyImages[imageIndex]?.description || '')
    }
  }

  const navigateToImage = (index: number) => {
    setCurrentImageIndex(index)
    setCurrentDescription(storyImages[index]?.description || '')
    scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true })
  }

  const onSubmit = () => {
    if (storyImages.length === 0) {
      toast.show("Please select at least one image", { type: "danger" })
      return
    }

    const formData = new FormData()
    storyImages.forEach((item, index) => {
      const filename = item.uri.split('/').pop()
      const match = /\.(\w+)$/.exec(filename || '')
      const type = match ? `image/${match[1]}` : 'image'
      
      const imageFile = {
        uri: item.uri,
        name: filename || `story_image_${index}`,
        type,
      }
      formData.append('images', imageFile as any)
    })

    storyImages.forEach((item, index) => {
      formData.append('content', item.description || '')
    })
    try {
      mutate(formData, {
        onSuccess: (response) => {
          toast.show("Story Posted Successfully", { type: "success" })
          router.push("/(access)/(user_tabs)/home")
        },
        onError: (error) => {
          console.log("An Error Occurred:", error)
          const errorMessage = error || "Failed to post story"
          // toast.show(errorMessage, { type: "danger" })
        },
      })
    } catch (error) {
      console.error("Story error:", error)
      toast.show("An unexpected error occurred.", { type: "danger" })
    }
  }

  // Fixed removeCurrentImage function
  const removeCurrentImage = () => {
    if (storyImages.length === 1) {
      setStoryImages([])
      setCurrentImageIndex(0)
      setCurrentDescription('')
    } else {
      const updatedImages = storyImages.filter((_, index) => index !== currentImageIndex)
      setStoryImages(updatedImages)
      
      // Calculate new index first
      let newIndex = currentImageIndex
      if (currentImageIndex >= updatedImages.length) {
        newIndex = updatedImages.length - 1
      }
      
      // Update state with new index and corresponding description
      setCurrentImageIndex(newIndex)
      setCurrentDescription(updatedImages[newIndex]?.description || '')
      
      // Scroll to new position
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: newIndex * screenWidth, animated: true })
      }, 100)
    }
    toast.show('Image removed', { type: 'success' })
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar style="light" />
      <LoadingOverlay visible={isPending} />

      {/* Header */}
      <View className="px-4 pt-3 pb-2 flex-row justify-between items-center">
        {storyImages.length > 0 ? 
          <TouchableOpacity 
            className="bg-white/20 rounded-full p-2" 
            onPress={() => router.back()}
          >
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity> : 
          <TouchableOpacity 
            className="bg-white/20 rounded-full p-2 ml-auto" 
            onPress={() => router.back()}
          >
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity> 
        }
        
        {storyImages.length > 0 && (
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              className="bg-white/20 rounded-full p-2" 
              onPress={removeCurrentImage}
            >
              <MaterialIcons name="delete" size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white/20 rounded-full p-2" 
              onPress={pickStoryImages}
            >
              <MaterialIcons name="add-photo-alternate" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <KeyboardAwareScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {storyImages.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <MaterialIcons name="add-photo-alternate" size={70} color="white" />
            <Text className="text-white text-xl mt-3" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
              Add Photos
            </Text>
            <Text className="text-white/70 text-sm mt-1 pb-4" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
              Select images to post a story
            </Text>
            <View className="w-[40%]">
              <SolidMainButton text="Select" onPress={pickStoryImages}/>
            </View>
          </View>
        ) : (
          <View className="flex-1">
            {/* Image indicator dots */}
            {storyImages.length > 1 && (
              <View className="flex-row justify-center py-2 gap-1">
                {storyImages.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => navigateToImage(index)}
                    className={`h-1.5 rounded-full ${
                      index === currentImageIndex ? 'bg-white w-6' : 'bg-white/40 w-2'
                    }`}
                  />
                ))}
              </View>
            )}

            {/* Image ScrollView - Original size with proper aspect ratio */}
            <View className="flex-1 justify-center">
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleImageScroll}
                decelerationRate="fast"
                snapToInterval={screenWidth}
                snapToAlignment="start"
                contentContainerStyle={{ width: screenWidth * storyImages.length }}
              >
                {storyImages.map((item, index) => (
                  <View key={index} style={{ width: screenWidth }} className="justify-center px-4">
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.image}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* WhatsApp-style Input Section */}
            <View className="px-4 pb-4">
              <View className="bg-neutral-800 rounded-full flex-row items-end p-2">
                <TextInput
                  placeholder="Add a description..."
                  placeholderTextColor="#9CA3AF"
                  value={currentDescription}
                  onChangeText={updateCurrentDescription}
                  multiline
                  maxLength={200}
                  style={styles.whatsappInput}
                  className="flex-1 text-white px-4 py-3"
                />
                <TouchableOpacity
                  onPress={onSubmit}
                  className="bg-[#F75F15] rounded-full p-3 ml-2"
                  disabled={isPending}
                >
                  <MaterialIcons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-white/70 text-xs mt-2 text-right" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                {currentDescription.length}/200
              </Text>
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default UserStoryPost

const styles = StyleSheet.create({
  imageContainer: {
    aspectRatio: 1,
    overflow: 'hidden',
    maxHeight: screenHeight * 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  whatsappInput: {
    fontSize: 16,
    fontFamily: 'HankenGrotesk_400Regular',
    textAlignVertical: 'top',
    lineHeight: 20,
  },
})