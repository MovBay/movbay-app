"use client"

import { View, Text, Image, Pressable, Modal, Dimensions, FlatList, StyleSheet } from "react-native"
import { useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import { products } from "@/constants/datas"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { useGetSingleProducts } from "@/hooks/mutations/sellerAuth"
import ProductSkeleton from "@/components/ProductSkeleton"
import LoadingOverlay from "@/components/LoadingOverlay"
import { Video, ResizeMode } from "expo-av"
import { useCart } from "@/context/cart-context"

const { width: screenWidth } = Dimensions.get("window")

// Custom Success Modal Component
const CustomSuccessModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  if (!visible) return null

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image source={require("../../../../assets/images/success.png")} style={styles.successImage} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.modalTitle}>Product Added Successfully!</Text>
            <Text style={styles.modalDescription}>Your item has been added to cart and is ready for checkout.</Text>

            <View className="flex-row justify-between gap-1">
              <View className="w-[49%]">
                < SolidLightButton text="Close" onPress={onClose} />
              </View>
              <View className="w-[49%]">
                <SolidMainButton
                  text="View Cart"
                  onPress={() => {
                    onClose()
                    router.push("/(access)/(user_stacks)/cart")
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Video Modal Component
const VideoModal = ({
  visible,
  onClose,
  videoUrl,
}: {
  visible: boolean
  onClose: () => void
  videoUrl: string | null
}) => {
  const [status, setStatus] = useState({})

  if (!visible || !videoUrl) return null

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)" }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View className="flex-row justify-between items-center p-4">
              <Text className="text-white text-lg" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Product Video
              </Text>
              <Pressable onPress={onClose} className="p-2 bg-neutral-600 rounded-full">
                <Ionicons name="close" size={16} color="white" />
              </Pressable>
            </View>

            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
              <Video
                style={{
                  width: screenWidth - 10,
                  height: (screenWidth - 0),
                  backgroundColor: "black",
                }}
                source={{ uri: videoUrl }}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                isLooping
                onPlaybackStatusUpdate={(status) => setStatus(() => status)}
              />
            </View>

            <View className="p-4">
              <Text className="text-white text-center text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                Tap the video to play/pause or use the controls
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const Product = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const product = products.find((item) => item.id === id || item.id === id)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false)
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false)
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false)

  const { userProductData, isLoading } = useGetSingleProducts(id)
  const eachData = userProductData?.data

  // Use the global cart context
  const { addToCart, isUpdating } = useCart()

  console.log("This is Products", eachData)

  const openImagePreview = (index: number) => {
    setSelectedImageIndex(index)
    setIsImagePreviewVisible(true)
  }

  const closeImagePreview = () => {
    setIsImagePreviewVisible(false)
  }

  const openVideoModal = () => {
    setIsVideoModalVisible(true)
  }

  const closeVideoModal = () => {
    setIsVideoModalVisible(false)
  }

  // Updated handleAddToCart to use global cart context
  const handleAddToCart = async () => {
    if (eachData) {
      try {
        const cartItem = {
          id: eachData.id.toString(),
          title: eachData.title,
          price: eachData.original_price,
          discounted_price: eachData.discounted_price,
          image: eachData.product_images[0]?.image_url,
          store: eachData.store,
          stock_available: eachData.stock_available,
        }

        await addToCart(cartItem)
        setIsSuccessModalVisible(true)

        console.log("Item added to cart successfully:", cartItem.title)
      } catch (error) {
        console.error("Error adding item to cart:", error)
      }
    }
  }

  const renderImageItem = ({ item, index }: { item: any; index: number }) => (
    <View style={{ width: screenWidth, height: screenWidth, justifyContent: "center", alignItems: "center" }}>
      <Image
        source={{ uri: item?.image_url }}
        style={{ width: "100%", height: "90%", objectFit: "cover" }}
        resizeMode="contain"
      />
    </View>
  )

  return (
    <SafeAreaView className="bg-white flex-1">
      <KeyboardAwareScrollView className="">
        <LoadingOverlay visible={isUpdating} />

        {isLoading || eachData === undefined ? (
          <ProductSkeleton />
        ) : (
          <View className="pb-10">
            <View className="w-full h-[350px] object-cover relative">
              <Image
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                source={{ uri: eachData?.product_images[0]?.image_url }}
              />

              <Pressable
                onPress={() => router.back()}
                className="absolute top-4 left-5 bg-white/80 p-2.5 rounded-full justify-center items-center flex"
              >
                <MaterialIcons name="chevron-left" size={20} color={"black"} />
              </Pressable>

              <Pressable className="absolute top-4 right-5  bg-white/80 p-2.5 rounded-full justify-center items-center flex">
                <MaterialIcons name="question-mark" size={20} color={"black"} />
              </Pressable>
              <View className="bg-white/50 rounded-full p-2 px-3 right-3 bottom-3 absolute z-50">
                <Text className="text-sm" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  {eachData?.stock_available}
                </Text>
              </View>
            </View>

            <View className="px-5 pt-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-2">
                  <MaterialIcons size={20} name="location-pin" />
                  {eachData?.store?.address1.length > 20 ? (
                    <Text className="text-base " style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      { eachData?.store?.address1.slice(0, 20)}...
                    </Text>
                    ) :
                    (
                      <Text className="text-base " style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                        { eachData?.store?.address1}
                      </Text>
                    )
                  }
                </View>


              {eachData?.verified  === true ? 
                <View className="bg-blue-100 flex-row justify-center gap-1 items-center p-1.5 px-2 my-2 rounded-full">
                  <MaterialIcons name="verified" size={15} color={"#4285F4"} />
                  <Text className="text-[#4285F4] text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                     Verified
                  </Text>
                </View>: 
                <View className="bg-red-50 flex-row justify-center gap-1 items-center p-1.5 px-2 my-2 rounded-full">
                    <MaterialIcons name="sentiment-very-dissatisfied" size={15} color={"red"} />
                    <Text className="text-red-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      Unverified
                    </Text>
                </View>
              }
              </View>

              <View className="pt-2">
                <Text className="text-2xl font-bold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  {eachData?.title}
                </Text>
                <View className="flex-row justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-lg pt-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                      ₦ {eachData?.original_price.toLocaleString()}
                    </Text>
                    <Text
                      className="text-base pt-2 italic line-through text-neutral-500"
                      style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    >
                      ₦ {eachData?.discounted_price.toLocaleString()}
                    </Text>
                  </View>

                  <Pressable className="bg-neutral-100 p-2 rounded-full flex justify-center items-center">
                    <Ionicons name="share-outline" size={20} />
                  </Pressable>
                </View>

                <View className="flex-row gap-3 border-b border-neutral-200 pb-3">
                  <View className="flex-row">
                    <MaterialIcons name="star" size={14} color={"#FBBC05"} />
                    <MaterialIcons name="star" size={14} color={"#FBBC05"} />
                    <MaterialIcons name="star" size={14} color={"#FBBC05"} />
                    <MaterialIcons name="star" size={14} color={"#FBBC05"} />
                  </View>
                  <Text className="text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                    (1,020)
                  </Text>
                </View>

                {/* Updated Image Gallery Section */}
                <View className="py-4">
                  <View className="flex-row flex-wrap gap-2">
                    {eachData?.product_images?.map((singleData: any, index: number) => (
                      <Pressable
                        key={index}
                        onPress={() => openImagePreview(index)}
                        style={{
                          width: (screenWidth - 50) / 3 - 5,
                          height: 100,
                          marginBottom: 8,
                        }}
                        className="overflow-hidden rounded-md bg-gray-50 border border-gray-100"
                      >
                        <Image
                          source={{ uri: singleData?.image_url }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ))}
                  </View>

                  {/* Watch Product Video Button */}
                  {eachData?.video_url && (
                    <Pressable
                      onPress={openVideoModal}
                      className="bg-[#FEEEE6] p-3 rounded-full mt-3 flex-row items-center justify-center gap-2"
                    >
                      <Ionicons name="play-circle" size={24} color="#A53F0E" />
                      <Text className="text-[#A53F0E] text-base" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Watch Product Video
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Image Preview Modal */}
                <Modal
                  visible={isImagePreviewVisible}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={closeImagePreview}
                >
                  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                      <View style={{ flex: 1 }}>
                        <View className="flex-row justify-between items-center p-4">
                          <Text className="text-white text-sm" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                            {selectedImageIndex + 1} of {eachData?.product_images?.length}
                          </Text>
                          <Pressable onPress={closeImagePreview} className="p-2">
                            <Ionicons name="close" size={20} color="white" />
                          </Pressable>
                        </View>

                        <FlatList
                          data={eachData?.product_images}
                          renderItem={renderImageItem}
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          initialScrollIndex={selectedImageIndex}
                          getItemLayout={(data, index) => ({
                            length: screenWidth,
                            offset: screenWidth * index,
                            index,
                          })}
                          onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
                            setSelectedImageIndex(index)
                          }}
                        />
                      </View>
                    </SafeAreaView>
                  </View>
                </Modal>

                <View className="pt-2">
                  <View className="bg-[#FEF2CD] p-3 rounded-md">
                    <Text className="text-base text-[#977102]" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                      Seller's delivery starts within 1–2 working days for out-of-state orders.
                    </Text>
                  </View>

                  <View className="pt-5">
                    <Text className="text-lg" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                      Color Variation
                    </Text>
                    <View className="flex-row gap-3 items-center">
                      {product?.colors?.map((color, index) => (
                        <View className="pt-2" key={index}>
                          {color === 1 && <View className="h-12 w-12 bg-black rounded-full"></View>}
                          {color === 2 && <View className="h-12 w-12 bg-[#FBBC05] rounded-full"></View>}
                          {color === 3 && <View className="h-12 w-12 bg-[#4285F4] rounded-full"></View>}
                          {color === 4 && <View className="h-12 w-12 bg-[#34A853] rounded-full"></View>}
                          {color === 5 && (
                            <View className="h-12 w-12 bg-white border border-neutral-300 rounded-full"></View>
                          )}
                        </View>
                      ))}
                    </View>

                    <View className="pt-5 pb-3 border-b border-neutral-200">
                      <Text className="text-lg" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Description
                      </Text>
                      <Text className="text-base pt-2" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                        {eachData?.description}
                      </Text>
                    </View>

                    <View className="pt-5 border-b border-gray-200 pb-5 flex-col gap-2">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base " style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                          Pickup Available
                        </Text>
                        {eachData?.pickup_available === true ? (
                          <Ionicons name="checkmark-circle" size={20} color={"green"} />
                        ) : (
                          <Ionicons name="close-circle" size={20} color={"red"} />
                        )}
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Text className="text-base " style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                          Delivery Available
                        </Text>
                        {eachData?.delivery_available === true ? (
                          <Ionicons name="checkmark-circle" size={20} color={"green"} />
                        ) : (
                          <Ionicons name="close-circle" size={20} color={"red"} />
                        )}
                      </View>
                    </View>

                    <View className="bg-[#FEEEE6] p-3 rounded-md mt-3">
                      <Text className="text-base text-[#A53F0E]" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Pay with wallet or card in MovBay—fast, safe, and fully protected!
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between pt-5 pb-3 border-b border-neutral-200">
                      <View className="flex-row gap-4 items-center">
                        <View className="w-10 h-10 overflow-hidden rounded-full bg-gray-300 justify-center items-center flex">
                          <Image
                            source={{ uri: eachData?.store.store_image }}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </View>
                        <View>
                          <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-lg">
                            {eachData?.store.name}
                          </Text>
                          <View className="flex-row">
                            <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                            <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                            <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                            <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                          </View>
                        </View>
                      </View>

                      <Pressable className="bg-[#FEEEE6] p-3 rounded-full px-6">
                        <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base text-[#A53F0E]">
                          Follow
                        </Text>
                      </Pressable>
                    </View>

                    <View className="pt-5">
                      <Text className="text-xl" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Reviews
                      </Text>

                      <View>
                        {product?.reviews.map((review, index) => (
                          <View key={index} className="pt-3 pb-3 border-b border-neutral-200">
                            <View className="flex-row justify-between ">
                              <View>
                                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base">
                                  {review?.username}
                                </Text>
                                <View className="flex-row">
                                  <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                  <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                  <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                  <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                </View>
                              </View>

                              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm">
                                {review.date}
                              </Text>
                            </View>
                            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base pt-3">
                              {review.review}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View className="flex-row gap-3 justify-center pt-5">
                      <View className="w-[50%]">
                        <SolidLightButton text="Chat" />
                      </View>

                      <View className="w-[50%]">
                        <SolidMainButton
                          text="Add to Cart"
                          onPress={handleAddToCart}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Success Modal */}
      <CustomSuccessModal visible={isSuccessModalVisible} onClose={() => setIsSuccessModalVisible(false)} />

      {/* Video Modal */}
      <VideoModal visible={isVideoModalVisible} onClose={closeVideoModal} videoUrl={eachData?.video_url} />
    </SafeAreaView>
  )
}

// Styles for the modal
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    paddingVertical: 30,
    alignItems: "center",
    width: "95%",
  },
  modalContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  successImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  textContainer: {
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  modalDescription: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    fontFamily: "HankenGrotesk_400Regular",
  },
  buttonContainer: {
    width: "100%",
  },
})

export default Product
