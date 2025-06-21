import { View, Text, Image, Pressable, ActivityIndicator, Modal, FlatList } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { products } from '@/constants/datas'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useGetSingleUserProducts } from '@/hooks/mutations/sellerAuth'
import { Dimensions } from 'react-native'
import ProductSkeleton from '@/components/ProductSkeleton'
import { ResizeMode, Video } from 'expo-av'

const { width: screenWidth } = Dimensions.get('window')


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
              <Pressable onPress={onClose} className="p-2">
                <Ionicons name="close" size={30} color="white" />
              </Pressable>
            </View>

            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
              <Video
                style={{
                  width: screenWidth - 50,
                  height: (screenWidth - 40) * 0.75,
                  backgroundColor: "black",
                  borderRadius: 10,
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

const UserProduct = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const {userSingleProductData, isLoading} = useGetSingleUserProducts(id)
    const eachData = userSingleProductData?.data

    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false)
    const [isVideoModalVisible, setIsVideoModalVisible] = useState(false)
    

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
                style={{ width: '95%', height: '70%', borderRadius: 10, objectFit: 'cover' }}
                resizeMode="contain"
            />
        </View>
    )

    console.log('This is single user data', userSingleProductData?.data)

    
  return (
    <SafeAreaView className='bg-white flex-1'>
        <View className='flex-1'>
            <KeyboardAwareScrollView 
                className='' 
                contentContainerStyle={{ paddingBottom: 100 }} // Add padding to prevent content from being hidden behind buttons
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? 
                    <ProductSkeleton />
                    : 
                    <View className='pb-5'>
                        <View className='w-full h-[350px] object-cover relative'>
                            <Image style={{width: '100%', height: '100%', objectFit: 'cover'}} source={{uri: eachData?.product_images[0]?.image_url}}/>
                        
                            <Pressable onPress={()=>router.back()} className='absolute top-4 left-5 bg-white p-3 rounded-full justify-center items-center flex'>
                                <MaterialIcons name='chevron-left' size={25} color={'black'}/>
                            </Pressable>

                            <Pressable className='absolute top-4 right-5  bg-white p-3 rounded-full justify-center items-center flex'>
                                <Ionicons name='share-outline' size={25} color={'#black'}/>
                            </Pressable>
                        </View>

                        <View className='px-5 pt-3'>
                            <View className='pt-2'>
                                <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{eachData?.title}</Text>
                                <View className='flex-row justify-between pt-3'>
                                    <View className='flex-row items-center gap-3'>
                                        <Text className='text-2xl pt-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>₦ {eachData?.original_price.toLocaleString()}</Text>
                                        <Text className='text-xl pt-2 italic line-through text-neutral-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>₦ {eachData?.discounted_price.toLocaleString()}</Text>
                                    </View>
                                </View>

                                <View className='flex-row gap-3 pt-2 border-b border-neutral-200 pb-3'>
                                    <View className='flex-row'>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                    </View>
                                    <Text className='text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>(1,020)</Text>
                                </View>

                                <View className='py-4'>
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
                                </View>


                                {/* Watch Product Video Button */}
                                {eachData?.video_url && (
                                <Pressable
                                    onPress={openVideoModal}
                                    className="bg-[#F75F15] p-3 rounded-full mt-3 flex-row items-center justify-center gap-2"
                                >
                                    <Ionicons name="play-circle" size={24} color="white" />
                                    <Text className="text-white text-base" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                                    Watch Product Video
                                    </Text>
                                </Pressable>
                                )}

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
                                                    <Text className='text-white text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                                        {selectedImageIndex + 1} of {eachData?.product_images?.length}
                                                    </Text>
                                                    <Pressable onPress={closeImagePreview} className='p-2 bg-gray-200 rounded-full'>
                                                        <Ionicons name='close' size={20} color='black' />
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

                                <View className='pt-2'>
                                    <View className='pt-5 pb-3 border-b border-neutral-200'>
                                        <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Description</Text>
                                        <Text className='text-lg pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{eachData?.description}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                }
            </KeyboardAwareScrollView>
            <VideoModal visible={isVideoModalVisible} onClose={closeVideoModal} videoUrl={eachData?.video_url} />


            {/* Fixed buttons at the bottom */}
            {!isLoading && (
                <View className='absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-6'>
                    <View className='flex-row gap-3 justify-center'>
                        <View className='w-[50%]'>
                            <SolidLightButton text='Save as Draft'/>
                        </View>

                        <View className='w-[50%]'>
                            <SolidMainButton text='Post'/>
                        </View>
                    </View>
                </View>
            )}
        </View>
    </SafeAreaView>
  )
}

export default UserProduct