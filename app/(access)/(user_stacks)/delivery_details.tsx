import { View, Text, Image } from "react-native"
import { useState, useEffect, useCallback } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { Pressable, TouchableOpacity } from "react-native"
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
import { useProfile } from "@/hooks/mutations/auth"

// Use environment variable for Google Places API key
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

// Types for better type safety
interface AddressBookItem {
  id: string;
  label: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  state: string;
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
  delivery_types?: {
    movbay_express: boolean;
    speed_dispatch: boolean;
    pickup: boolean;
  };
}

// Toggle Switch Component
const ToggleSwitch = ({
  value,
  onValueChange,
  label,
  disabled = false,
}: { 
  value: boolean; 
  onValueChange: (value: boolean) => void; 
  label: string;
  disabled?: boolean;
}) => (
  <View className="flex-row items-center justify-between py-3">
    <Text style={[styles.titleStyle, disabled && { color: '#ccc' }]}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#E5E7EB", true: disabled ? "#E5E7EB" : "#F75F15" }}
      thumbColor={value && !disabled ? "#FFFFFF" : "#FFFFFF"}
      ios_backgroundColor="#E5E7EB"
      disabled={disabled}
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

// Custom Phone Input Component
const CustomPhoneInput = ({
  label,
  name,
  control,
  rules,
  errors,
}: {
  label: string;
  name: keyof FormData;
  control: any;
  rules?: any;
  errors: any;
}) => (
  <View className="mb-5">
    <Text style={styles.titleStyle}>{label}</Text>
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, onBlur, value } }) => (
        <View className='relative'>
          <View className='absolute z-10 left-0 top-0 justify-center items-center h-full px-4 bg-gray-100 rounded-l-md border-r border-gray-200'>
            <Text className='text-[#3A3541] font-medium '>+234</Text>
          </View>
          <TextInput 
            placeholder='8094422763'
            placeholderTextColor={"#AFAFAF"}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            keyboardType="phone-pad"
            style={[styles.inputStyle, { paddingLeft: 70 }]}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
          />
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

// Google Places Address Input Component - FIXED
const GooglePlacesAddressInput = ({
  label,
  name,
  control,
  rules,
  errors,
  placeholder,
}: {
  label: string;
  name: keyof FormData;
  control: any;
  rules?: any;
  errors: any;
  placeholder: string;
}) => {
  const [addressPredictions, setAddressPredictions] = useState<PlacePrediction[]>([])
  const [showAddressPredictions, setShowAddressPredictions] = useState(false)

  // Function to fetch Google Places predictions
  const fetchAddressPredictions = async (input: string) => {
    if (input.length < 3) {
      setAddressPredictions([])
      setShowAddressPredictions(false)
      return
    }
    if (!GOOGLE_PLACES_API_KEY) {
      console.error("Google Places API Key is not set.")
      return
    }
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input,
        )}&key=${GOOGLE_PLACES_API_KEY}&types=address&components=country:ng`,
      )

      const data = await response.json()

      if (data.predictions) {
        setAddressPredictions(data.predictions)
        setShowAddressPredictions(true)
      }
    } catch (error) {
      console.error("Error fetching address predictions:", error)
    }
  }

  return (
    <View className="mb-5">
      <Text style={styles.titleStyle}>{label}</Text>
      <View style={{ position: "relative" }}>
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                placeholder={placeholder}
                placeholderTextColor={"#AFAFAF"}
                onChangeText={(text) => {
                  onChange(text)
                  fetchAddressPredictions(text)
                }}
                onBlur={() => {
                  onBlur()
                  // Delay hiding predictions to allow for selection
                  setTimeout(() => setShowAddressPredictions(false), 150)
                }}
                value={value || ""}
                keyboardType="default"
                style={styles.inputStyle}
                autoCapitalize="words"
                autoCorrect={false}
              />
              
              {/* Address Predictions List */}
              {showAddressPredictions && addressPredictions.length > 0 && (
                <View style={styles.predictionsContainer}>
                  {addressPredictions.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={styles.predictionItem}
                      onPress={() => {
                        // Handle address selection properly
                        onChange(item.description)
                        setShowAddressPredictions(false)
                        setAddressPredictions([])
                      }}
                    >
                      <MaterialIcons name="location-on" size={20} color="#666" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.predictionMainText}>{item.structured_formatting.main_text}</Text>
                        <Text style={styles.predictionSecondaryText}>
                          {item.structured_formatting.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        />
      </View>
      <ErrorMessage
        errors={errors}
        name={name}
        render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
      />
    </View>
  )
}

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
            style={disabled ? disabledPickerSelectStyles : pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            disabled={disabled}
          />
          <View className="absolute right-6 top-4">
            <MaterialIcons name="arrow-drop-down" size={25} color={disabled ? "#ccc" : "gray"} />
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
  const [deliveryMethodOptions, setDeliveryMethodOptions] = useState<Array<{ label: string; value: string }>>([])
  const [addressBookData, setAddressBookData] = useState<AddressBookItem[]>([])
  const [hasProfileAddress, setHasProfileAddress] = useState(false)
  const [isAddressLoading, setIsAddressLoading] = useState(true)
  const toast = useToast()

  const { profile, isLoading } = useProfile()
  
  // Helper function to truncate address for label
  const truncateAddress = (address: string, maxLength: number = 50) => {
    if (address.length <= maxLength) return address
    return address.substring(0, maxLength) + '...'
  }

  // Process profile address and set up address book - FIXED
  useEffect(() => {
    setIsAddressLoading(true)
    
    if (profile?.data?.address) {
      try {
        // Handle different address formats
        let processedAddresses: AddressBookItem[] = []
        
        if (typeof profile.data.address === 'string') {
          // If address is a string, create a single address book item using the actual address as label
          processedAddresses = [{
            id: 'profile-address-1',
            label: truncateAddress(profile.data.address), // Use actual address as label
            streetAddress: profile.data.address,
            landmark: '',
            city: '',
            state: ''
          }]
        } else if (Array.isArray(profile.data.address)) {
          // If address is an array, process each address
          processedAddresses = profile.data.address.map((addr: any, index: number) => {
            const streetAddress = addr.streetAddress || addr.address || addr.street_address || ''
            return {
              id: addr.id || `address-${index}`,
              label: addr.label || truncateAddress(streetAddress) || `Address ${index + 1}`, // Use actual address if no label
              streetAddress: streetAddress,
              landmark: addr.landmark || '',
              city: addr.city || '',
              state: addr.state || ''
            }
          })
        } else if (typeof profile.data.address === 'object') {
          // If address is an object, create a single address book item
          const addr = profile.data.address
          const streetAddress = addr.streetAddress || addr.address || addr.street_address || ''
          processedAddresses = [{
            id: addr.id || 'profile-address-1',
            label: addr.label || truncateAddress(streetAddress) || 'Address', // Use actual address if no label
            streetAddress: streetAddress,
            landmark: addr.landmark || '',
            city: addr.city || '',
            state: addr.state || ''
          }]
        }

        // Filter out addresses that don't have at least a street address
        processedAddresses = processedAddresses.filter(addr => 
          addr.streetAddress && addr.streetAddress.trim() !== ''
        )

        setAddressBookData(processedAddresses)
        setHasProfileAddress(processedAddresses.length > 0)
      } catch (error) {
        console.error('Error processing profile address:', error)
        setAddressBookData([])
        setHasProfileAddress(false)
      }
    } else {
      setAddressBookData([])
      setHasProfileAddress(false)
    }
    
    setIsAddressLoading(false)
  }, [profile])

  const formatPhoneNumber = (phoneNumber: string) => {
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    return `+234${cleanNumber}`;
  };

  // Parse cart data and set up delivery options on component mount
  useEffect(() => {
    if (cartData) {
      try {
        const parsed = JSON.parse(cartData as string)
        setParsedCartData(parsed)
        
        // Set up delivery method options based on available delivery types
        if (parsed.delivery_types) {
          const availableOptions = []
          
          // Check each delivery type and add to options if true
          if (parsed.delivery_types.movbay_express) {
            availableOptions.push({ label: "MovBay Express", value: "MovBay_Dispatch" })
          }
          if (parsed.delivery_types.speed_dispatch) {
            availableOptions.push({ label: "Speedy Dispatch", value: "Speedy_Dispatch" })
          }
          if (parsed.delivery_types.pickup) {
            availableOptions.push({ label: "Pickup Hub", value: "Pickup_Hub" })
          }
          
          setDeliveryMethodOptions(availableOptions)
        } else {
          // Fallback: show all options if no delivery types data
          setDeliveryMethodOptions([
            { label: "MovBay Express", value: "MovBay_Dispatch" },
            { label: "Speedy Dispatch", value: "Speedy_Dispatch" },
            { label: "Pickup Hub", value: "Pickup_Hub" },
          ])
        }
        
      } catch (error) {
        console.error("Error parsing cart data:", error)
        toast.show("Error loading cart data", {
          type: "error",
          placement: "top",
        })
        
        // Set default delivery options on error
        setDeliveryMethodOptions([
          { label: "MovBay Express", value: "MovBay_Dispatch" },
          { label: "Speedy Dispatch", value: "Speedy_Dispatch" },
          { label: "Pickup Hub", value: "Pickup_Hub" },
        ])
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
    },
    mode: "onChange",
  })

  const selectedState = watch("state")

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
        setValue("landmark", selectedAddress.landmark || "")
        
        // Try to match state and city from the address string or use empty values
        // This allows users to still fill in state and city manually
        setValue("city", selectedAddress.city || "")
        setValue("state", selectedAddress.state || "")
      }
    } else {
      const addressFields: (keyof FormData)[] = ["streetAddress", "landmark", "city", "state"]
      addressFields.forEach(field => setValue(field, ""))
    }
  }, [setValue, addressBookData])

  // Handle address book toggle
  const handleAddressBookToggle = useCallback((value: boolean) => {
    if (!hasProfileAddress) return // Prevent toggling if no address
    
    setUseAddressBook(value)
    if (!value) {
      setSelectedAddressId("")
      const addressFields: (keyof FormData)[] = ["streetAddress", "landmark", "city", "state"]
      addressFields.forEach(field => setValue(field, ""))
    }
  }, [setValue, hasProfileAddress])

  // Phone number validation - updated to expect exactly 10 digits (without leading zero)
  const phoneValidation = {
    required: "Phone Number is required",
    pattern: {
      value: /^[1-9][0-9]{9}$/,
      message: "Please enter a valid 10-digit Nigerian phone number (without leading 0)"
    },
    validate: (value: string) => {
      // Additional validation to ensure it's exactly 10 digits and doesn't start with 0
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length !== 10) {
        return "Phone number must be exactly 10 digits";
      }
      if (cleanValue.startsWith('0')) {
        return "Phone number should not start with 0";
      }
      return true;
    }
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
        phone_number: formatPhoneNumber(data.recipientPhone),
        email: data.recipientEmail,
        landmark: data.landmark,
        delivery_address: data.streetAddress,
        city: getCityName(data.city, data.state),
        state: getStateName(data.state),
        alternative_address: data.streetAddress,
        alternative_name: data.alternativeFullName,
        alternative_phone: formatPhoneNumber(data.alternativePhone),
        alternative_email: data.alternativeEmail,
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
      <LoadingOverlay visible={isLoading || isAddressLoading} />
      
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
              {/* Delivery Method - Now shows only available options */}
              <CustomPicker
                label="Delivery Method"
                name="deliveryMethod"
                control={control}
                rules={{ required: "Delivery method is required" }}
                items={deliveryMethodOptions}
                placeholder={
                  deliveryMethodOptions.length > 0 
                    ? "Select a delivery method" 
                    : "No delivery methods available"
                }
                disabled={deliveryMethodOptions.length === 0}
                errors={errors}
              />

              {/* Show message if no delivery methods are available */}
              {deliveryMethodOptions.length === 0 && (
                <View className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Text className="text-orange-800 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    No delivery methods are available for the selected items. Please contact support for assistance.
                  </Text>
                </View>
              )}

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

              <CustomPhoneInput
                label="Phone Number"
                name="recipientPhone"
                control={control}
                rules={phoneValidation}
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
              
              <CustomPhoneInput
                label="Phone Number"
                name="alternativePhone"
                control={control}
                rules={phoneValidation}
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
                disabled={!hasProfileAddress}
              />

              {/* Show message when no profile address */}
              {!hasProfileAddress && !isAddressLoading && (
                <View className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Text className="text-orange-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    No address found in your profile. Please add an address to your profile or enter delivery address manually below.
                  </Text>
                </View>
              )}

              {/* Loading state for addresses */}
              {isAddressLoading && (
                <View className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Text className="text-blue-600 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                    Loading addresses...
                  </Text>
                </View>
              )}

              {useAddressBook && hasProfileAddress ? (
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
              ) : null}

              {/* Address Fields - Always show but pre-populate if address book is used */}
              <GooglePlacesAddressInput
                label="Street Address"
                name="streetAddress"
                control={control}
                rules={{ required: "Street Address is required" }}
                placeholder='e.g. "12 Adeola Odeku Street"'
                errors={errors}
              />
              
              <CustomInput
                label="Landmark (Optional)"
                placeholder='e.g. "Opposite Zenith Bank"'
                name="landmark"
                control={control}
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
  predictionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "white",
    borderRadius: 7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  predictionMainText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: "#3A3541",
  },
  predictionSecondaryText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 12,
    color: "#666",
    marginTop: 2,
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

const disabledPickerSelectStyles = {
  inputIOS: {
    fontFamily: "HankenGrotesk_400Regular",
    color: "#ccc",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 7,
    backgroundColor: "#F0F0F0",
    height: 56,
  },
  inputAndroid: {
    fontFamily: "HankenGrotesk_400Regular",
    color: "#ccc",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 7,
    backgroundColor: "#F0F0F0",
    height: 56,
  },
  placeholder: {
    color: "#ccc",
  },
}