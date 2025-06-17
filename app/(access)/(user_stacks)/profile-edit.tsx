"use client"

import { View, Text, Image } from "react-native"
import { useState, useEffect } from "react"
import { useLogout, useProfile, useUpdateUserProfile } from "@/hooks/mutations/auth"
import { router } from "expo-router"
import { Pressable } from "react-native"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import { TextInput } from "react-native"
import { ErrorMessage } from "@hookform/error-message"
import { Controller, useForm } from "react-hook-form"
import { StyleSheet } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useToast } from "react-native-toast-notifications"

const ProfileEdit = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateUserProfile()
  const { profile, isLoading, refetch } = useProfile()
  const [image, setImage] = useState<string | null>(null)
  const toast = useToast()

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    // console.log(result)

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      fullname: "",
      username: "",
      phone_number: "",
      address: "",
    },
  })

  // Prefill form fields when profile data is loaded
  useEffect(() => {
    if (profile && !isLoading) {
      reset({
        fullname: profile?.data?.fullname || "",
        username: profile?.data?.username || "",
        phone_number: profile?.data?.phone_number || "",
        address: profile?.data?.address || "",
      })

      // Set existing profile picture if available
      if (profile?.data?.profile_picture) {
        setImage(profile?.data?.profile_picture)
      }
    }
  }, [profile, isLoading, reset])

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData()

      // Add text fields to FormData
      formData.append("fullname", data.fullname)
      formData.append("username", data.username)
      formData.append("phone_number", data.phone_number)
      formData.append("address", data.address)

      // Add image if selected
      if (image) {
        const imageUri = image
        const filename = imageUri.split("/").pop()
        const match = /\.(\w+)$/.exec(filename || "")
        const type = match ? `image/${match[1]}` : "image/jpeg"

        formData.append("profile_picture", {
          uri: imageUri,
          name: filename || "profile.jpg",
          type,
        } as any)
      }

      updateProfile(formData, {
        onSuccess: (response) => {
            console.log("This is my response", response?.data)
            toast.show("Profile Updated Successfully", { type: "success" })
            refetch()
        //   router.push("/profile")
        },
        onError: (error: any) => {
          console.error("Update error:", error)
          toast.show("Error Updating Profile", { type: "danger" })
        },
      })
    } catch (error) {
      console.error("Submit error:", error)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoggingOut || isUpdating || isLoading} />

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
              <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Edit Profile
              </Text>
            </View>

            <View className="flex-row gap-3 items-center mt-6">
              <View className="flex w-24 h-24 rounded-full bg-gray-300 items-center mt-4 relative">
                <View className="w-full h-full rounded-full overflow-hidden">
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <View className="w-full h-full bg-gray-200 items-center justify-center">
                      <MaterialIcons name="person" size={40} color={"#9CA3AF"} />
                    </View>
                  )}
                </View>
                <Pressable onPress={pickImage} className="absolute bottom-0 right-0 bg-[#FEEEE6] rounded-full p-1.5">
                  <MaterialIcons name="drive-folder-upload" size={25} color={"#F75F15"} />
                </Pressable>
              </View>
              <View>
                <Text className="text-base mt-2" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Upload
                </Text>
                <Text className="text-sm text-gray-500" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  Image should be in Jpeg, jpg, png.
                </Text>
              </View>
            </View>

            <View className="mt-6 flex-col">
              <View className="mb-5">
                <Text style={styles.titleStyle}>Full Name</Text>
                <Controller
                  name="fullname"
                  control={control}
                  rules={{
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Full name must be at least 2 characters",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="E.g - John Doe"
                      placeholderTextColor={"#AFAFAF"}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      keyboardType="default"
                      style={styles.inputStyle}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="fullname"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              <View className="mb-5">
                <Text style={styles.titleStyle}>Username</Text>
                <Controller
                  name="username"
                  control={control}
                  rules={{
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: "Username can only contain letters, numbers, and underscores",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="E.g - bigJoe"
                      placeholderTextColor={"#AFAFAF"}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      keyboardType="default"
                      style={styles.inputStyle}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="username"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              <View className="mb-5">
                <Text style={styles.titleStyle}>Phone Number</Text>
                <Controller
                  name="phone_number"
                  control={control}
                  rules={{
                    required: "Phone Number is required",
                    pattern: {
                      value: /^\+?[1-9]\d{1,14}$/,
                      message: "Please enter a valid phone number",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="E.g - +2348094422763"
                      placeholderTextColor={"#AFAFAF"}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      keyboardType="phone-pad"
                      style={styles.inputStyle}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="phone_number"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              <View className="mb-5">
                <Text style={styles.titleStyle}>Address</Text>
                <Controller
                  name="address"
                  control={control}
                  rules={{
                    required: "Adress is required",
                    minLength: {
                      value: 2,
                      message: "Address must be at least 2 characters",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="E.g - No 2 Chief Jane Lane, Lagos"
                      placeholderTextColor={"#AFAFAF"}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      keyboardType="default"
                      style={styles.inputStyle}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="address"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* Fixed Save Button at Bottom */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100 mb-5">
          <SolidMainButton onPress={handleSubmit(onSubmit)} text={"Save"} />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ProfileEdit

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
    fontSize: 15,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6,
  },
})
