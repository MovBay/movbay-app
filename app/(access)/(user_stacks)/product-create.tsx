"use client"

import { View, Text, Image, Animated, TouchableOpacity, Dimensions } from "react-native"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { router } from "expo-router"
import { Pressable } from "react-native"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { TextInput, ScrollView, Switch } from "react-native"
import { ErrorMessage } from "@hookform/error-message"
import { Controller, useForm } from "react-hook-form"
import { StyleSheet } from "react-native"
import * as ImagePicker from "expo-image-picker"
import RNPickerSelect from "react-native-picker-select"
import { useCreateProduct } from "@/hooks/mutations/sellerAuth"
import { useToast } from "react-native-toast-notifications"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

// Utility function for price formatting
const formatPrice = (text: string): string => {
  // Remove all non-digit characters
  const numericValue = text.replace(/[^\d]/g, "")

  if (!numericValue) return ""

  // Convert to number and format with commas
  const number = Number.parseInt(numericValue, 10)
  return number.toLocaleString()
}

// Utility function to get numeric value from formatted price
const getNumericValue = (formattedPrice: string): number => {
  const numericString = formattedPrice.replace(/[^\d]/g, "")
  return Number.parseInt(numericString, 10) || 0
}

// Compress image function
const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.7, // Compress to 70% quality
      allowsMultipleSelection: false,
    })
    return uri // Return original for now, implement actual compression if needed
  } catch (error) {
    return uri
  }
}

// Custom Success Modal Component
const CustomSuccessModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  if (!visible) return null
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image source={require("../../../assets/images/success.png")} style={styles.successImage} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.modalTitle}>Product Created Successfully!</Text>
          <Text style={styles.modalDescription}>
            Your product has been listed and is now available for buyers to discover.
          </Text>
          <View style={styles.buttonContainer}>
            <SolidMainButton
              text="Go to My Products"
              onPress={() => {
                onClose()
                router.push("/(access)/(user_tabs)/(drawer)/products")
              }}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

// Toggle Switch Component
const ToggleSwitch = ({
  value,
  onValueChange,
  label,
}: { value: boolean; onValueChange: (value: boolean) => void; label: string }) => (
  <View className="flex-row items-center justify-between py-3">
    <Text style={styles.titleStyle}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#E5E7EB", true: "#F75F15" }}
      thumbColor={value ? "#FFFFFF" : "#FFFFFF"}
      ios_backgroundColor="#E5E7EB"
    />
  </View>
)

// Checkbox Component for Delivery Options
const DeliveryCheckbox = ({
  value,
  onValueChange,
  label,
  description,
}: {
  value: boolean
  onValueChange: (value: boolean) => void
  label: string
  description?: string
}) => (
  <TouchableOpacity
    onPress={() => onValueChange(!value)}
    className="flex-row items-start py-3 px-4 bg-gray-50 rounded-lg mb-3"
  >
    <View className="mr-3 mt-0.5">
      <View
        className={`w-5 h-5 rounded border-2 items-center justify-center ${
          value ? "bg-orange-500 border-orange-500" : "bg-white border-gray-300"
        }`}
      >
        {value && <MaterialIcons name="check" size={14} color="white" />}
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
  </TouchableOpacity>
)

