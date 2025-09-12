import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { SolidMainButton } from '@/components/btns/CustomButtoms'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { ErrorMessage } from '@hookform/error-message'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useToast } from 'react-native-toast-notifications'
import { Ionicons } from '@expo/vector-icons'

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

interface FormData {
  pickupAddress: string;
  dropOffAddress: string;
  recipientPhoneNumber: string;
  recipientName: string;
  alternativeDropOffAddress: string;
  alternativeRecipientPhoneNumber: string;
  alternativeRecipientName: string;
}

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
  multiline = false,
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
  multiline?: boolean;
}) => (
  <View className="mb-4">
    <Text style={styles.labelStyle}>{label}</Text>
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.inputContainer}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={"#AFAFAF"}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            keyboardType={keyboardType}
            style={[styles.inputStyle, multiline && { height: 80, textAlignVertical: 'top' }]}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            multiline={multiline}
            {...props}
          />
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={25} color="#AFAFAF" />
          </View>
        </View>
      )}
    />
    <ErrorMessage
      errors={errors}
      name={name}
      render={({ message }) => <Text className="pl-2 pt-1 text-sm text-red-600">{message}</Text>}
    />
  </View>
)

// Google Places Address Input Component
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
    <View className="mb-4">
      <Text style={styles.labelStyle}>{label}</Text>
      <View style={{ position: "relative" }}>
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={styles.inputContainer}>
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
                <View style={styles.searchIconContainer}>
                    <Ionicons name="search" size={25} color="#AFAFAF" />
                </View>
              </View>
              
              {/* Address Predictions List */}
              {showAddressPredictions && addressPredictions.length > 0 && (
                <View style={styles.predictionsContainer}>
                  {addressPredictions.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={styles.predictionItem}
                      onPress={() => {
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
        render={({ message }) => <Text className="pl-2 pt-1 text-sm text-red-600">{message}</Text>}
      />
    </View>
  )
}

// Custom Phone Input Component
const CustomPhoneInput = ({
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
}) => (
  <View className="mb-4">
    <Text style={styles.labelStyle}>{label}</Text>
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
          keyboardType="phone-pad"
          style={styles.inputStyle}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={15}
        />
      )}
    />
    <ErrorMessage
      errors={errors}
      name={name}
      render={({ message }) => <Text className="pl-2 pt-1 text-sm text-red-600">{message}</Text>}
    />
  </View>
)

const ParcelFormOne = () => {
  const toast = useToast()
  
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      pickupAddress: "",
      dropOffAddress: "",
      recipientPhoneNumber: "",
      recipientName: "",
      alternativeDropOffAddress: "",
      alternativeRecipientPhoneNumber: "",
      alternativeRecipientName: "",
    },
    mode: "onChange",
  })

  // Phone number validation
  const phoneValidation = {
    required: "Phone number is required",
    pattern: {
      value: /^[+]?[\d\s\-\(\)]{10,15}$/,
      message: "Please enter a valid phone number"
    }
  }

  const onSubmit = (data: FormData) => {
    console.log('Form Data:', data)
    
    // Navigate to next screen with data
    router.push({
      pathname: "/(access)/(user_stacks)/courier/parcel-form-two",
      params: {
        formOneData: JSON.stringify(data)
      }
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <OnboardArrowTextHeader onPressBtn={() => router.back()} />
          </View>

          {/* Title Section */}
          <View className="mb-8">
            <Text style={styles.titleStyle}>Send a Package - Fast & Easy</Text>
            <Text style={styles.subtitleStyle}>
              Whether it's documents or gifts, MovBay gets it there safely.
            </Text>
          </View>

          {/* Pickup Address */}
          <GooglePlacesAddressInput
            label="Pickup Address"
            name="pickupAddress"
            control={control}
            rules={{ required: "Pickup address is required" }}
            placeholder="Where should the rider collect it?"
            errors={errors}
          />

          {/* Recipient Information Section */}
          <View className="mb-6">
            <Text style={styles.sectionTitleStyle}>Recipient Information</Text>
          </View>

          <GooglePlacesAddressInput
            label="Drop-Off Address"
            name="dropOffAddress"
            control={control}
            rules={{ required: "Drop-off address is required" }}
            placeholder="Where's it heading to?"
            errors={errors}
          />

          <CustomPhoneInput
            label="Recipient Phone number"
            name="recipientPhoneNumber"
            control={control}
            rules={phoneValidation}
            placeholder="Who's receiving the package?"
            errors={errors}
          />

          <CustomInput
            label="Recipient Name"
            name="recipientName"
            control={control}
            rules={{ required: "Recipient name is required" }}
            placeholder="Who's receiving the package?"
            keyboardType="default"
            autoCapitalize="words"
            errors={errors}
          />

          {/* Alternate Recipient Information Section */}
          <View className="mb-6 mt-4">
            <Text style={styles.sectionTitleStyle}>Alternate Recipient Information</Text>
          </View>

          <GooglePlacesAddressInput
            label="Alternative Drop-Off Address (Optional)"
            name="alternativeDropOffAddress"
            control={control}
            placeholder="Alternative Address?"
            errors={errors}
          />

          <CustomPhoneInput
            label="Alternative Recipient Phone number"
            name="alternativeRecipientPhoneNumber"
            control={control}
            placeholder="Who's receiving the package?"
            errors={errors}
          />

          <CustomInput
            label="Alternative Recipient Name"
            name="alternativeRecipientName"
            control={control}
            placeholder="Who's receiving the package?"
            keyboardType="default"
            autoCapitalize="words"
            errors={errors}
          />
        </KeyboardAwareScrollView>
        
        {/* Fixed Proceed Button at Bottom */}
        <View className="px-6 pb-4 pt-2 bg-white border-t border-gray-100">
          <SolidMainButton 
            onPress={handleSubmit(onSubmit)}
            text={"Proceed"}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ParcelFormOne

const styles = StyleSheet.create({
  titleStyle: {
    fontFamily: "HankenGrotesk_700Bold",
    fontSize: 24,
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitleStyle: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  sectionTitleStyle: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 16,
  },
  labelStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  inputStyle: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontFamily: "HankenGrotesk_400Regular",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#1F2937",
    minHeight: 56,
  },
  searchIconContainer: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predictionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 4,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  predictionMainText: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: "#1F2937",
  },
  predictionSecondaryText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
})