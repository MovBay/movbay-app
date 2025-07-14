import { View, Text, Image } from "react-native"
import { useState, useEffect, useCallback } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { Pressable } from "react-native"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import { TextInput, Switch } from "react-native"
import { ErrorMessage } from "@hookform/error-message"
import { Controller, useForm } from "react-hook-form"
import { StyleSheet } from "react-native"
import RNPickerSelect from "react-native-picker-select"
import { useToast } from "react-native-toast-notifications"
import { nigeriaStates, State, City } from "../../../constants/state-city"

// Types for better type safety
interface AddressBookItem {
  id: string;
  label: string;
  streetAddress: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
}

interface FormData {
  deliveryMethod: string;
  recipientFullName: string;
  recipientPhone: string;
  recipientEmail: string;
  alternativeFullName: string;
  alternativePhone: string;
  alternativeEmail: string;
  streetAddress: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
}

interface CartData {
  items: Array<{
    store: number;
    product: number;
    amount: number;
    quantity: number;
  }>;
  total_amount: number;
  cart_summary: {
    total_items: number;
    subtotal: number;
  };
}

// Mock address book data
const addressBookData: AddressBookItem[] = [
  {
    id: "1",
    label: "Home - 12 Adeola Odeku Street, Victoria Island, Lagos",
    streetAddress: "12 Adeola Odeku Street",
    landmark: "Opposite Zenith Bank",
    city: "lagos-island",
    state: "lagos",
    postalCode: "100001"
  },
  {
    id: "2", 
    label: "Office - 45 Allen Avenue, Ikeja, Lagos",
    streetAddress: "45 Allen Avenue",
    landmark: "Near Computer Village",
    city: "ikeja",
    state: "lagos",
    postalCode: "100271"
  },
  {
    id: "3",
    label: "Parents House - 23 Independence Layout, Enugu",
    streetAddress: "23 Independence Layout",
    landmark: "Close to New Haven Market",
    city: "enugu-east",
    state: "enugu",
    postalCode: "400001"
  }
]

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

// Custom Input Component
const CustomInput = ({
  label,
  placeholder,
  name,
  control,
  rules,
  keyboardType = "default",
  autoCapitalize = "none",
  errors,
  ...props
}: {
  label: string;
  placeholder: string;
  name: keyof FormData;
  control: any;
  rules?: any;
  keyboardType?: any;
  autoCapitalize?: any;
  errors: any;
}) => (
  <View className="mb-5">
    <Text style={styles.titleStyle}>{label}</Text>
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={"#AFAFAF"}
          onChangeText={onChange}
          onBlur={onBlur}
          value={value}
          keyboardType={keyboardType}
          style={styles.inputStyle}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          {...props}
        />
      )}
    />
    <ErrorMessage
      errors={errors}
      name={name}
      render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
    />
  </View>
)

// Custom Picker Component
const CustomPicker = ({
  label,
  name,
  control,
  rules,
  items,
  placeholder,
  disabled = false,
  errors,
}: {
  label: string;
  name: keyof FormData;
  control: any;
  rules?: any;
  items: Array<{ label: string; value: string }>;
  placeholder: string;
  disabled?: boolean;
  errors: any;
}) => (
  <View className="mb-5">
    <Text style={styles.titleStyle}>{label}</Text>
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value } }) => (
        <View className="relative">
          <RNPickerSelect
            onValueChange={onChange}
            value={value}
            items={items}
            placeholder={{ label: placeholder, value: "" }}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            disabled={disabled}
          />
          <View className="absolute right-6 top-4">
            <MaterialIcons name="arrow-drop-down" size={25} color={"gray"} />
          </View>
        </View>
      )}
    />
    <ErrorMessage
      errors={errors}
      name={name}
      render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
    />
  </View>
)