// Image Grid Component for Product Images
const ProductImageGrid = ({
  images,
  onAddImage,
  onRemoveImage,
}: {
  images: string[]
  onAddImage: () => void
  onRemoveImage: (index: number) => void
}) => (
  <View className="">
    <Text style={styles.titleStyle}>Product Images (Max 4)</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
      <View className="flex-row gap-3">
        {/* Add Image Button */}
        {images.length < 4 && (
          <Pressable
            onPress={onAddImage}
            className="w-20 h-20 bg-gray-200 rounded-lg items-center justify-center border-2 border-dashed border-gray-300"
          >
            <MaterialIcons name="add-photo-alternate" size={30} color="#AFAFAF" />
            <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Add Photo
            </Text>
          </Pressable>
        )}
        {/* Display Selected Images */}
        {images.map((image, index) => (
          <View key={index} className="relative">
            <View className="w-20 h-20 overflow-hidden rounded-lg border border-neutral-300">
              <Image source={{ uri: image }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </View>
            <Pressable
              onPress={() => onRemoveImage(index)}
              className="absolute top-1 -right-3 bg-red-500 rounded-full p-1"
            >
              <MaterialIcons name="close" size={14} color="white" />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
    <Text className="text-xs text-gray-500 mt-2" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
      {images.length}/4 images selected
    </Text>
  </View>
)

// Custom Confirmation Bottom Sheet Component
const ConfirmProductBottomSheet = ({
  visible,
  onClose,
  onConfirm,
  productTitle = "your product",
}: {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  productTitle?: string
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, slideAnim, backdropOpacity])

  if (!visible) return null

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0, 0, 0, 0.5)", opacity: backdropOpacity }]}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.bottomSheetContainer, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle Bar */}
        <View className="items-center mb-4">
          <View className="w-10 h-1 bg-gray-300 rounded-full" />
        </View>
        {/* Icon */}
        <View className="items-center mb-4">
          <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="add-shopping-cart" size={32} color="#F75F15" />
          </View>
        </View>
        {/* Content */}
        <View className="items-center mb-6">
          <Text className="text-xl font-semibold mb-2 text-center" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            Create Product?
          </Text>
          <Text className="text-gray-600 text-center px-6" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
            Are you sure you want to create and list "{productTitle}" for sale? This will make it visible to all buyers.
          </Text>
        </View>
        {/* Buttons */}
        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <TouchableOpacity className="py-4 px-6 rounded-full bg-gray-100" onPress={onClose}>
              <Text className="text-center text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          <View className="w-[48%]">
            <SolidMainButton text="Create Product" onPress={onConfirm} />
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const ProductCreate = () => {
  const [productImages, setProductImages] = useState<string[]>([])
  const [productVideo, setProductVideo] = useState<string | null>(null)
  const [pickupAvailable, setPickupAvailable] = useState(false)
  const [deliveryAvailable, setDeliveryAvailable] = useState(false)
  const [freeDelivery, setFreeDelivery] = useState(false)
  const [autoPostToStory, setAutoPostToStory] = useState(false)

  // State for individual delivery types - each as separate boolean fields
  const [movbayExpress, setMovbayExpress] = useState(false)
  const [speedDispatch, setSpeedDispatch] = useState(false)
  const [pickup, setPickup] = useState(false)

  const toast = useToast()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [formDataToSubmit, setFormDataToSubmit] = useState<any>(null)

  const { mutate, isPending } = useCreateProduct()

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      title: "",
      category: "",
      brand: "",
      description: "",
      original_price: "",
      discounted_price: "",
      condition: "",
      stock_available: "",
      size: "",
    },
  })

  const watchedDeliveryAvailable = deliveryAvailable
  const watchedProductTitle = watch("title")
  const watchedOriginalPrice = watch("original_price")
  const watchedDiscountedPrice = watch("discounted_price")

  const categoryItems = useMemo(
      () => [
        { label: "Fashion & Clothing", value: "Fashion & Clothing" },
        { label: "Electronics & Gadgets", value: "Electronics & Gadgets" },
        { label: "Beauty & Personal Care", value: "Beauty & Personal Care" },
        { label: "Automotive & Cars", value: "Automotive & Cars" },
        { label: "Sports & Fitness", value: "Sports & Fitness" },
        { label: "Shoes & Footwear", value: "Shoes & Footwear" },
        { label: "Bags & Luggage", value: "Bags & Luggage" },
        { label: "Home & Garden", value: "Home & Garden" },
        { label: "Books & Education", value: "Books & Education" },
        { label: "Health & Wellness", value: "Health & Wellness" },
        { label: "Food & Beverages", value: "Food & Beverages" },
        { label: "Baby & Kids", value: "Baby & Kids" },
        { label: "Jewelry & Accessories", value: "Jewelry & Accessories" },
        { label: "Art & Crafts", value: "Art & Crafts" },
        { label: "Pet Supplies", value: "Pet Supplies" },
        { label: "Musical Instruments", value: "Musical Instruments" },
        { label: "Office & Business", value: "Office & Business" },
        { label: "Travel & Outdoor", value: "Travel & Outdoor" },
        { label: "Gaming & Entertainment", value: "Gaming & Entertainment" },
        { label: "Tools & Hardware", value: "Tools & Hardware" },
        { label: "Toys & Games", value: "Toys & Games" },
        { label: "Photography & Video", value: "Photography & Video" },
        { label: "Furniture & Decor", value: "Furniture & Decor" },
        { label: "Other", value: "Other" },
      ],
    [],
  )

  const brandItems = useMemo(
    () => [
      { label: "Apple", value: "Apple" },
      { label: "Samsung", value: "Samsung" },
      { label: "Nike", value: "Nike" },
      { label: "Adidas", value: "Adidas" },
      { label: "Sony", value: "Sony" },
      { label: "LG", value: "LG" },
      { label: "HP", value: "HP" },
      { label: "Dell", value: "Dell" },
      { label: "Canon", value: "Canon" },
      { label: "Nikon", value: "Nikon" },
      { label: "Microsoft", value: "Microsoft" },
      { label: "Google", value: "Google" },
      { label: "Huawei", value: "Huawei" },
      { label: "Xiaomi", value: "Xiaomi" },
      { label: "OnePlus", value: "OnePlus" },
      { label: "Puma", value: "Puma" },
      { label: "Reebok", value: "Reebok" },
      { label: "Under Armour", value: "Under Armour" },
      { label: "New Balance", value: "New Balance" },
      { label: "Converse", value: "Converse" },
      { label: "Vans", value: "Vans" },
      { label: "Jordan", value: "Jordan" },
      { label: "Gucci", value: "Gucci" },
      { label: "Louis Vuitton", value: "Louis Vuitton" },
      { label: "Chanel", value: "Chanel" },
      { label: "Prada", value: "Prada" },
      { label: "Versace", value: "Versace" },
      { label: "Balenciaga", value: "Balenciaga" },
      { label: "Dior", value: "Dior" },
      { label: "Hermès", value: "Hermès" },
      { label: "Rolex", value: "Rolex" },
      { label: "Casio", value: "Casio" },
      { label: "Seiko", value: "Seiko" },
      { label: "Fossil", value: "Fossil" },
      { label: "Citizen", value: "Citizen" },
      { label: "Timex", value: "Timex" },
      { label: "Toyota", value: "Toyota" },
      { label: "Honda", value: "Honda" },
      { label: "Ford", value: "Ford" },
      { label: "BMW", value: "BMW" },
      { label: "Mercedes-Benz", value: "Mercedes-Benz" },
      { label: "Audi", value: "Audi" },
      { label: "Volkswagen", value: "Volkswagen" },
      { label: "Hyundai", value: "Hyundai" },
      { label: "Kia", value: "Kia" },
      { label: "Nissan", value: "Nissan" },
      { label: "Mazda", value: "Mazda" },
      { label: "Other", value: "Other" },
    ],
    [],
  )

  const conditionItems = useMemo(
    () => [
      { label: "New", value: "New" },
      { label: "Used", value: "Used" },
      { label: "Refurbished", value: "Refurbished" },
    ],
    [],
  )

  // Size options dropdown items
  const sizeItems = useMemo(
    () => [
      // Clothing Sizes - Letter
      { label: "XS", value: "XS" },
      { label: "S", value: "S" },
      { label: "M", value: "M" },
      { label: "L", value: "L" },
      { label: "XL", value: "XL" },
      { label: "XXL", value: "XXL" },
      { label: "XXXL", value: "XXXL" },
      { label: "Other", value: "Other" },
    ],
    [],
  )

  // Delivery types with descriptions - now mapped to individual state variables
  const deliveryTypes = [
    {
      key: "movbay_express",
      label: "Movbay Express",
      description: "Fast delivery within 24 hours",
      value: movbayExpress,
      setValue: setMovbayExpress,
    },
    {
      key: "speed_dispatch",
      label: "Speedy Dispatch",
      description: "Quick dispatch within 2-3 business days",
      value: speedDispatch,
      setValue: setSpeedDispatch,
    },
    {
      key: "pickup",
      label: "Pickup",
      description: "Customer pickup from designated locations",
      value: pickup,
      setValue: setPickup,
    },
  ]

  // Validate discount price against original price
  useEffect(() => {
    if (watchedOriginalPrice && watchedDiscountedPrice) {
      const originalValue = getNumericValue(watchedOriginalPrice)
      const discountedValue = getNumericValue(watchedDiscountedPrice)

      if (discountedValue > originalValue) {
        setError("discounted_price", {
          type: "manual",
          message: "Discounted price cannot be higher than original price",
        })
      } else {
        clearErrors("discounted_price")
      }
    }
  }, [watchedOriginalPrice, watchedDiscountedPrice, setError, clearErrors])

  const pickProductImages = useCallback(async () => {
    const remainingSlots = 4 - productImages.length
    if (remainingSlots <= 0) {
      toast.show("Maximum 4 images allowed", { type: "warning" })
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8, // Reduced quality for faster upload
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
      })

      if (!result.canceled && result.assets) {
        // Process images in batches to avoid blocking
        const newImageUris = result.assets.map((asset) => asset.uri)
        setProductImages((prev) => [...prev, ...newImageUris])
        const count = newImageUris.length
        toast.show(`${count} image${count > 1 ? "s" : ""} added successfully`, {
          type: "success",
        })
      }
    } catch (error) {
      toast.show("Failed to select images", { type: "danger" })
    }
  }, [productImages.length, toast])

  const removeProductImage = useCallback((index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const pickProductVideo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 0.6, // Reduced quality for faster upload
      })

      if (!result.canceled && result.assets && result.assets[0]) {
        const videoAsset = result.assets[0]
        const videoSizeInBytes = videoAsset.fileSize

        if (videoSizeInBytes) {
          const videoSizeInMB = videoSizeInBytes / (1024 * 1024)
          if (videoSizeInMB > 10) {
            toast.show("Video size must be less than 10MB. Please select a smaller video.", {
              type: "danger",
            })
            return
          }
        }

        setProductVideo(videoAsset.uri)
        toast.show("Video added successfully", { type: "success" })
      }
    } catch (error) {
      toast.show("Failed to select video", { type: "danger" })
    }
  }, [toast])

  const handleFormSubmit = useCallback(
    (data: any) => {
      if (productImages.length === 0) {
        toast.show("Please add at least one product image", { type: "danger" })
        return
      }

      // Validate delivery options if delivery is enabled
      if (deliveryAvailable) {
        const hasSelectedDeliveryType = movbayExpress || speedDispatch || pickup
        if (!hasSelectedDeliveryType) {
          toast.show("Please select at least one delivery option", { type: "danger" })
          return
        }
      }

      // Validate discount price one more time before submission
      const originalValue = getNumericValue(data.original_price)
      const discountedValue = getNumericValue(data.discounted_price)

      if (data.discounted_price && discountedValue > originalValue) {
        toast.show("Discounted price cannot be higher than original price", { type: "danger" })
        return
      }

      setFormDataToSubmit(data)
      setShowConfirmModal(true)
    },
    [productImages.length, deliveryAvailable, movbayExpress, speedDispatch, pickup, toast],
  )

  const handleConfirmProductCreation = useCallback(async () => {
    setShowConfirmModal(false)
    if (!formDataToSubmit) return

    const data = formDataToSubmit
    const formData = new FormData()

    // Add basic form fields
    Object.keys(data).forEach((key) => {
      if (data[key] && data[key] !== "") {
        // Convert formatted prices back to numeric values
        if (key === "original_price" || key === "discounted_price") {
          const numericValue = getNumericValue(data[key])
          formData.append(key, numericValue.toString())
        } else {
          formData.append(key, data[key])
        }
      }
    })

    // Add boolean fields
    formData.append("pickup_available", pickupAvailable.toString())
    formData.append("delivery_available", deliveryAvailable.toString())
    formData.append("free_delivery", freeDelivery.toString())
    formData.append("auto_post_to_story", autoPostToStory.toString())

    // Add individual delivery type fields as separate boolean values
    formData.append("movbay_express", movbayExpress.toString())
    formData.append("speed_dispatch", speedDispatch.toString())
    formData.append("pickup", pickup.toString())

    // Process images in parallel for better performance
    try {
      const imagePromises = productImages.map(async (imageUri, index) => {
        const filename = imageUri.split("/").pop()
        const match = /\.(\w+)$/.exec(filename || "")
        const type = match ? `image/${match[1]}` : "image/jpeg"

        return {
          uri: imageUri,
          name: filename || `image_${index}.jpg`,
          type,
        } as any
      })

      const imageFiles = await Promise.all(imagePromises)

      imageFiles.forEach((imageFile) => {
        formData.append("images", imageFile)
        formData.append("product_images", imageFile)
      })

      // Add product video if selected
      if (productVideo) {
        const filename = productVideo.split("/").pop()
        const match = /\.(\w+)$/.exec(filename || "")
        const type = match ? `video/${match[1]}` : "video/mp4"

        formData.append("product_video", {
          uri: productVideo,
          name: filename || "video.mp4",
          type,
        } as any)
      }

      // Submit the form
      mutate(formData, {
        onSuccess: (response) => {
          setShowSuccessModal(true)
          console.log("Product created successfully:", response)

          // Reset form and state
          reset()
          setProductImages([])
          setProductVideo(null)
          setPickupAvailable(false)
          setDeliveryAvailable(false)
          setFreeDelivery(false)
          setAutoPostToStory(false)
          // Reset individual delivery type states
          setMovbayExpress(false)
          setSpeedDispatch(false)
          setPickup(false)
          setFormDataToSubmit(null)
        },
        onError: (error: any) => {
          console.log("Error creating product:", error?.response?.data)

          const errorMessage =
            error?.response?.data?.message ||
            error?.response?.data?.title ||
            "Failed to create product. Please try again."

          toast.show(errorMessage, { type: "danger" })
        },
      })
    } catch (error) {
      toast.show("Failed to process images. Please try again.", { type: "danger" })
    }
  }, [
    formDataToSubmit,
    pickupAvailable,
    deliveryAvailable,
    freeDelivery,
    autoPostToStory,
    movbayExpress,
    speedDispatch,
    pickup,
    productImages,
    productVideo,
    mutate,
    reset,
    toast,
  ])

  // Price input handler with formatting
  const handlePriceInput = useCallback((text: string, onChange: (value: string) => void) => {
    const formattedText = formatPrice(text)
    onChange(formattedText)
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isPending} />
      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 2,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            </View>
            <View className="pt-3">
              <Text className="text-2xl" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Create Product
              </Text>
              <Text className="text-base" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                List your product and start selling to thousands of buyers.
              </Text>
            </View>
            <View className="mt-6 flex-col">
              <Text className="text-xl pt-4 pb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Basic Info
              </Text>

              {/* Product Title */}
              <View className="mb-5">
                <Text style={styles.titleStyle}>Product Title</Text>
                <Controller
                  name="title"
                  control={control}
                  rules={{
                    required: "Product title is required",
                    minLength: {
                      value: 3,
                      message: "Product title must be at least 3 characters long",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="E.g - iPhone 13 Pro Max"
                      placeholderTextColor={"#AFAFAF"}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      keyboardType="default"
                      style={styles.inputStyle}
                      autoCapitalize="words"
                      autoCorrect={false}
                      maxLength={100}
                    />
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="title"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              {/* Category */}
              <View className="mb-5">
                <Text style={styles.titleStyle}>Category</Text>
                <Controller
                  name="category"
                  control={control}
                  rules={{
                    required: "Category is required",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <RNPickerSelect
                        onValueChange={(itemValue) => onChange(itemValue)}
                        value={value}
                        items={categoryItems}
                        placeholder={{
                          label: "Select a Category",
                          value: "",
                        }}
                        style={pickerSelectStyles}
                        useNativeAndroidPickerStyle={false}
                      />
                      <View className="absolute right-6 top-4">
                        <MaterialIcons name="arrow-drop-down" size={25} color={"gray"} />
                      </View>
                    </View>
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="category"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              {/* Brand - Updated to Dropdown */}
              <View className="mb-5">
                <Text style={styles.titleStyle}>Brand (Optional)</Text>
                <Controller
                  name="brand"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <RNPickerSelect
                        onValueChange={(itemValue) => onChange(itemValue)}
                        value={value}
                        items={brandItems}
                        placeholder={{
                          label: "Select a Brand",
                          value: "",
                        }}
                        style={pickerSelectStyles}
                        useNativeAndroidPickerStyle={false}
                      />
                      <View className="absolute right-6 top-4">
                        <MaterialIcons name="arrow-drop-down" size={25} color={"gray"} />
                      </View>
                    </View>
                  )}
                />
              </View>

              {/* Condition */}
              <View className="mb-5">
                <Text style={styles.titleStyle}>Product Condition</Text>
                <Controller
                  name="condition"
                  control={control}
                  rules={{
                    required: "Condition is required",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <RNPickerSelect
                        onValueChange={(itemValue) => onChange(itemValue)}
                        value={value}
                        items={conditionItems}
                        placeholder={{
                          label: "Select Condition",
                          value: "",
                        }}
                        style={pickerSelectStyles}
                        useNativeAndroidPickerStyle={false}
                      />
                      <View className="absolute right-6 top-4">
                        <MaterialIcons name="arrow-drop-down" size={25} color={"gray"} />
                      </View>
                    </View>
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="condition"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              {/* Description */}
              <View className="mb-5">
                <Text style={styles.titleStyle}>Description</Text>
                <Controller
                  name="description"
                  control={control}
                  rules={{
                    required: "Description is required",
                    minLength: {
                      value: 10,
                      message: "Description must be at least 10 characters long",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="Describe your product in detail"
                      placeholderTextColor={"#AFAFAF"}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      keyboardType="default"
                      multiline
                      numberOfLines={4}
                      style={[styles.inputStyle, { height: 100, textAlignVertical: "top" }]}
                      autoCapitalize="sentences"
                      autoCorrect={true}
                      maxLength={500}
                    />
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="description"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              <Text
                className="text-xl pt-4 pb-3 border-t border-neutral-200"
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
              >
                Pricing & Stock
              </Text>

              {/* Pricing */}
              <View className="flex-row gap-3 mb-5">
                <View className="flex-1">
                  <Text style={styles.titleStyle}>Original Price (₦)</Text>
                  <Controller
                    name="original_price"
                    control={control}
                    rules={{
                      required: "Original price is required",
                      validate: (value) => {
                        const numericValue = getNumericValue(value)
                        return numericValue > 0 || "Price must be greater than 0"
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="e.g. 7,500"
                        placeholderTextColor={"#AFAFAF"}
                        onChangeText={(text) => handlePriceInput(text, onChange)}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="number-pad"
                        style={styles.inputStyle}
                      />
                    )}
                  />
                  <ErrorMessage
                    errors={errors}
                    name="original_price"
                    render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                  />
                </View>
                <View className="flex-1">
                  <Text style={styles.titleStyle}>Discounted Price (₦)</Text>
                  <Controller
                    name="discounted_price"
                    control={control}
                    rules={{
                      validate: (value) => {
                        if (!value) return true // Optional field
                        const numericValue = getNumericValue(value)
                        if (numericValue <= 0) return "Discounted price must be greater than 0"
                        const originalValue = getNumericValue(watchedOriginalPrice)
                        if (numericValue > originalValue) {
                          return "Discounted price cannot be higher than original price"
                        }
                        return true
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="e.g. 6,500"
                        placeholderTextColor={"#AFAFAF"}
                        onChangeText={(text) => handlePriceInput(text, onChange)}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="number-pad"
                        style={styles.inputStyle}
                      />
                    )}
                  />
                  <ErrorMessage
                    errors={errors}
                    name="discounted_price"
                    render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                  />
                </View>
              </View>

              {/* Stock & Size */}
              <View className="flex-row gap-3 mb-5">
                <View className="flex-1">
                  <Text style={styles.titleStyle}>Stock Available</Text>
                  <Controller
                    name="stock_available"
                    control={control}
                    rules={{
                      required: "Stock quantity is required",
                      validate: (value) => {
                        const numericValue = Number.parseInt(value, 10)
                        return numericValue > 0 || "Stock must be greater than 0"
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="e.g. 20"
                        placeholderTextColor={"#AFAFAF"}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="number-pad"
                        style={styles.inputStyle}
                      />
                    )}
                  />
                  <ErrorMessage
                    errors={errors}
                    name="stock_available"
                    render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                  />
                </View>
                <View className="flex-1">
                  <Text style={styles.titleStyle}>Size (Optional)</Text>
                  <Controller
                    name="size"
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <RNPickerSelect
                          onValueChange={(itemValue) => onChange(itemValue)}
                          value={value}
                          items={sizeItems}
                          placeholder={{
                            label: "Select Size",
                            value: "",
                          }}
                          style={pickerSelectStyles}
                          useNativeAndroidPickerStyle={false}
                        />
                        <View className="absolute right-6 top-4">
                          <MaterialIcons name="arrow-drop-down" size={25} color={"gray"} />
                        </View>
                      </View>
                    )}
                  />
                </View>
              </View>
              <Text
                className="text-xl pt-4 pb-3 border-t border-neutral-200"
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
              >
                Product Media
              </Text>
              {/* Product Images Section */}
              <ProductImageGrid
                images={productImages}
                onAddImage={pickProductImages}
                onRemoveImage={removeProductImage}
              />
              {/* Product Video Section */}
              <View className="my-6">
                <Text style={styles.titleStyle}>Product Video (Optional)</Text>
                <View className="flex-row gap-3 items-center mt-2">
                  <View className="w-[40%]">
                    <SolidLightButton text="Upload Video" onPress={pickProductVideo} />
                  </View>
                  {productVideo ? (
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons name="videocam" size={24} color={"#F75F15"} />
                      <Text
                        style={{
                          fontFamily: "HankenGrotesk_400Regular",
                          color: "#000",
                          fontSize: 12,
                          maxWidth: 120,
                        }}
                        numberOfLines={2}
                      >
                        Video Selected
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontFamily: "HankenGrotesk_400Regular", color: "#AFAFAF" }}>No video chosen</Text>
                  )}
                </View>
              </View>

              {/* Toggle Switches */}
              <View className="mb-5 border-t border-gray-200 pt-4">
                <Text className="text-lg mb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Delivery Options
                </Text>
                <ToggleSwitch value={pickupAvailable} onValueChange={setPickupAvailable} label="Pickup Available ?" />

                <ToggleSwitch value={freeDelivery} onValueChange={setFreeDelivery} label="Free Delivery ?" />

                <ToggleSwitch
                  value={deliveryAvailable}
                  onValueChange={setDeliveryAvailable}
                  label="Delivery Available ?"
                />

                {/* Delivery Type Options - Only show if delivery is available */}
                {watchedDeliveryAvailable && (
                  <View className="mb-5 ml-4">
                    <Text
                      className="text-gray-400 text-sm"
                      style={{ paddingBottom: 12, fontFamily: "HankenGrotesk_400Regular" }}
                    >
                      Select Delivery Options (Choose one or more)
                    </Text>
                    {deliveryTypes.map((deliveryType) => (
                      <DeliveryCheckbox
                        key={deliveryType.key}
                        value={deliveryType.value}
                        onValueChange={deliveryType.setValue}
                        label={deliveryType.label}
                        description={deliveryType.description}
                      />
                    ))}
                    {/* Show validation error if no delivery type is selected */}
                    {deliveryAvailable && !movbayExpress && !speedDispatch && !pickup && (
                      <Text className="pl-2 pt-1 text-sm text-red-600">Please select at least one delivery option</Text>
                    )}
                  </View>
                )}

                <Text className="text-lg mt-3 pt-3 border-t border-neutral-200" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Visibility & Promotion
                </Text>
                <ToggleSwitch value={autoPostToStory} onValueChange={setAutoPostToStory} label="Auto Post to Story" />
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
        {/* Fixed Create Button at Bottom */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
          <SolidMainButton onPress={handleSubmit(handleFormSubmit)} text={"Create Product"} />
        </View>
        {/* Success Modal */}
        <CustomSuccessModal visible={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
        {/* Confirmation Bottom Sheet */}
        <ConfirmProductBottomSheet
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmProductCreation}
          productTitle={watchedProductTitle || "your product"}
        />
      </View>
    </SafeAreaView>
  )
}

export default ProductCreate

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    backgroundColor: "#F6F6F6",
  },
  titleStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6,
  },
  // Custom Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "white",
    width: "85%",
    borderRadius: 24,
    padding: 20,
  },
  modalContent: {
    alignItems: "center",
  },
  successImage: {
    width: 150,
    height: 150,
  },
  textContainer: {
    marginTop: 16,
  },
  modalTitle: {
    fontSize: 20,
    textAlign: "center",
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  modalDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    width: "90%",
    alignSelf: "center",
    paddingTop: 8,
    fontFamily: "HankenGrotesk_400Regular",
  },
  buttonContainer: {
    width: "90%",
    alignSelf: "center",
    marginTop: 24,
  },

  // Bottom Sheet Styles (for ConfirmProductBottomSheet)
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    zIndex: 999,
  },
})

const pickerSelectStyles = {
  inputIOS: {
    fontFamily: "HankenGrotesk_400Regular",
    color: "#000",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 7,
    backgroundColor: "#F6F6F6",
    height: 56,
  },
  inputAndroid: {
    fontFamily: "HankenGrotesk_400Regular",
    color: "#000",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 7,
    backgroundColor: "#F6F6F6",
    height: 56,
  },
  placeholder: {
    color: "#AFAFAF",
  },
}