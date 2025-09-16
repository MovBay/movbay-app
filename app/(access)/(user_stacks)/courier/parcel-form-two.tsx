"use client"

import { View, Text, Image, TouchableOpacity, TextInput, Alert } from "react-native"
import { useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Controller, useForm } from "react-hook-form"
import { ErrorMessage } from "@hookform/error-message"
import { StyleSheet } from "react-native"
import * as ImagePicker from "expo-image-picker"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import RNPickerSelect from "react-native-picker-select"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { router, useLocalSearchParams } from "expo-router"
import { useGetParcelPrice } from "@/hooks/mutations/parcelAuth"
import LoadingOverlay from "@/components/LoadingOverlay"
import { Toast } from "react-native-toast-notifications"

// Package types based on the dropdown shown
const packageTypes = [
  { label: "Select", value: "" },
  { label: "Envelope", value: "Envelope" },
  { label: "Parcel", value: "Parcel" },
  { label: "Food", value: "Food" },
  { label: "Fragile", value: "Fragile" },
  { label: "Electronics", value: "Electronics" },
  { label: "Box", value: "Box" },
  { label: "Crate", value: "Crate" },
  { label: "Pallet", value: "Pallet" },
  { label: "Others", value: "others" },
]

interface FormTwoData {
  packageType: string
  packageDescription: string
  additionalNotes: string
  packageImages: any[]
}

const ParcelFormTwo = () => {
  const [packageImages, setPackageImages] = useState([])
  const params = useLocalSearchParams()


  const formOneData = params.formOneData ? JSON.parse(params.formOneData as string) : null

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormTwoData>({
    defaultValues: {
      packageType: "",
      packageDescription: "",
      additionalNotes: "",
      packageImages: [],
    },
  })

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
    })

    if (!result.canceled && result.assets) {
      // Limit to 2 images as shown in the design
      const selectedImages: any = result.assets.slice(0, 2)
      setPackageImages(selectedImages)
    }
  }

  const removeImage = (index: any) => {
    const updatedImages = packageImages.filter((_, i) => i !== index)
    setPackageImages(updatedImages)
  }

  const onSubmit = (data: FormTwoData) => {
    const payload = {
      pickup_address: "Port Harcourt, Back of Chem",
      delivery_address: "Rumuodara, Port Harcourt",
    }

    const formTwoData = {
      ...data,
      packageImages: packageImages,
    }

    const combinedData = {
      ...formOneData,
      ...formTwoData,
    }

    // Navigate to next screen with combined data after successful API call
    router.push({
      pathname: "/(access)/(user_stacks)/courier/parcel-summary",
      params: {
        summaryData: JSON.stringify(combinedData),
      },
    })
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* <LoadingOverlay visible={isPending} /> */}

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
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl mb-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Tell Us About the Package
            </Text>
          </View>

          {/* Upload Photo Section */}
          <View className="mb-6">
            <Text style={styles.titleStyle}>Upload Photo (Optional)</Text>
            <Text className="text-sm text-gray-500 mb-4" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Snap a quick picture for easy ID
            </Text>

            {/* Image Display Area */}
            <View className="flex-row gap-3 mb-4">
              {packageImages.map((image: any, index) => (
                <View key={index} className="relative">
                  <Image source={{ uri: image.uri }} style={styles.packageImage} />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <MaterialIcons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Show placeholder boxes if less than 2 images */}
              {packageImages.length < 2 &&
                Array.from({ length: 2 - packageImages.length }).map((_, index) => (
                  <View key={`placeholder-${index}`} style={styles.placeholderImage}>
                    <MaterialIcons name="image" size={30} color="#AFAFAF" />
                  </View>
                ))}
            </View>

            {/* Upload Button */}
            <TouchableOpacity onPress={pickImages} style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>

          {/* Package Type */}
          <View className="mb-6">
            <Text style={styles.titleStyle}>Package Type</Text>
            <Controller
              name="packageType"
              control={control}
              rules={{
                required: "Package type is required",
              }}
              render={({ field: { onChange, value } }) => (
                <View className="relative">
                  <RNPickerSelect
                    onValueChange={onChange}
                    value={value}
                    items={packageTypes.slice(1)} // Remove the first "Select" option from items
                    placeholder={{
                      label: "Select Package Type",
                      value: "",
                    }}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false}
                  />
                  <View className="absolute right-6 top-4">
                    <MaterialIcons name="arrow-drop-down" size={25} color="gray" />
                  </View>
                </View>
              )}
            />
            <ErrorMessage
              errors={errors}
              name="packageType"
              render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
            />
          </View>

          {/* Describe Package */}
          <View className="mb-6">
            <Text style={styles.titleStyle}>Describe Package</Text>
            <Controller
              name="packageDescription"
              control={control}
              rules={{
                required: "Package description is required",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Monitor Screen"
                  placeholderTextColor="#AFAFAF"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  style={styles.inputStyle}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              )}
            />
            <ErrorMessage
              errors={errors}
              name="packageDescription"
              render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
            />
          </View>

          {/* Additional Notes */}
          <View className="mb-6">
            <Text style={styles.titleStyle}>Additional Notes</Text>
            <Controller
              name="additionalNotes"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Please breakable content is inside handle with utmost care"
                  placeholderTextColor="#AFAFAF"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  multiline
                  numberOfLines={4}
                  style={[styles.inputStyle, { height: 100, textAlignVertical: "top" }]}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                />
              )}
            />
            <ErrorMessage
              errors={errors}
              name="additionalNotes"
              render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
            />
          </View>
        </KeyboardAwareScrollView>

        {/* Bottom Action Buttons */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
          <View className="flex-row items-center gap-4">
            <View className="flex-1">
              <SolidLightButton onPress={handleBack} text={"Back"} />
            </View>

            <View className="flex-1">
              <SolidMainButton onPress={handleSubmit(onSubmit)} text={"Proceed"} />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ParcelFormTwo

const styles = StyleSheet.create({
  titleStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: "#000",
    paddingBottom: 8,
    paddingTop: 6,
  },

  inputStyle: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    backgroundColor: "#F6F6F6",
    fontSize: 13,
  },

  // Image styles
  packageImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    objectFit: "cover",
  },

  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },

  uploadButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#F75F15",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignSelf: "flex-start",
  },

  uploadButtonText: {
    color: "#F75F15",
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 12,
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
    height: 52,
    fontSize: 13,
  },
  inputAndroid: {
    fontFamily: "HankenGrotesk_400Regular",
    color: "#000",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 7,
    backgroundColor: "#F6F6F6",
    height: 52,
    fontSize: 13,
  },
  placeholder: {
    color: "#AFAFAF",
  },
}