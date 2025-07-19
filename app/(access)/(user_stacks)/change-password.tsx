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
import Ionicons from "@expo/vector-icons/Ionicons"

const ChangePassword = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateUserProfile()
  const { profile, isLoading, refetch } = useProfile()
  const [image, setImage] = useState<string | null>(null)
  const toast = useToast()

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_new_password: "",
    },
  })

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData()

      // Add text fields to FormData
      formData.append("old_password", data.old_password)
      formData.append("New Password", data.new_password)
      formData.append("confirm_new_password", data.confirm_new_password)

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
              <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Change Password
              </Text>
            </View>

            <View className="mt-6 flex-col">
              <View className="mb-5">
                <Text style={styles.titleStyle}>Old Password</Text>
                <Controller
                  name="old_password"
                  control={control}
                  rules={{
                    required: "Old Password is required",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        placeholder="E.g - *******"
                        placeholderTextColor={"#AFAFAF"}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="default"
                        style={styles.inputStyle}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showOldPassword}
                      />
                      <Pressable 
                        className="absolute right-0 items-center justify-center w-16 bg-gray-50 rounded-lg h-full"
                        onPress={() => setShowOldPassword(!showOldPassword)}
                      >
                        <Ionicons 
                          name={showOldPassword ? "eye-off" : "eye"} 
                          size={20} 
                          color={'gray'}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="old_password"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              <View className="mb-5">
                <Text style={styles.titleStyle}>New Password</Text>
                <Controller
                  name="new_password"
                  control={control}
                  rules={{
                    required: "New Password is required",
                    minLength: {
                      value: 3,
                      message: "New Password must be at least 3 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: "New Password can only contain letters, numbers, and underscores",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        placeholder="E.g - ******"
                        placeholderTextColor={"#AFAFAF"}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="default"
                        style={styles.inputStyle}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showNewPassword}
                      />
                      <Pressable 
                        className="absolute right-0 items-center justify-center w-16 bg-gray-50 rounded-lg h-full"
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons 
                          name={showNewPassword ? "eye-off" : "eye"} 
                          size={20} 
                          color={'gray'}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="new_password"
                  render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
                />
              </View>

              <View className="mb-5">
                <Text style={styles.titleStyle}>Confirm New Password</Text>
                <Controller
                  name="confirm_new_password"
                  control={control}
                  rules={{
                    required: "Confirm New Password is required",
                    minLength: {
                      value: 3,
                      message: "New Password must be at least 3 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: "New Password can only contain letters, numbers, and underscores",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                        <TextInput
                          placeholder="E.g - ******"
                          placeholderTextColor={"#AFAFAF"}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          keyboardType="default"
                          style={styles.inputStyle}
                          autoCapitalize="none"
                          autoCorrect={false}
                          secureTextEntry={!showConfirmPassword}
                        />

                        <Pressable 
                          className="absolute right-0 items-center justify-center w-16 bg-gray-50 rounded-lg h-full"
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <Ionicons 
                            name={showConfirmPassword ? "eye-off" : "eye"} 
                            size={20} 
                            color={'gray'}
                          />
                        </Pressable>
                    </View>
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="confirm_new_password"
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

export default ChangePassword

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