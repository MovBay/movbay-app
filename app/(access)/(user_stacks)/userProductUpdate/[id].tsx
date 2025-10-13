import { View, Text, Image, Pressable, ActivityIndicator, Modal, FlatList, TextInput, ScrollView, StyleSheet, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useGetSingleProducts, useUpdateUserProduct } from '@/hooks/mutations/sellerAuth'
import { Dimensions } from 'react-native'
import ProductSkeleton from '@/components/ProductSkeleton'
import { ResizeMode, Video } from 'expo-av'
import { Controller, useForm } from 'react-hook-form'
import { ErrorMessage } from '@hookform/error-message'
import * as ImagePicker from 'expo-image-picker'
import { Toast } from 'react-native-toast-notifications'

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
      <Pressable 
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)" }}
        onPress={onClose}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
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
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

// Category Picker Modal
const CategoryPickerModal = ({
  visible,
  onClose,
  onSelect,
  selectedCategory,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (category: string) => void
  selectedCategory: string
}) => {
  const categories = [
    'Fashion & Clothing',
    'Electronics & Gadgets',
    'Beauty & Personal Care',
    'Automotive & Cars',
    'Sports & Fitness',
    'Shoes & Footwear',
    'Bags & Luggage',
    'Food & Beverages',
    'Home & Garden',
    'Books & Education',
    'Health & Wellness',
    'Baby & Kids',
    'Jewelry & Accessories',
    'Art & Crafts',
    'Pet Supplies',
    'Musical Instruments',
    'Office & Business',
    'Travel & Outdoor',
    'Gaming & Entertainment',
    'Tools & Hardware',
    'Toys & Games',
    'Photography & Video',
    'Furniture & Decor',
    'Other'
  ]

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.pickerContainer} onPress={(e) => e.stopPropagation()}>
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Select Category
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </Pressable>
          </View>
          <ScrollView className="max-h-96">
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => {
                  onSelect(category)
                  onClose()
                }}
                className={`p-4 border-b border-gray-100 ${
                  selectedCategory === category ? 'bg-orange-50' : ''
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <Text
                    className={`text-base ${selectedCategory === category ? 'text-[#F75F15]' : 'text-black'}`}
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  >
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <MaterialIcons name="check" size={20} color="#F75F15" />
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// Condition Picker Modal
const ConditionPickerModal = ({
  visible,
  onClose,
  onSelect,
  selectedCondition,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (condition: string) => void
  selectedCondition: string
}) => {
  const conditions = ['New', 'Used', 'Refurbished']
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.pickerContainer} onPress={(e) => e.stopPropagation()}>
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Select Condition
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </Pressable>
          </View>
          <ScrollView>
            {conditions.map((condition) => (
              <Pressable
                key={condition}
                onPress={() => {
                  onSelect(condition)
                  onClose()
                }}
                className={`p-4 border-b border-gray-100 ${
                  selectedCondition === condition ? 'bg-orange-50' : ''
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <Text
                    className={`text-base ${selectedCondition === condition ? 'text-[#F75F15]' : 'text-black'}`}
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  >
                    {condition}
                  </Text>
                  {selectedCondition === condition && (
                    <MaterialIcons name="check" size={20} color="#F75F15" />
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
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
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false)
  const [isConditionModalVisible, setIsConditionModalVisible] = useState(false)
  const [productImages, setProductImages] = useState<any[]>([])
  const [newImages, setNewImages] = useState<any[]>([])
  const [videoUri, setVideoUri] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: '',
      category: '',
      brand: '',
      description: '',
      original_price: '',
      discounted_price: '',
      condition: '',
      stock_available: '',
      size: '',
    },
  })

  const watchCategory = watch('category')
  const watchCondition = watch('condition')

  // Populate form with existing data
  useEffect(() => {
    if (eachData) {
      setValue('title', eachData.title || '')
      setValue('category', eachData.category || '')
      setValue('brand', eachData.brand || '')
      setValue('description', eachData.description || '')
      setValue('original_price', eachData.original_price?.toString() || '')
      setValue('discounted_price', eachData.discounted_price?.toString() || '')
      setValue('condition', eachData.condition || '')
      setValue('stock_available', eachData.stock_available?.toString() || '')
      setValue('size', eachData.size || '')
      
      // Set existing images
      if (eachData.product_images) {
        setProductImages(eachData.product_images)
      }
      
      // Set existing video
      if (eachData.video_url) {
        setVideoUri(eachData.video_url)
      }
    }
  }, [eachData, setValue])

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

  // Pick new images
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Toast.show('Permission to access gallery is required!', { type: 'warning' })
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setNewImages([...newImages, ...result.assets])
      Toast.show('Images added successfully', { type: 'success' })
    }
  }

  // Pick video
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Toast.show('Permission to access gallery is required!', { type: 'warning' })
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    })

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri)
      Toast.show('Video added successfully', { type: 'success' })
    }
  }

  // Remove existing image
  const removeExistingImage = (index: number) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedImages = [...productImages]
            updatedImages.splice(index, 1)
            setProductImages(updatedImages)
            Toast.show('Image removed', { type: 'success' })
          },
        },
      ]
    )
  }

  // Remove new image
  const removeNewImage = (index: number) => {
    const updatedImages = [...newImages]
    updatedImages.splice(index, 1)
    setNewImages(updatedImages)
  }

  // Remove video
  const removeVideo = () => {
    Alert.alert(
      'Remove Video',
      'Are you sure you want to remove this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setVideoUri(null)
            Toast.show('Video removed', { type: 'success' })
          },
        },
      ]
    )
  }

  const onSubmit = (data: any) => {
    // Prepare form data for update
    const formData = new FormData()
    
    // Append text fields
    Object.keys(data).forEach((key) => {
      if (data[key]) {
        formData.append(key, data[key])
      }
    })

    // Append new images
    newImages.forEach((image, index) => {
      formData.append('product_images', {
        uri: image.uri,
        type: 'image/jpeg',
        name: `product_image_${index}.jpg`,
      } as any)
    })

    // Append video if changed
    if (videoUri && !videoUri.startsWith('http')) {
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'product_video.mp4',
      } as any)
    }

    // Call update mutation
    mutate(formData, {
      onSuccess: (response) => {
        console.log('Product updated:', response.data)
        Toast.show('Product updated successfully', { type: 'success' })
        router.back()
      },
      onError: (error: any) => {
        console.error('Update error:', error)
        Toast.show('Failed to update product', { type: 'error' })
      },
    })
  }

  const renderImageItem = ({ item, index }: { item: any; index: number }) => (
    <View style={{ width: screenWidth, height: screenWidth, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={{ uri: item?.image_url || item?.uri }}
        style={{ width: '95%', height: '70%', borderRadius: 10, objectFit: 'cover' }}
        resizeMode="contain"
      />
    </View>
  )

  return (
    <SafeAreaView className="bg-white flex-1">
      <View className="flex-1">
        <KeyboardAwareScrollView
          className=""
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ProductSkeleton />
          ) : (
            <View className="pb-5">
              {/* Header */}
              <View className="flex-row justify-between items-center px-5 py-4 border-b border-neutral-200">
                <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
                  <MaterialIcons name="chevron-left" size={24} color={'black'} />
                  <Text className="text-lg" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                    Edit Product
                  </Text>
                </Pressable>
              </View>

              <View className="px-5 pt-5">
                {/* Existing Images Section */}
                <View className="mb-5">
                  <Text className="text-base mb-3" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                    Current Images ({productImages.length})
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {productImages.map((image: any, index: number) => (
                      <View
                        key={`existing-${index}`}
                        style={{
                          width: (screenWidth - 50) / 3 - 5,
                          height: 100,
                          marginBottom: 8,
                        }}
                        className="overflow-hidden rounded-md bg-gray-50 border border-gray-100 relative"
                      >
                        <Image
                          source={{ uri: image?.image_url }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        <Pressable
                          onPress={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                        >
                          <Ionicons name="close" size={12} color="white" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>

                {/* New Images Section */}
                {newImages.length > 0 && (
                  <View className="mb-5">
                    <Text className="text-base mb-3" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      New Images ({newImages.length})
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {newImages.map((image: any, index: number) => (
                        <View
                          key={`new-${index}`}
                          style={{
                            width: (screenWidth - 50) / 3 - 5,
                            height: 100,
                            marginBottom: 8,
                          }}
                          className="overflow-hidden rounded-md bg-gray-50 border border-green-300 relative"
                        >
                          <Image
                            source={{ uri: image.uri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                          <View className="absolute top-1 left-1 bg-green-500 rounded-full px-2 py-0.5">
                            <Text className="text-white text-xs" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                              NEW
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => removeNewImage(index)}
                            className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                          >
                            <Ionicons name="close" size={12} color="white" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Add Images Button */}
                <Pressable
                  onPress={pickImages}
                  className="bg-[#FEEEE6] p-4 rounded-lg mb-5 flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="camera" size={20} color="#F75F15" />
                  <Text className="text-[#F75F15] text-base" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                    Add More Images
                  </Text>
                </Pressable>

                {/* Video Section */}
                {videoUri && (
                  <View className="mb-5">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-base" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                        Product Video
                      </Text>
                      <Pressable onPress={removeVideo} className="flex-row items-center gap-1">
                        <Ionicons name="trash" size={16} color="#EF4444" />
                        <Text className="text-red-500 text-sm" style={{ fontFamily: 'HankenGrotesk_500Medium' }}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={openVideoModal}
                      className="bg-black rounded-lg h-40 justify-center items-center relative"
                    >
                      <Ionicons name="play-circle" size={50} color="white" />
                      <Text className="text-white text-sm mt-2" style={{ fontFamily: 'HankenGrotesk_500Medium' }}>
                        Tap to preview
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Add/Change Video Button */}
                <Pressable
                  onPress={pickVideo}
                  className="bg-[#FEEEE6] p-4 rounded-lg mb-5 flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="videocam" size={20} color="#F75F15" />
                  <Text className="text-[#F75F15] text-base" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                    {videoUri ? 'Change Video' : 'Add Video'}
                  </Text>
                </Pressable>

                {/* Form Fields */}
                <View className="space-y-4">
                  {/* Title */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Product Title *
                    </Text>
                    <Controller
                      name="title"
                      control={control}
                      rules={{ required: 'Title is required' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Enter product title"
                          placeholderTextColor="#AFAFAF"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          style={styles.inputStyle}
                          className="border border-neutral-200"
                        />
                      )}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="title"
                      render={({ message }) => <Text className="text-red-600 text-sm mt-1">{message}</Text>}
                    />
                  </View>

                  {/* Category */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Category *
                    </Text>
                    <Controller
                      name="category"
                      control={control}
                      rules={{ required: 'Category is required' }}
                      render={({ field: { value } }) => (
                        <Pressable
                          onPress={() => setIsCategoryModalVisible(true)}
                          style={styles.inputStyle}
                          className="border border-neutral-200 flex-row justify-between items-center"
                        >
                          <Text
                            className={value ? 'text-black' : 'text-gray-400'}
                            style={{ fontFamily: 'HankenGrotesk_400Regular' }}
                          >
                            {value || 'Select category'}
                          </Text>
                          <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                        </Pressable>
                      )}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="category"
                      render={({ message }) => <Text className="text-red-600 text-sm mt-1">{message}</Text>}
                    />
                  </View>

                  {/* Brand */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Brand
                    </Text>
                    <Controller
                      name="brand"
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Enter brand name"
                          placeholderTextColor="#AFAFAF"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          style={styles.inputStyle}
                          className="border border-neutral-200"
                        />
                      )}
                    />
                  </View>

                  {/* Condition */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Condition *
                    </Text>
                    <Controller
                      name="condition"
                      control={control}
                      rules={{ required: 'Condition is required' }}
                      render={({ field: { value } }) => (
                        <Pressable
                          onPress={() => setIsConditionModalVisible(true)}
                          style={styles.inputStyle}
                          className="border border-neutral-200 flex-row justify-between items-center"
                        >
                          <Text
                            className={value ? 'text-black' : 'text-gray-400'}
                            style={{ fontFamily: 'HankenGrotesk_400Regular' }}
                          >
                            {value || 'Select condition'}
                          </Text>
                          <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                        </Pressable>
                      )}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="condition"
                      render={({ message }) => <Text className="text-red-600 text-sm mt-1">{message}</Text>}
                    />
                  </View>

                  {/* Size */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Size
                    </Text>
                    <Controller
                      name="size"
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Enter size (e.g., S, M, L, XL)"
                          placeholderTextColor="#AFAFAF"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          style={styles.inputStyle}
                          className="border border-neutral-200"
                        />
                      )}
                    />
                  </View>

                  {/* Original Price */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Original Price *
                    </Text>
                    <Controller
                      name="original_price"
                      control={control}
                      rules={{ required: 'Original price is required' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Enter original price"
                          placeholderTextColor="#AFAFAF"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          keyboardType="numeric"
                          style={styles.inputStyle}
                          className="border border-neutral-200"
                        />
                      )}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="original_price"
                      render={({ message }) => <Text className="text-red-600 text-sm mt-1">{message}</Text>}
                    />
                  </View>

                  {/* Discounted Price */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Discounted Price *
                    </Text>
                    <Controller
                      name="discounted_price"
                      control={control}
                      rules={{ required: 'Discounted price is required' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Enter discounted price"
                          placeholderTextColor="#AFAFAF"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          keyboardType="numeric"
                          style={styles.inputStyle}
                          className="border border-neutral-200"
                        />
                      )}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="discounted_price"
                      render={({ message }) => <Text className="text-red-600 text-sm mt-1">{message}</Text>}
                    />
                  </View>

                  {/* Stock Available */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Stock Available *
                    </Text>
                    <Controller
                      name="stock_available"
                      control={control}
                      rules={{ required: 'Stock quantity is required' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Enter stock quantity"
                          placeholderTextColor="#AFAFAF"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          keyboardType="numeric"
                          style={styles.inputStyle}
                          className="border border-neutral-200"
                        />
                      )}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="stock_available"
                      render={({ message }) => <Text className="text-red-600 text-sm mt-1">{message}</Text>}
                    />
                  </View>

                  {/* Description */}
                  <View className="mb-4">
                    <Text className="text-sm mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Description *
                    </Text>
                    <Controller
                      name="description"
                      control={control}
                      rules={{ required: 'Description is required' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Enter product description"
                          placeholderTextColor="#AFAFAF"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          style={[styles.inputStyle, { height: 100 }]}
                          className="border border-neutral-200"
                        />
                      )}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="description"
                      render={({ message }) => <Text className="text-red-600 text-sm mt-1">{message}</Text>}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </KeyboardAwareScrollView>

        {/* Video Modal */}
        <VideoModal visible={isVideoModalVisible} onClose={closeVideoModal} videoUrl={videoUri} />

        {/* Category Picker Modal */}
        <CategoryPickerModal
          visible={isCategoryModalVisible}
          onClose={() => setIsCategoryModalVisible(false)}
          onSelect={(category) => setValue('category', category)}
          selectedCategory={watchCategory}
        />

        {/* Condition Picker Modal */}
        <ConditionPickerModal
          visible={isConditionModalVisible}
          onClose={() => setIsConditionModalVisible(false)}
          onSelect={(condition) => setValue('condition', condition)}
          selectedCondition={watchCondition}
        />

        {/* Fixed buttons at the bottom */}
        {!isLoading && (
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-6">
            <View className="flex-row gap-3 justify-center">
              <View className="w-[50%]">
                <SolidLightButton text="Cancel" onPress={() => router.back()} />
              </View>

              <View className="w-[50%]">
                {isPending ? (
                  <Pressable
                    className="bg-[#F75F15] p-4 rounded-full justify-center items-center"
                    style={{ opacity: 0.6 }}
                    disabled
                  >
                    <ActivityIndicator size="small" color="white" />
                  </Pressable>
                ) : (
                  <SolidMainButton text="Update Product" onPress={handleSubmit(onSubmit)} />
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'HankenGrotesk_400Regular',
    backgroundColor: '#F6F6F6',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
})

export default UserProductUpdate