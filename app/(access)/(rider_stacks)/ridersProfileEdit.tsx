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
import { TextInput, FlatList, TouchableOpacity } from "react-native"
import { ErrorMessage } from "@hookform/error-message"
import { Controller, useForm } from "react-hook-form"
import { StyleSheet } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useToast } from "react-native-toast-notifications"
import RNPickerSelect from "react-native-picker-select";


// Replace with your Google Places API key
const GOOGLE_PLACES_API_KEY = 'AIzaSyBIWbuoiQ82RjmlwD3HG6DEeEtb4VQg5b8'

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

const RidersProfileEdit = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateUserProfile()
  const { profile, isLoading, refetch } = useProfile()
  const [image, setImage] = useState<string | null>(null)
  const [addressPredictions, setAddressPredictions] = useState<PlacePrediction[]>([])
  const [showAddressPredictions, setShowAddressPredictions] = useState(false)
  const [addressInputValue, setAddressInputValue] = useState("")
  const toast = useToast()

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      fullname: "",
      username: "",
      phone_number: "",
      vehicle_type: "",
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
      
      setAddressInputValue(profile?.data?.address || "")

      // Set existing profile picture if available
      if (profile?.data?.profile_picture) {
        setImage(profile?.data?.profile_picture)
      }
    }
  }, [profile, isLoading, reset])

  // Function to fetch Google Places predictions
  const fetchAddressPredictions = async (input: string) => {
    if (input.length < 3) {
      setAddressPredictions([])
      setShowAddressPredictions(false)
      return
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${GOOGLE_PLACES_API_KEY}&types=address&components=country:ng` // Restrict to Nigeria, change as needed
      )
      
      const data = await response.json()
      
      if (data.predictions) {
        setAddressPredictions(data.predictions)
        setShowAddressPredictions(true)
      }
    } catch (error) {
      console.error('Error fetching address predictions:', error)
    }
  }

  // Handle address input change
  const handleAddressInputChange = (text: string) => {
    setAddressInputValue(text)
    setValue('address', text)
    fetchAddressPredictions(text)
  }

  // Handle address selection from predictions
  const handleAddressSelect = (prediction: PlacePrediction) => {
    setAddressInputValue(prediction.description)
    setValue('address', prediction.description)
    setShowAddressPredictions(false)
    setAddressPredictions([])
  }

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


              <View className='mb-5'>
                    <Text style={styles.titleStyle}>Vehicle Type</Text>
                    <Controller
                        name="vehicle_type"
                        control={control}
                        rules={{
                            required: "Vehicle Type is required",
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View className='relative'>
                                <RNPickerSelect
                                    onValueChange={(itemValue) => onChange(itemValue)}
                                    value={value}
                                    items={[
                                        { label: "Motocycle", value: "motocycle" },
                                        { label: "Car", value: "car" },
                                        { label: "Bicycle", value: "bicycle" },
                                        { label: "Van", value: "van" },
                                    ]}
                                    placeholder={{
                                        label: "Select a Vehicle Type",
                                        value: "",
                                    }}
                                    style={{
                                        inputIOS: {
                                            fontFamily: "HankenGrotesk_400Regular",
                                            color: "#000",
                                            paddingVertical: 16,
                                            paddingHorizontal: 16,
                                            borderRadius: 7,
                                            backgroundColor: '#F6F6F6',
                                            height: 56,
                                        },
                                        inputAndroid: {
                                            fontFamily: "HankenGrotesk_400Regular",
                                            color: "#000",
                                            paddingVertical: 16,
                                            paddingHorizontal: 16,
                                            borderRadius: 7,
                                            backgroundColor: '#F6F6F6',
                                            height: 56,
                                        },
                                        placeholder: {
                                            color: "#AFAFAF",
                                        }
                                    }}
                                    useNativeAndroidPickerStyle={false}
                                />
                                
                                <View className='absolute right-6 top-4'>
                                    <MaterialIcons name='arrow-drop-down' size={25} color={'gray'}/>
                                </View>
                            </View>
                        )}
                    />

                    <ErrorMessage
                        errors={errors}
                        name="vehicle_type"
                        render={({ message }) => (
                            <Text className="pl-2 pt-3 text-sm text-red-600">
                                {message}
                            </Text>
                        )}
                    />
                </View>

              <View className="mb-5">
                <Text style={styles.titleStyle}>Address</Text>
                <View style={{ position: 'relative' }}>
                  <Controller
                    name="address"
                    control={control}
                    rules={{
                      required: "Address is required",
                      minLength: {
                        value: 2,
                        message: "Address must be at least 2 characters",
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="E.g - No 2 Chief Jane Lane, Lagos"
                        placeholderTextColor={"#AFAFAF"}
                        onChangeText={handleAddressInputChange}
                        onBlur={() => {
                          onBlur()
                          // Hide predictions when input loses focus
                          setTimeout(() => setShowAddressPredictions(false), 200)
                        }}
                        value={addressInputValue}
                        keyboardType="default"
                        style={styles.inputStyle}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    )}
                  />
                  
                  {/* Address Predictions List */}
                  {showAddressPredictions && addressPredictions.length > 0 && (
                    <View style={styles.predictionsContainer}>
                      {addressPredictions.map((item) => (
                        <TouchableOpacity
                          key={item.place_id}
                          style={styles.predictionItem}
                          onPress={() => handleAddressSelect(item)}
                        >
                          <MaterialIcons name="location-on" size={20} color="#666" style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.predictionMainText}>{item.structured_formatting.main_text}</Text>
                            <Text style={styles.predictionSecondaryText}>{item.structured_formatting.secondary_text}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
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

export default RidersProfileEdit

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

  predictionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
  },

  predictionsList: {
    maxHeight: 200,
    // Remove this style since we're no longer using FlatList
  },

  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  predictionMainText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: '#3A3541',
  },

  predictionSecondaryText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
})