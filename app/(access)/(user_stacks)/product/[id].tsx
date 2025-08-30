import { View, Text, Image, Pressable, Modal, Dimensions, FlatList, StyleSheet, ScrollView, TextInput } from "react-native"
import { useCallback, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import { products } from "@/constants/datas"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { useFollowStore, useGetFollowedStores, useGetSingleProductReviews, useGetSingleProducts, useGetSingleRelatedProduct, useGetStore, useUnFollowStore } from "@/hooks/mutations/sellerAuth"
import ProductSkeleton from "@/components/ProductSkeleton"
import LoadingOverlay from "@/components/LoadingOverlay"
import { Video, ResizeMode } from "expo-av"
import { useCart } from "@/context/cart-context"
import { useProfile } from "@/hooks/mutations/auth"
import { Toast, useToast } from "react-native-toast-notifications"
import RelatedProducts from "@/components/RelatedProducts"
import AllProductSkeleton2 from "@/components/AllProductSkeleton2"
import { ActivityIndicator } from "react-native"
import { Controller, useForm } from "react-hook-form"
import { ErrorMessage } from "@hookform/error-message"
import { useCreateChat } from "@/hooks/mutations/chatAuth"
import { Linking } from "react-native"

const { width: screenWidth } = Dimensions.get("window")

// Delivery Option Display Component (without checkbox functionality)
const DeliveryOptionDisplay = ({
  label,
  description,
  isAvailable,
}: {
  label: string
  description?: string
  isAvailable: boolean
}) => (
  <View className="flex-row items-start py-3 px-2 bg-gray-50 rounded-lg mb-3">
    <View className="mr-3 mt-0.5">
      <View className="w-5 h-5 rounded border items-center justify-center bg-green-100 border-green-300">
        <MaterialIcons name="check" size={14} color="green" />
      </View>
    </View>
    <View className="flex-1">
      <Text style={[styles.titleStyle, { paddingBottom: 2, paddingTop: 0 }]}>{label}</Text>
      {description && (
        <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
          {description}
        </Text>
      )}
    </View>
  </View>
)

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
                <SolidLightButton text="Close" onPress={onClose} />
              </View>
              <View className="w-[49%]">
                <SolidMainButton
                  text="View Cart"
                  onPress={() => {
                    onClose()
                    router.replace("/(access)/(user_stacks)/cart")
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

// Empty State Component
const EmptyState = ({ title, description, icon }: { title: string; description: string; icon: string }) => (
  <View className="flex-1 justify-center items-center py-10 pb-5 px-5">
    <View className="bg-gray-100 rounded-full p-5 mb-4">
      <MaterialIcons name={icon as any} size={30} color="#9CA3AF" />
    </View>
    <Text className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
      {title}
    </Text>
    <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
      {description}
    </Text>
  </View>
)

// Horizontal Product List Component (to replace nested FlatList)
const HorizontalProductList = ({ 
  data, 
  isLoading, 
  title, 
  emptyTitle, 
  emptyDescription 
}: { 
  data: any[], 
  isLoading: boolean, 
  title?: string,
  emptyTitle: string,
  emptyDescription: string
}) => {
  const renderProduct = useCallback(
    ({ item }: { item: any }) => (
      <View style={{ width: (screenWidth) / 3.5}}>
        <RelatedProducts
          id={item.id.toString()}
          title={item.title}
          original_price={item.original_price}
          product_images={item.product_images}
          description={item.description}
          discounted_price={item.discounted_price}
          stock_available={item.stock_available}
          store={item.store}
        />
      </View>
    ),
    [],
  )

  return (
    <View className="mt-5">
      {isLoading ? (
        <View className="">
         
          <AllProductSkeleton2 />
        </View>
      ) : data && data.length > 0 ? (

        <View>
           <Text className="pt-3 pb-5 text-base font-bold border-t border-neutral-200 " style={{fontFamily: 'HankenGrotesk_500Medium'}}>
            {title}
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 10 }}
            data={data}
            keyExtractor={(item) => `product-${item.id}`}
            renderItem={renderProduct}
            ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            initialNumToRender={5}
            windowSize={5}
          />
        </View>
      ) : (
        <EmptyState 
          title={emptyTitle}
          description={emptyDescription}
          icon="inventory"
        />
      )}
    </View>
  )
}


const isStoreFollowed = (storeId:any, followedStores:any) => {
  if (!followedStores || !Array.isArray(followedStores)) return false;
  return followedStores.some(item => item.followed_store.id === storeId);
};

const Product = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false)
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false)
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false)

  const { userProductData, isLoading } = useGetSingleProducts(id)
  const {userRelatedProductData, isLoading: productLoading} = useGetSingleRelatedProduct(id)
  const eachData = userProductData?.data
  const {storeData, isLoading: storeLoading} = useGetStore()
  const {singleProductReviewData, isLoading: reivewLoading} = useGetSingleProductReviews(id)
  const reviews = singleProductReviewData?.data

  const {getFollowedStores, } = useGetFollowedStores()

  const followedStoresData = getFollowedStores?.data || []
  const currentStoreId = eachData?.store?.id
  const isCurrentStoreFollowed = isStoreFollowed(currentStoreId, followedStoresData)
  const {isPending, mutate} = useFollowStore(storeData?.data?.id || "")
  const {isPending: unFollowPending, mutate: unfollowMutate} = useUnFollowStore(storeData?.data?.id || "")

  const senderPhone = storeData?.data?.owner?.phone_number

  const toast = useToast()

  console.log('This is Store', storeData?.data?.owner?.phone_number)

  const handleCallSeller = useCallback(() => {
      if (senderPhone) {
        Linking.openURL(`tel:${senderPhone}`).catch((err) =>
          toast.show(`Could not call sender: ${err.message}`, { type: "danger" }),
        )
      } else {
        toast.show("Sender phone number not available.", { type: "warning" })
      }
  }, [senderPhone, toast])
  

  const handleProductReview = () =>{
    router.push({
      pathname: "/(access)/(user_stacks)/productReview",
      params: { productId: id }
    })
  }

  
  const handleFollowUnfollowStore = async () => {
    if (!currentStoreId) {
      Toast.show("Store ID not found", { type: "error" })
      return
    }

    try {
      if (isCurrentStoreFollowed) {
        // Unfollow the store
        await unfollowMutate(currentStoreId, {
          onSuccess: (response) => {
            console.log("This is Response", response.data)
            Toast.show("Store unfollowed successfully", { type: "success" })
          },
        })
      } else {
        // Follow the store
        await mutate(currentStoreId, {
          onSuccess: (response) => {
            console.log("This is Response", response.data)
            Toast.show("Store followed successfully", { type: "success" })
          },
        })
      }
    } catch (error) {
      console.error("Error following/unfollowing store:", error)
      const errorMessage = isCurrentStoreFollowed 
        ? "Failed to unfollow store" 
        : "Failed to follow store"
      Toast.show(errorMessage, { type: "error" })
    }
  }

  // Use the global cart context with stock management
  const { addToCart, isUpdating, getItemQuantity, isItemAtStockLimit, getRemainingStock } = useCart()

  // Stock calculations
  const isOutOfStock = eachData?.stock_available === 0
  const isLowStock = eachData?.stock_available <= 5 && eachData?.stock_available > 0
  const currentQuantityInCart = getItemQuantity(eachData?.id?.toString() || "")
  const isAtStockLimit = isItemAtStockLimit(eachData?.id?.toString() || "", eachData?.stock_available || 0)
  const remainingStock = getRemainingStock(eachData?.id?.toString() || "", eachData?.stock_available || 0)

  // Check if this product belongs to the current user's store
  const isOwnProduct = eachData?.store?.id === storeData?.data?.id

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

  // Updated handleAddToCart with stock validation
  const handleAddToCart = async () => {
    if (eachData) {
      // Check if product is out of stock
      if (isOutOfStock) {
        Toast.show("This product is currently out of stock", { type: "warning" })
        return
      }

      // Check if item is at stock limit
      if (isAtStockLimit) {
        Toast.show(`Only ${eachData.stock_available} ${eachData.stock_available === 1 ? 'item' : 'items'} available in stock`, { 
          type: "warning" 
        })
        return
      }

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

        const result = await addToCart(cartItem)
        
        if (result.success) {
          setIsSuccessModalVisible(true)
          console.log("Item added to cart successfully:", cartItem.title)
        } else {
          Toast.show(result.message, { type: "warning" })
        }
      } catch (error) {
        console.error("Error adding item to cart:", error)
        Toast.show("Failed to add item to cart", { type: "error" })
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

  // Delivery options data with descriptions
  const deliveryTypes = [
    {
      key: "movbay_express",
      label: "Movbay Express",
      description: "Fast delivery within 24 hours",
      isAvailable: eachData?.movbay_express || false,
    },
    {
      key: "speed_dispatch", 
      label: "Speedy Dispatch",
      description: "Quick dispatch within 2-3 business days",
      isAvailable: eachData?.speed_dispatch || false,
    },
    {
      key: "pickup",
      label: "Pickup",
      description: "Customer pickup from designated locations",
      isAvailable: eachData?.pickup || false,
    },
  ]

  // Filter to show only available delivery types
  const availableDeliveryTypes = deliveryTypes.filter(type => type.isAvailable)

  // ================= MESSAGE ================
  const {mutate: messageMutate, isPending: messagePending} = useCreateChat() 

  const {
      control,
      handleSubmit,
      formState: { errors },
      reset,
      watch,
  } = useForm({
      defaultValues: {
          content: ""
      },
  });

  const [showDialog, setShowDialog] = useState(false);
  const handlePress = () => {
      setShowDialog(true);
  };
  
  const closeDialog = () => {
      setShowDialog(false);
  };


  const onSubmit = (data: any) => {
    if (!data.content || data.content.trim() === "") {
      Toast.show("Message content cannot be empty", { type: "warning" });
      return;
    }
      const form_data = {
          content: data.content,
          product_id: id
      };
      
      try{
      messageMutate(form_data, {
          onSuccess: async (response) => {
              closeDialog()
              console.log(response.data);
              Toast.show("Message sent successfully", { type: "success" });  
              router.push(`/(access)/(user_tabs)/message`);            
          },
          onError: (error: any) => {
              closeDialog()
              console.log(error.response.data);
          },
      });
      }catch(error){
          console.log(error);
      }
  }
    

  return (
    <SafeAreaView className="bg-white flex-1">
      <LoadingOverlay visible={isUpdating} />
      
      {/* Main Content - Using ScrollView instead of KeyboardAwareScrollView to avoid nesting issues */}
      <ScrollView 
        className=""
        contentContainerStyle={{ paddingBottom: 100 }} // Add padding to prevent content from being hidden behind fixed buttons
        showsVerticalScrollIndicator={false}
      >
        {isLoading || eachData === undefined ? (
          <ProductSkeleton />
        ) : (
          <View className="pb-5">
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
              
              {/* Owner Badge */}
              {isOwnProduct && (
                <View className="bg-[#4285F4] rounded-full p-2 px-4 left-3 bottom-3 absolute z-50">
                  <Text className="text-white text-sm font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    Your Product
                  </Text>
                </View>
              )}
              
              {/* Stock Badge */}
              {!isOwnProduct && (
                <View className={`rounded-full p-2 px-3 right-3 bottom-3 absolute z-50 ${
                  isOutOfStock
                    ? 'bg-red-500'
                    : isAtStockLimit
                     ? 'bg-gray-500'
                     : isLowStock
                        ? 'bg-yellow-500'
                        : 'bg-white'
                }`}>
                  <Text className={`text-sm ${
                    isOutOfStock || isLowStock || isAtStockLimit ? 'text-white' : 'text-black'
                  }`} style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    {isOutOfStock
                      ? 'Out of Stock'
                      : isAtStockLimit
                        ? 'Max in Cart'
                       : `${remainingStock} left`
                    }
                  </Text>
                </View>
              )}
            </View>

            <View className="px-5 pt-3">
              <View className="flex-row justify-between items-center pb-2">
                <View className="flex-row gap-1">
                  <MaterialIcons size={15} name="location-pin" />
                  {eachData?.store?.address1.length > 25 ? (
                    <Text className="text-sm " style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      { eachData?.store?.address1.slice(0, 25)}...
                    </Text>
                    ) :
                    (
                      <Text className="text-sm " style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                        { eachData?.store?.address1}
                      </Text>
                    )
                  }
                </View>
              {eachData?.verified  === true ?
                 <View className="bg-blue-100 flex-row justify-center gap-1 items-center p-1.5 px-2 my-2 rounded-full">
                  <MaterialIcons name="verified" size={15} color={"#4285F4"} />
                  <Text className="text-green-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                     Verified
                  </Text>
                </View>:
                 <View className="bg-orange-50 flex-row justify-center gap-1 items-center p-1.5 px-2 my-2 rounded-full">
                    <MaterialIcons name="cancel" size={15} color={"orange"} />
                    <Text className="text-orange-500 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                      Not verified
                    </Text>
                </View>
              }
              </View>

              <View className="pt-2  ">
                <Text className="text-lg font-bold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  {eachData?.title}
                </Text>
                <View className="flex-row justify-between border-b border-neutral-200 pb-4">
                  <View className="flex-row items-center gap-3">
                    <Text className={`text-lg pt-2 ${isOutOfStock ? 'text-gray-500' : ''}`} style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                      ₦ {eachData?.discounted_price.toLocaleString()}
                    </Text>
                    <Text
                      className={`text-lg pt-2  line-through text-neutral-500 ${isOutOfStock ? 'text-gray-400' : ''}`}
                      style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    >
                      {eachData?.original_price.toLocaleString()}
                    </Text>
                  </View>
                  <Pressable className="bg-neutral-100 p-2 rounded-full flex justify-center items-center">
                    <Ionicons name="share-outline" size={20} />
                  </Pressable>
                </View>

                <View className="pt-2">
                  {isOutOfStock ? (
                    <View className="mb-3">
                      <View className="flex-row items-center">
                        <MaterialIcons name="error" size={15} color="#DC2626" />
                        <Text className="text-yellow-600 text-sm ml-2 font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                          Out of Stock
                        </Text>
                      </View>
                      <Text className="text-yellow-600 text-sm mt-1" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                        This product is currently unavailable
                      </Text>
                    </View>
                  ) : isAtStockLimit ? (
                    <View className="mb-3">
                      <View className="flex-row items-center">
                        <MaterialIcons name="info" size={15} color="#6B7280" />
                        <Text className="text-gray-600 text-sm ml-2 font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                          Maximum quantity reached
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                        You have {currentQuantityInCart} of {eachData?.stock_available} available items in your cart
                      </Text>
                    </View>
                  ) : isLowStock ? (
                    <View className="mb-5">
                      <View className="flex-row items-center pt-2">
                        <Ionicons name="warning" size={15} color="#D97706" />
                        <Text className="text-yellow-600 text-sm ml-2 font-semibold" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                          Low Stock - Only {remainingStock} more can be added!
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="">
                      <View className="flex-row items-center">
                        <MaterialIcons name="check-circle" size={13} color="#059669" />
                        <Text className="text-green-700 text-sm ml-2 font-semibold" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                          {remainingStock} more in Stock
                        </Text>
                      </View>
                      {currentQuantityInCart > 0 && (
                        <Text className="text-green-600 text-sm mt-1" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                          You currently have {currentQuantityInCart} in your cart
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                
              </View>

              {/* Updated Image Gallery Section */}
              <View className="py-4 relative">
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

                <View className="pt-2 ">

                  <View className="flex-row justify-between items-center w-full">
                    <View className="bg-[#FEF2CD] w-[80%] p-3 rounded-xl">
                      <Text className="text-sm text-[#977102]" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Seller's delivery starts within 1–2 working days for out-of-state orders.
                      </Text>
                    </View>
                    {eachData?.video_url && (
                      <Pressable
                        onPress={openVideoModal}
                        className="bg-[#F75F15] w-[20%]  rounded-full p-3.5 flex-row items-center justify-center gap-2"
                        style={{borderWidth: 6, borderColor: '#FEE2CD'}}
                      >
                        {/* <Ionicons name="videocam" size={30} color="#F75F15" /> */}
                        <MaterialIcons name="videocam" size={28} color="white" />
                        {/* <Text className="text-[#F75F15] text-sm" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                          Watch Product Video
                        </Text> */}
                      </Pressable>
                    )}
                  </View>

                  <View className="">
                    {/* <Text className="text-base" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
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
                    </View> */}
                    <View className="pt-5 pb-3 border-b border-neutral-200">
                      <Text className="text-base font-bold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Description
                      </Text>
                      <Text className="text-sm pt-2" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                        {eachData?.description}
                      </Text>
                    </View>

                    {/* Delivery Options Section */}
                    <View className="pt-5 border-b border-gray-200 pb-5">
                      <Text className="text-lg mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Delivery Options
                      </Text>
                      
                      {/* Basic Delivery Options */}
                      <View className="flex-col gap-2 mb-4">
                        <View className="flex-row items-center gap-2">

                           {eachData?.pickup_available === true ? (
                            <View className="w-4 h-4 rounded items-center justify-center bg-green-600 border-green-300">
                              <MaterialIcons name="check" size={12} color="white" />
                            </View>
                          ) : (
                              <View className="w-4 h-4 rounded items-center justify-center bg-red-600 border-red-300">
                                  <MaterialIcons name="close" size={12} color="white" />
                              </View>
                          )}

                          <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                            Pickup Available
                          </Text>
                         
                        </View>
                        <View className="flex-row items-center gap-2">

                          {eachData?.delivery_available === true ? (
                            <View className="w-4 h-4 rounded  items-center justify-center bg-green-600 border-green-300">
                              <MaterialIcons name="check" size={12} color="white" />
                            </View>
                          ) : (
                              <View className="w-4 h-4 rounded  items-center justify-center bg-red-600 border-red-300">
                                  <MaterialIcons name="close" size={12} color="white" />
                              </View>
                          )}

                          <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                            Delivery Available
                          </Text>
                        </View>
                        
                        {/* Free Delivery Option */}
                        {eachData?.free_delivery === true && (
                          <View className="flex-row items-center gap-2">
                            <View className="w-4 h-4 rounded  items-center justify-center bg-green-600 border-green-300">
                              <MaterialIcons name="check" size={12} color="white" />
                            </View>
                            <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                              Free Delivery
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Specific Delivery Types - Only show if delivery is available and there are available types */}
                      {eachData?.delivery_available === true && availableDeliveryTypes.length > 0 && (
                        <View className="mb-4">
                          <Text
                            className="text-gray-600 text-sm mb-3"
                            style={{ fontFamily: "HankenGrotesk_500Medium" }}
                          >
                            Available Delivery Methods:
                          </Text>
                          {availableDeliveryTypes.map((deliveryType) => (
                            <DeliveryOptionDisplay
                              key={deliveryType.key}
                              label={deliveryType.label}
                              description={deliveryType.description}
                              isAvailable={deliveryType.isAvailable}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                   
                    <View className="flex-row items-center justify-between pt-5 pb-4 border-b border-neutral-200">
                      <Pressable  className="flex-row gap-4 items-center">
                        <View className="w-10 h-10 overflow-hidden rounded-full bg-gray-300 justify-center items-center flex">
                          <Image
                            source={{ uri: eachData?.store.store_image }}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </View>
                        <View>
                          <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-base font-bold">
                            {eachData?.store.name}
                            {isOwnProduct && (
                              <Text className="text-green-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                                {" "} (Your Store)
                              </Text>
                            )}
                          </Text>
                          {eachData?.store.description.length > 18 ? 
                          <Text className="text-sm" style={{fontFamily: 'HankenGrotesk_400Regular'}}>{eachData?.store.description.slice(0, 18)}...</Text> :
                          <Text className="text-sm" style={{fontFamily: 'HankenGrotesk_400Regular'}}>{eachData?.store.description}</Text> 
                          }
                        </View>
                      </Pressable>
                      {!isOwnProduct && (
                        <View className="flex-row gap-1">
                         <Pressable onPress={()=>router.push(`/(access)/(user_stacks)/viewSellerStore?storeId=${eachData?.store?.id}`)} 
                         className="bg-[#FEEEE6] p-3 rounded-full px-5 flex-row gap-2">
                            <Ionicons name="eye" size={15} color={'#F75F15'}/>
                            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-[#F75F15]">
                              Store
                            </Text>
                          </Pressable>

                          {isPending || unFollowPending ? (
                            <Pressable
                              className="bg-[#F75F15] p-3 rounded-full px-5 w-20">
                              <ActivityIndicator size="small" color="white" />
                            </Pressable>
                          ): (
                            <>
                              { isCurrentStoreFollowed ? (
                                <Pressable
                                  onPress={handleFollowUnfollowStore}
                                  className="bg-[#F75F15] p-3 rounded-full px-5">
                                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-white">
                                    Unfollow
                                  </Text>
                                </Pressable>
                              ): (
                                <Pressable
                                  onPress={handleFollowUnfollowStore}
                                  className="bg-[#F75F15] p-3 rounded-full px-5">
                                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-white">
                                    Follow
                                  </Text>
                                </Pressable>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Reviews Section */}
                    <View className="" style={{ marginTop: 30 }}>
                      <Text className="text-base font-bold " style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                        Reviews
                      </Text>
                      {reviews.length === 0 ? (
                        <View>
                          <EmptyState
                            title="No Reviews Yet"
                            description="Be the first to review this product!"
                            icon="message"
                          />
                          
                          {!isOwnProduct && (
                          <View className="w-[50%] justify-center m-auto">
                            <SolidMainButton text="Drop Review" onPress={handleProductReview}/>
                          </View>
                          )}
                        </View>
                      ): (

                      <View>
                        <>
                          {reviews?.map((review:any, index:any) => (
                            <View key={index} className="mt-3 pt-5  border-t border-neutral-200">
                              <View className="flex-row justify-between ">
                                <View className="flex-row gap-2 items-center">
                                  <View className="w-10 h-10 overflow-hidden rounded-full bg-neutral-200 justify-center items-center flex">
                                    <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-lg text-black">
                                      {review?.user?.fullname.slice(0, 1).toUpperCase()}
                                    </Text>
                                  </View>
                                  <View>
                                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-black">
                                      @{review?.user?.username.toLowerCase()}
                                    </Text>

                                    {review?.rating === '1Star' && (
                                      <View className="flex-row">
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star-outline" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star-outline" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star-outline" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star-outline" size={15} color={"#FBBC05"} />
                                      </View>
                                    )}

                                    {review?.rating === '2Star' && (
                                      <View className="flex-row">
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star-outline" size={15} color={"#FBBC05"} />
                                      </View>
                                    )}

                                    {review?.rating === '3Star' && (
                                      <View className="flex-row">
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star-outline" size={15} color={"#FBBC05"} />
                                      </View>
                                    )}

                                    {review?.rating === '4Star' && (
                                      <View className="flex-row">
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star-outline" size={15} color={"#FBBC05"} />
                                      </View>
                                    )}

                                    {review?.rating === '5Star' && (
                                      <View className="flex-row">
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                        <MaterialIcons name="star" size={15} color={"#FBBC05"} />
                                      </View>
                                    )}
                                  </View>
                                </View>
                                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm">
                                  10th June, 2025
                                </Text>
                              </View>
                              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm pt-3 text-black">
                                {review.comment}
                              </Text>
                            </View>
                          ))}
                        </>
                        
                        <View className="pt-3 border-t border-neutral-200 mt-5" >
                          <Pressable onPress={handleProductReview} className="bg-[#FEEEE6] rounded-full flex-row justify-center items-center gap-3 p-3" style={{width: '35%'}}>
                            <Text className="text-sm text-[#F75F15]" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Add Review</Text>
                            <MaterialIcons name="arrow-forward" color={'#F75F15'} size={15}/>
                          </Pressable>
                        </View>

                      </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}


        <View className="px-5">
          {/* Horizontal Product Lists - No longer nested in ScrollView */}
          <HorizontalProductList
            data={userRelatedProductData?.data?.more_from_seller}
            title="More From this Seller"
            isLoading={isLoading}
            emptyTitle="No More Products"
            emptyDescription="This seller doesn't have any other products available at the moment."
          />

          <HorizontalProductList
            data={userRelatedProductData?.data?.related_products}
            title="Related Products"
            isLoading={isLoading}
            emptyTitle="No Related Products"
            emptyDescription="We couldn't find any related products for this item."
          />
        </View>
      </ScrollView>

      {showDialog && (
          <View style={styles.modalOverlaya}>
              <Pressable style={styles.modalBackdrop} onPress={closeDialog} />
              <View className='bg-white rounded-2xl p-6 mx-6 w-[90%]'>
                  <Text className='text-xl text-center mb-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                      Enter message to send
                  </Text>
                  <View className=''>
                      <Controller
                          name="content"
                          control={control}
                          rules={{
                              required: "Messgae is required",
                          }}
                          render={({ field: { onChange, onBlur, value } }) => (
                              <TextInput 
                                  placeholder='Enter Message'
                                  placeholderTextColor={"#AFAFAF"}
                                  onChangeText={onChange}
                                  onBlur={onBlur}
                                  value={value}
                                  keyboardType="default"
                                  autoCapitalize="sentences"
                                  autoCorrect={false}
                                  multiline={true}
                                  numberOfLines={4}
                                  textAlignVertical="top"
                                  
                                  style={styles.inputStyle}
                                  className='border border-neutral-200'
                              />
                          )}
                      />
                   
                      
                      <ErrorMessage
                          errors={errors}
                          name="content"
                          render={({ message }) => (
                              <Text className="pl-2 pt-3 text-sm text-red-600">
                                  {message}
                              </Text>
                          )}
                      />
                  </View>
                  <View className='flex-row items-center justify-between mt-5'>
                      <View className='w-[48%]'>
                          <SolidLightButton onPress={closeDialog} text='Cancel'/>
                      </View>
                      <View className='w-[48%]'>
                        {messagePending ? (
                          <Pressable className="bg-[#F75F15] p-4 rounded-full justify-center items-center" style={{opacity: 0.6}} disabled>
                            <ActivityIndicator size="small" color="white" />
                          </Pressable>
                        ): (
                          <SolidMainButton onPress={handleSubmit(onSubmit)} text='Send'/>
                        )}
                      </View>
                  </View>
              </View>
          </View>
      )}

      {/* Fixed Action Buttons at Bottom */}
      {!isLoading && eachData && (
        <View style={styles.fixedBottomContainer} className="bg-neutral-100">
          {!isOwnProduct && (
            <View className="flex-row gap-1 justify-center">
              <View className="w-[34%]">
                <SolidLightButton text="Chat" onPress={handlePress}/>
              </View>

              <View className="w-[34%]">
                {isOutOfStock ? (
                  <Pressable className="bg-[#F75F15] p-4 rounded-full justify-center items-center" style={{opacity: 0.6}} disabled>
                    <Text className="text-white text-center font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                      Out of Stock
                    </Text>
                  </Pressable>
                ) : isAtStockLimit ? (
                  <Pressable className="bg-[#F75F15] p-4 rounded-full justify-center items-center" style={{opacity: 0.6}} disabled>
                    <Text className="text-white text-center font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                      Max Quantity Reached
                    </Text>
                  </Pressable>
                ) : (
                  <SolidMainButton
                    text={
                      remainingStock <= 3 && remainingStock > 0
                        ? `Add (${remainingStock} more)`
                        : currentQuantityInCart > 0
                         ? `Add (${remainingStock} more)`
                         : "Add to Cart"
                    }
                    onPress={handleAddToCart}
                  />
                )}
              </View>

              <View className="w-[34%]">
                <SolidLightButton text="Call Seller" onPress={handleCallSeller}/>
              </View>
            </View>
          )}
        </View>
      )}

      <CustomSuccessModal visible={isSuccessModalVisible} onClose={() => setIsSuccessModalVisible(false)} />
      <VideoModal visible={isVideoModalVisible} onClose={closeVideoModal} videoUrl={eachData?.video_url} />
    </SafeAreaView>
  )
}

// Styles for the modal and fixed bottom container
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
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  modalDescription: {
    fontSize: 14,
    paddingHorizontal: 20,
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
    fontFamily: "HankenGrotesk_400Regular",
  },
  buttonContainer: {
    width: "100%",
  },
  // Fixed bottom container styles
  fixedBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },

  modalOverlaya: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  inputStyle: {
      borderRadius: 7,
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingTop: 10,
      fontFamily: "HankenGrotesk_400Regular",
      backgroundColor: '#F6F6F6',
      height: 100,
  },

  titleStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6,
  },

  modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
  },
})

export default Product