const DeliveryDetails = () => {
  const { cartData } = useLocalSearchParams()
  const [parsedCartData, setParsedCartData] = useState<CartData | null>(null)
  const [useAddressBook, setUseAddressBook] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [availableCities, setAvailableCities] = useState<City[]>([])
  
  const toast = useToast()

  // Parse cart data on component mount
  useEffect(() => {
    if (cartData) {
      try {
        const parsed = JSON.parse(cartData as string)
        setParsedCartData(parsed)
      } catch (error) {
        console.error("Error parsing cart data:", error)
        toast.show("Error loading cart data", {
          type: "error",
          placement: "top",
        })
      }
    }
  }, [cartData])

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      deliveryMethod: "",
      recipientFullName: "",
      recipientPhone: "",
      recipientEmail: "",
      alternativeFullName: "",
      alternativePhone: "",
      alternativeEmail: "",
      streetAddress: "",
      landmark: "",
      city: "",
      state: "",
      postalCode: "",
    },
    mode: "onChange",
  })

  const selectedState = watch("state")

  // Delivery method options
  const deliveryMethodOptions = [
    { label: "MovBay Express", value: "MovBay_Dispatch" },
    { label: "Speedy Dispatch", value: "Speedy_Dispatch" },
    { label: "Pickup Hub", value: "Pickup_Hub" },
  ]

  // Load cities when state changes
  useEffect(() => {
    if (selectedState) {
      const selectedStateData = nigeriaStates.find(state => state.id === selectedState)
      if (selectedStateData) {
        setAvailableCities(selectedStateData.cities)
      }
    } else {
      setAvailableCities([])
      setValue("city", "")
    }
  }, [selectedState, setValue])

  // Address book selection handler
  const handleAddressBookSelection = useCallback((addressId: string) => {
    setSelectedAddressId(addressId)
    
    if (addressId) {
      const selectedAddress = addressBookData.find(addr => addr.id === addressId)
      if (selectedAddress) {
        setValue("streetAddress", selectedAddress.streetAddress)
        setValue("landmark", selectedAddress.landmark)
        setValue("city", selectedAddress.city)
        setValue("state", selectedAddress.state)
        setValue("postalCode", selectedAddress.postalCode)
      }
    } else {
      const addressFields: (keyof FormData)[] = ["streetAddress", "landmark", "city", "state", "postalCode"]
      addressFields.forEach(field => setValue(field, ""))
    }
  }, [setValue])

  // Handle address book toggle
  const handleAddressBookToggle = useCallback((value: boolean) => {
    setUseAddressBook(value)
    if (!value) {
      setSelectedAddressId("")
      const addressFields: (keyof FormData)[] = ["streetAddress", "landmark", "city", "state", "postalCode"]
      addressFields.forEach(field => setValue(field, ""))
    }
  }, [setValue])

  // Phone number validation - must start with +234
  const phoneValidation = {
    required: "Phone Number is required",
    pattern: {
      value: /^\+234[0-9]{10}$/,
      message: "Phone number must start with +234",
    },
  }

  // Email validation - now required
  const emailValidation = {
    required: "Email Address is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Please enter a valid email address",
    },
  }

  // Helper function to get state name from ID
  const getStateName = (stateId: string) => {
    const state = nigeriaStates.find(s => s.id === stateId)
    return state ? state.name : stateId
  }

  // Helper function to get city name from ID
  const getCityName = (cityId: string, stateId: string) => {
    const state = nigeriaStates.find(s => s.id === stateId)
    if (state) {
      const city = state.cities.find(c => c.id === cityId)
      return city ? city.name : cityId
    }
    return cityId
  }

  const onSubmit = (data: FormData) => {
    try {
      if (!parsedCartData) {
        toast.show("Cart data not available", {
          type: "error",
          placement: "top",
        })
        return
      }

      // Structure delivery data according to API format
      const deliveryData = {
        delivery_method: data.deliveryMethod,
        full_name: data.recipientFullName,
        phone_number: data.recipientPhone,
        email: data.recipientEmail,
        landmark: data.landmark,
        delivery_address: data.streetAddress,
        city: getCityName(data.city, data.state),
        state: getStateName(data.state),
        alternative_address: data.streetAddress,
        alternative_name: data.alternativeFullName,
        alternative_phone: data.alternativePhone,
        alternative_email: data.alternativeEmail,
        postal_code: parseInt(data.postalCode) || 0,
      }

      // Combine cart data and delivery data
      const combinedData = {
        delivery: deliveryData,
        items: parsedCartData.items,
        total_amount: parsedCartData.total_amount,
        cart_summary: parsedCartData.cart_summary,
      }
      // Navigate to delivery summary with combined data
      router.push({
        pathname: "/(access)/(user_stacks)/delivery_details_summary",
        params: { orderData: JSON.stringify(combinedData) }
      })
      
    } catch (error) {
      console.error("Error submitting delivery details:", error)
      toast.show("Error saving delivery details. Please try again.", {
        type: "error",
        placement: "top",
      })
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={false} />
      
      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 2,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="">
            {/* Header */}
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Delivery Details
              </Text>
            </View>

            <View className="mt-6 flex-col">
              {/* Delivery Method */}
              <CustomPicker
                label="Delivery Method"
                name="deliveryMethod"
                control={control}
                rules={{ required: "Delivery method is required" }}
                items={deliveryMethodOptions}
                placeholder="Select a delivery method"
                errors={errors}
              />

              {/* Recipient Information */}
              <Text className="text-lg pb-3" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Recipient Information
              </Text>
              
              <CustomInput
                label="Full Name"
                placeholder='e.g. "Chinaza Eze"'
                name="recipientFullName"
                control={control}
                rules={{ required: "Full Name is required" }}
                keyboardType="default"
                autoCapitalize="words"
                errors={errors}
              />

              <CustomInput
                label="Phone Number"
                placeholder="e.g +2348031234567"
                name="recipientPhone"
                control={control}
                rules={phoneValidation}
                keyboardType="phone-pad"
                errors={errors}
              />

              <CustomInput
                label="Email Address"
                placeholder='e.g. "recipient@gmail.com"'
                name="recipientEmail"
                control={control}
                rules={emailValidation}
                keyboardType="email-address"
                autoCapitalize="none"
                errors={errors}
              />

              {/* Alternative Recipient Information - Now Required */}
              <Text className="text-lg pb-3 mt-2 pt-6 border-t border-neutral-200" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Alternative Recipient Information
              </Text>
              
              <CustomInput
                label="Full Name"
                placeholder='e.g. "Alternative Contact Name"'
                name="alternativeFullName"
                control={control}
                rules={{ required: "Alternative recipient full name is required" }}
                keyboardType="default"
                autoCapitalize="words"
                errors={errors}
              />
              
              <CustomInput
                label="Phone Number"
                placeholder="e.g +2348031234567"
                name="alternativePhone"
                control={control}
                rules={phoneValidation}
                keyboardType="phone-pad"
                errors={errors}
              />
              
              <CustomInput
                label="Email Address"
                placeholder='e.g. "alternative@gmail.com"'
                name="alternativeEmail"
                control={control}
                rules={emailValidation}
                keyboardType="email-address"
                autoCapitalize="none"
                errors={errors}
              />

              {/* Delivery Address */}
              <Text className="text-lg pb-3 mt-2 pt-6 border-t border-neutral-200" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Delivery Address
              </Text>
              
              <ToggleSwitch
                value={useAddressBook}
                onValueChange={handleAddressBookToggle}
                label="Use from address book"
              />

              {useAddressBook ? (
                <View className="mb-5">
                  <Text style={styles.titleStyle}>Select Address</Text>
                  <View className="relative">
                    <RNPickerSelect
                      onValueChange={handleAddressBookSelection}
                      value={selectedAddressId}
                      items={addressBookData.map((address) => ({
                        label: address.label,
                        value: address.id,
                      }))}
                      placeholder={{ label: "Select an address", value: "" }}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                    />
                    <View className="absolute right-6 top-4">
                      <MaterialIcons name="arrow-drop-down" size={25} color={"gray"} />
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <CustomInput
                    label="Street Address"
                    placeholder='e.g. "12 Adeola Odeku Street"'
                    name="streetAddress"
                    control={control}
                    rules={{ required: "Street Address is required" }}
                    keyboardType="default"
                    autoCapitalize="words"
                    errors={errors}
                  />
                  <CustomInput
                    label="Landmark"
                    placeholder='e.g. "Opposite Zenith Bank"'
                    name="landmark"
                    control={control}
                    rules={{ required: "Landmark is required" }}
                    keyboardType="default"
                    autoCapitalize="words"
                    errors={errors}
                  />
                  <CustomPicker
                    label="State"
                    name="state"
                    control={control}
                    rules={{ required: "State is required" }}
                    items={nigeriaStates.map((state) => ({
                      label: state.name,
                      value: state.id,
                    }))}
                    placeholder="Select a state"
                    errors={errors}
                  />
                  <CustomPicker
                    label="City"
                    name="city"
                    control={control}
                    rules={{ required: "City is required" }}
                    items={availableCities.map((city) => ({
                      label: city.name,
                      value: city.id,
                    }))}
                    placeholder={selectedState ? "Select a city" : "Select state first"}
                    disabled={!selectedState}
                    errors={errors}
                  />
                  <CustomInput
                    label="Postal Code"
                    placeholder='e.g. "100001"'
                    name="postalCode"
                    control={control}
                    rules={{ required: "Postal Code is required" }}
                    keyboardType="number-pad"
                    errors={errors}
                  />
                </>
              )}
            </View>
          </View>
        </KeyboardAwareScrollView>
        
        {/* Fixed Create Button at Bottom */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
          <SolidMainButton 
            onPress={handleSubmit(onSubmit)}
            text={"Confirm Delivery"}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default DeliveryDetails

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
    fontSize: 12,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6,
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