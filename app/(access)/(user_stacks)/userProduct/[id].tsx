import { View, Text, Image, Pressable, ActivityIndicator, Modal, FlatList, StyleSheet, Dimensions, TextInput } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useGetSingleProducts, useUpdateUserProduct } from '@/hooks/mutations/sellerAuth'
import ProductSkeleton from '@/components/ProductSkeleton'
import { ResizeMode, Video } from 'expo-av'
import { Controller, useForm } from 'react-hook-form'
import { ErrorMessage } from '@hookform/error-message'
import { Toast } from 'react-native-toast-notifications'

const { width: screenWidth } = Dimensions.get('window')

// Delivery Option Component
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
      <View className={`w-5 h-5 rounded border items-center justify-center ${
        isAvailable ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'
      }`}>
        {isAvailable && <MaterialIcons name="check" size={14} color="green" />}
      </View>
    </View>
    <View className="flex-1">
      <Text style={styles.titleStyle}>{label}</Text>
      {description && (
        <Text className="text-xs text-gray-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
          {description}
        </Text>
      )}
    </View>
  </View>
)

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
                  height: screenWidth,
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

const UserProductUpdate = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { mutate, isPending } = useUpdateUserProduct(id)
    const { userProductData, isLoading } = useGetSingleProducts(id)
    const eachData = userProductData?.data

    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false)
    const [isVideoModalVisible, setIsVideoModalVisible] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        defaultValues: {
            title: '',
            description: '',
            original_price: '',
            discounted_price: '',
        },
    })

    // Set form values when data loads
    React.useEffect(() => {
        if (eachData) {
            setValue('title', eachData.title || '')
            setValue('description', eachData.description || '')
            setValue('original_price', eachData.original_price?.toString() || '')
            setValue('discounted_price', eachData.discounted_price?.toString() || '')
        }
    }, [eachData])

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

    const renderImageItem = ({ item, index }: { item: any, index: number }) => (
        <View style={{ width: screenWidth, height: screenWidth, justifyContent: 'center', alignItems: 'center' }}>
            <Image 
                source={{ uri: item?.image_url }} 
                style={{ width: '100%', height: '90%', objectFit: 'cover' }}
                resizeMode="contain"
            />
        </View>
    )

    const handleSaveAsDraft = () => {
        Toast.show("Product saved as draft", { type: "success" })
        router.back()
    }

    const handlePost = () => {
        Toast.show("Product posted successfully", { type: "success" })
        router.back()
    }

    // Delivery options data
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

    const availableDeliveryTypes = deliveryTypes.filter(type => type.isAvailable)

    return (
        <SafeAreaView className='bg-white flex-1'>
            <View className='flex-1'>
                <KeyboardAwareScrollView 
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoading ? 
                        <ProductSkeleton />
                        : 
                        <View className='pb-5'>
                            {/* Header Image */}
                            <View className='w-full h-[350px] object-cover relative'>
                                <Image 
                                    style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                                    source={{uri: eachData?.product_images[0]?.image_url}}
                                />
                            
                                <Pressable 
                                    onPress={() => router.back()} 
                                    className='absolute top-4 left-5 bg-white/80 p-2.5 rounded-full justify-center items-center flex'
                                >
                                    <MaterialIcons name='chevron-left' size={20} color={'black'}/>
                                </Pressable>

                                <Pressable className='absolute top-4 right-5 bg-white/80 p-2.5 rounded-full justify-center items-center flex'>
                                    <MaterialIcons name='question-mark' size={20} color={'black'}/>
                                </Pressable>

                                {/* Owner Badge */}
                                <View className="bg-[#4285F4] rounded-full p-2 px-4 left-3 bottom-3 absolute z-50">
                                    <Text className="text-white text-sm font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                                        Your Product
                                    </Text>
                                </View>

                                {/* Stock Badge */}
                                <View className={`rounded-full p-2 px-3 right-3 bottom-3 absolute z-50 ${
                                    eachData?.stock_available === 0 
                                        ? 'bg-red-500' 
                                        : eachData?.stock_available <= 5 
                                            ? 'bg-yellow-500' 
                                            : 'bg-white'
                                }`}>
                                    <Text className={`text-sm ${
                                        eachData?.stock_available <= 5 ? 'text-white' : 'text-black'
                                    }`} style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                                        {eachData?.stock_available === 0 
                                            ? 'Out of Stock' 
                                            : `${eachData?.stock_available} in stock`
                                        }
                                    </Text>
                                </View>
                            </View>

                            <View className='px-5 pt-3'>
                                {/* Location and Verification */}
                                <View className="flex-row justify-between items-center pb-2">
                                    <View className="flex-row gap-1">
                                        <MaterialIcons size={15} name="location-pin" />
                                        <Text className="text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                                            {eachData?.store?.address1?.length > 25 
                                                ? `${eachData?.store?.address1.slice(0, 25)}...`
                                                : eachData?.store?.address1
                                            }
                                        </Text>
                                    </View>

                                    {eachData?.verified === true ? (
                                        <View className="bg-blue-100 flex-row justify-center gap-1 items-center p-1.5 px-2 my-2 rounded-full">
                                            <MaterialIcons name="verified" size={15} color={"#4285F4"} />
                                            <Text className="text-green-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                                                Verified
                                            </Text>
                                        </View>
                                    ) : (
                                        <View className="bg-orange-50 flex-row justify-center gap-1 items-center p-1.5 px-2 my-2 rounded-full">
                                            <MaterialIcons name="cancel" size={15} color={"orange"} />
                                            <Text className="text-orange-500 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                                                Not verified
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Product Details */}
                                <View className='pt-2'>
                                    <Text className='text-lg font-bold' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                        {eachData?.title}
                                    </Text>
                                    <View className='flex-row justify-between border-b border-neutral-200 pb-4'>
                                        <View className='flex-row items-center gap-3'>
                                            <Text className='text-lg pt-2' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                                                ₦ {eachData?.discounted_price?.toLocaleString()}
                                            </Text>
                                            <Text className='text-lg pt-2 line-through text-neutral-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                                                ₦ {eachData?.original_price?.toLocaleString()}
                                            </Text>
                                        </View>
                                        <Pressable className="bg-neutral-100 p-2 rounded-full flex justify-center items-center">
                                            <Ionicons name="share-outline" size={20} />
                                        </Pressable>
                                    </View>

                                    {/* Stock Status */}
                                    <View className="pt-2">
                                        {eachData?.stock_available === 0 ? (
                                            <View className="mb-3">
                                                <View className="flex-row items-center">
                                                    <MaterialIcons name="error" size={15} color="#DC2626" />
                                                    <Text className="text-red-600 text-sm ml-2 font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                                                        Out of Stock
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : eachData?.stock_available <= 5 ? (
                                            <View className="mb-5">
                                                <View className="flex-row items-center pt-2">
                                                    <Ionicons name="warning" size={15} color="#D97706" />
                                                    <Text className="text-yellow-600 text-sm ml-2 font-semibold" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                                                        Low Stock - Only {eachData?.stock_available} left!
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <View className="">
                                                <View className="flex-row items-center">
                                                    <MaterialIcons name="check-circle" size={13} color="#059669" />
                                                    <Text className="text-green-700 text-sm ml-2 font-semibold" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                                                        {eachData?.stock_available} in Stock
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* Image Gallery */}
                                    <View className='py-4 relative'>
                                        <View className='flex-row flex-wrap gap-2'>
                                            {eachData?.product_images?.map((singleData: any, index: number) => (
                                                <Pressable 
                                                    key={index} 
                                                    onPress={() => openImagePreview(index)}
                                                    style={{ 
                                                        width: (screenWidth - 50) / 3 - 5,
                                                        height: 100,
                                                        marginBottom: 8
                                                    }}
                                                    className='overflow-hidden rounded-md bg-gray-50 border border-gray-100'
                                                >
                                                    <Image 
                                                        source={{uri: singleData?.image_url}} 
                                                        style={{width: '100%', height: '100%'}}
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
                                            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
                                                <SafeAreaView style={{ flex: 1 }}>
                                                    <View style={{ flex: 1 }}>
                                                        <View className='flex-row justify-between items-center p-4'>
                                                            <Text className='text-white text-sm' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                                                {selectedImageIndex + 1} of {eachData?.product_images?.length}
                                                            </Text>
                                                            <Pressable onPress={closeImagePreview} className='p-2'>
                                                                <Ionicons name='close' size={20} color='white' />
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

                                        {/* Video Button */}
                                        <View className="pt-2">
                                            <View className="flex-row justify-between items-center w-full">
                                                <View className="bg-[#FEF2CD] w-[80%] p-3 rounded-xl">
                                                    <Text className="text-sm text-[#977102]" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                                                        Seller's delivery starts within 1–2 working days for out-of-state orders.
                                                    </Text>
                                                </View>
                                                {eachData?.video_url && (
                                                    <Pressable
                                                        onPress={openVideoModal}
                                                        className="bg-[#F75F15] w-[20%] rounded-full p-3.5 flex-row items-center justify-center gap-2"
                                                        style={{borderWidth: 6, borderColor: '#FEE2CD'}}
                                                    >
                                                        <MaterialIcons name="videocam" size={28} color="white" />
                                                    </Pressable>
                                                )}
                                            </View>
                                        </View>

                                        {/* Description */}
                                        <View className='pt-5 pb-3 border-b border-neutral-200'>
                                            <Text className='text-base font-bold' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                                Description
                                            </Text>
                                            <Text className='text-sm pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                                {eachData?.description}
                                            </Text>
                                        </View>

                                        {/* Delivery Options */}
                                        <View className="pt-5 border-b border-gray-200 pb-5">
                                            <Text className="text-lg mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                                                Delivery Options
                                            </Text>
                                            
                                            <View className="flex-col gap-2 mb-4">
                                                <View className="flex-row items-center gap-2">
                                                    {eachData?.pickup_available === true ? (
                                                        <View className="w-4 h-4 rounded items-center justify-center bg-green-600">
                                                            <MaterialIcons name="check" size={12} color="white" />
                                                        </View>
                                                    ) : (
                                                        <View className="w-4 h-4 rounded items-center justify-center bg-red-600">
                                                            <MaterialIcons name="close" size={12} color="white" />
                                                        </View>
                                                    )}
                                                    <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                                                        Pickup Available
                                                    </Text>
                                                </View>

                                                <View className="flex-row items-center gap-2">
                                                    {eachData?.delivery_available === true ? (
                                                        <View className="w-4 h-4 rounded items-center justify-center bg-green-600">
                                                            <MaterialIcons name="check" size={12} color="white" />
                                                        </View>
                                                    ) : (
                                                        <View className="w-4 h-4 rounded items-center justify-center bg-red-600">
                                                            <MaterialIcons name="close" size={12} color="white" />
                                                        </View>
                                                    )}
                                                    <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                                                        Delivery Available
                                                    </Text>
                                                </View>

                                                {eachData?.free_delivery === true && (
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="w-4 h-4 rounded items-center justify-center bg-green-600">
                                                            <MaterialIcons name="check" size={12} color="white" />
                                                        </View>
                                                        <Text className="text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                                                            Free Delivery
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {eachData?.delivery_available === true && availableDeliveryTypes.length > 0 && (
                                                <View className="mb-4">
                                                    <Text className="text-gray-600 text-sm mb-3" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
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

                                        {/* Store Info */}
                                        <View className="flex-row items-center justify-between pt-5 pb-4">
                                            <View className="flex-row gap-4 items-center">
                                                <View className="w-10 h-10 overflow-hidden rounded-full bg-gray-300 justify-center items-center flex">
                                                    <Image
                                                        source={{ uri: eachData?.store?.store_image }}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                </View>
                                                <View>
                                                    <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-base font-bold">
                                                        {eachData?.store?.name}
                                                        <Text className="text-green-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                                                            {" "} (Your Store)
                                                        </Text>
                                                    </Text>
                                                    <Text className="text-sm" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                                        {eachData?.store?.description?.length > 18 
                                                            ? `${eachData?.store?.description.slice(0, 18)}...`
                                                            : eachData?.store?.description
                                                        }
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    }
                </KeyboardAwareScrollView>

                <VideoModal 
                    visible={isVideoModalVisible} 
                    onClose={closeVideoModal} 
                    videoUrl={eachData?.video_url} 
                />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    fixedBottomContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
    },
    titleStyle: {
        fontFamily: "HankenGrotesk_500Medium",
        fontSize: 14,
        color: "#3A3541",
        paddingBottom: 2,
        paddingTop: 0,
    },
})

export default UserProductUpdate