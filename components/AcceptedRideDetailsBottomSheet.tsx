import type React from "react"
import { View, Text, TouchableOpacity, Modal, Dimensions, Image, Linking, ActivityIndicator } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { SolidMainButton } from "./btns/CustomButtoms"
import { usePickedUp } from "@/hooks/mutations/ridersAuth"
import { useToast } from "react-native-toast-notifications"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useMemo } from "react"

const { height } = Dimensions.get("window")

interface AcceptedRideDetailsBottomSheetProps {
  isVisible: boolean
  onClose: () => void
  ride: any | null
  onMarkForPickup: (ride: any) => void
}

const AcceptedRideDetailsBottomSheet: React.FC<AcceptedRideDetailsBottomSheetProps> = ({
  isVisible,
  onClose,
  ride,
  onMarkForPickup,
}) => {
  const toast = useToast()

  // Memoize the mutation to prevent recreation on every render
  const { mutate, isPending } = usePickedUp(ride?.order?.order_id)

  // Memoize computed values
  const orderStatus = useMemo(() => ride?.order?.status, [ride?.order?.status])
  const isOutForDelivery = useMemo(() => orderStatus === "out_for_delivery", [orderStatus])
  const buttonText = useMemo(() => 
    isOutForDelivery ? "Mark as Delivered" : "Mark for Pickup", 
    [isOutForDelivery]
  )
  const successMessage = useMemo(() => 
    isOutForDelivery ? "Order delivered successfully!" : "Ride marked for pickup successfully!", 
    [isOutForDelivery]
  )

  // Memoize phone numbers to prevent unnecessary re-renders
  const senderPhone = useMemo(() => ride?.order?.store?.owner?.phone_number, [ride?.order?.store?.owner?.phone_number])
  const recipientPhone = useMemo(() => ride?.order?.buyer?.phone_number, [ride?.order?.buyer?.phone_number])

  const handleCallSender = useCallback(() => {
    if (senderPhone) {
      Linking.openURL(`tel:${senderPhone}`).catch((err) =>
        toast.show(`Could not call sender: ${err.message}`, { type: "danger" }),
      )
    } else {
      toast.show("Sender phone number not available.", { type: "warning" })
    }
  }, [senderPhone, toast])

  const handleCallRecipient = useCallback(() => {
    if (recipientPhone) {
      Linking.openURL(`tel:${recipientPhone}`).catch((err) =>
        toast.show(`Could not call recipient: ${err.message}`, { type: "danger" }),
      )
    } else {
      toast.show("Recipient phone number not available.", { type: "warning" })
    }
  }, [recipientPhone, toast])

  // Function to get coordinates from Google Geocoding API
  const getCoordinatesFromAddress = useCallback(async (address: string) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      const encodedAddress = encodeURIComponent(address)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          latitude: location.lat,
          longitude: location.lng
        }
      } else {
        throw new Error("Address not found")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      throw error
    }
  }, [])

  // Function to save coordinates to AsyncStorage
  const saveDropOffCoordinates = useCallback(async (latitude: number, longitude: number) => {
    try {
      const coordinates = {
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      }
      await AsyncStorage.setItem("dropoff_coordinates", JSON.stringify(coordinates))
      console.log("Drop-off coordinates saved to AsyncStorage:", coordinates)
    } catch (error) {
      console.error("Error saving coordinates to AsyncStorage:", error)
      toast.show("Failed to save drop-off location", { type: "danger" })
    }
  }, [toast])

  const handleMarkForPickup = useCallback(async () => {
    try {
      // Get the full drop-off address
      const deliveryAddress = ride?.order?.delivery?.delivery_address
      const city = ride?.order?.delivery?.city
      const state = ride?.order?.delivery?.state
      
      if (!deliveryAddress || !city || !state) {
        toast.show("Incomplete delivery address information", { type: "warning" })
        return
      }

      const fullAddress = `${deliveryAddress}, ${city}, ${state}`
      const coordinates = await getCoordinatesFromAddress(fullAddress)
      
      mutate(
        {
          dropoff_latitude: coordinates.latitude,
          dropoff_longitude: coordinates.longitude,
          address: fullAddress
        },
        {
          onSuccess: async (data) => {
            await saveDropOffCoordinates(coordinates.latitude, coordinates.longitude)
            toast.show(successMessage, { type: "success" })
            onMarkForPickup(ride)
            onClose() 
          },
          onError: (error: any) => {
            console.error("Request failed:", error)
            const errorMessage = isOutForDelivery 
              ? `Failed to mark as delivered: ${error.message || "Unknown error"}`
              : `Failed to mark for pickup: ${error.message || "Unknown error"}`
            toast.show(errorMessage, { type: "danger" })
          },
        }
      )
    } catch (error: any) {
      console.error("Error processing request:", error)
      const errorMessage = isOutForDelivery
        ? `Error marking as delivered: ${error.message || "Unknown error"}`
        : `Error processing pickup: ${error.message || "Unknown error"}`
      toast.show(errorMessage, { type: "danger" })
    }
  }, [ride, getCoordinatesFromAddress, mutate, saveDropOffCoordinates, toast, successMessage, onMarkForPickup, onClose, isOutForDelivery])

  // Early return if no ride data
  if (!ride) return null

  console.log('This is ride', ride)

  // Memoize store data to prevent unnecessary re-renders
  const storeData = useMemo(() => ({
    image: ride?.order?.order_items?.[0]?.product?.store?.store_image,
    name: ride?.order?.order_items?.[0]?.product?.store?.name,
    username: ride?.order?.order_items?.[0]?.product?.store?.owner?.username,
    address: ride?.order?.order_items?.[0]?.product?.store?.address1
  }), [ride?.order?.order_items])

  const deliveryData = useMemo(() => ({
    address: ride?.order?.delivery?.delivery_address,
    city: ride?.order?.delivery?.city,
    state: ride?.order?.delivery?.state
  }), [ride?.order?.delivery])

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View style={{ height: height * 0.7 }} className="bg-neutral-50 rounded-t-3xl shadow-2xl">
          {/* Handle Bar */}
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-4" />
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 mb-6">
            <View>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xl font-bold text-neutral-900">
                Accepted Ride
              </Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-[#4285F4] mt-1">
                Estimated Time: {ride.duration_minutes} mins
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {/* Content - Ride Details */}
          <View className="flex-1 px-6">
            {/* Store Info */}
            <View className="flex-row items-center mb-4">
              <Image
                source={{ uri: storeData.image }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-base font-bold text-neutral-900"
                >
                  {storeData.name}
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-neutral-500">
                  @{storeData.username}
                </Text>
              </View>
            </View>
            {/* Pickup & Drop-off */}
            <View className="mb-4">
              <View className="flex-row items-start mb-2">
                <View className="items-center mr-3 mt-1">
                  <View className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  <View className="w-0.5 h-6 bg-gray-300 my-1" />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: "HankenGrotesk_700Bold" }}
                    className="text-base font-semibold text-neutral-900 mb-1"
                  >
                    Pickup
                  </Text>
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-xs text-neutral-600 leading-4"
                  >
                    {storeData.address}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-start">
                <View className="items-center mr-3 mt-1">
                  <View className="w-2.5 h-2.5 rounded-full bg-green-600" />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: "HankenGrotesk_700Bold" }}
                    className="text-base font-semibold text-neutral-900 mb-1"
                  >
                    Drop off Address
                  </Text>
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-xs text-neutral-600 leading-4"
                  >
                    {deliveryData.address}, {deliveryData.city}, {deliveryData.state}
                  </Text>
                </View>
              </View>
            </View>
            {/* Ride Details */}
            <View className="mb-5 flex-col gap-2">
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">
                  Payment:
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-bold text-sm">
                  ₦{ride.fare_amount}
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">
                  Courier Type:
                </Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="directions-bike" size={16} color="#F75F15" style={{ marginRight: 4 }} />
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-neutral-900 font-semibold text-sm"
                  >
                    {ride.courier_type || "Bike"}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">
                  Estimated Time:
                </Text>
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-neutral-900 font-semibold text-sm"
                >
                  {ride.duration_minutes} mins
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">
                  Distance:
                </Text>
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-neutral-900 font-semibold text-sm"
                >
                  {ride.distance_km} k/m
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">
                  Special Notes:
                </Text>
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-neutral-900 font-semibold text-sm"
                >
                  {ride.specialNotes || "N/A"}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-between mb-4">
              <TouchableOpacity
                onPress={handleCallSender}
                className="bg-[#FEEEE6] py-3 rounded-full w-[48%] justify-center flex-row gap-2 items-center"
              >
                <Ionicons name="call-outline" size={16} color={'#A53F0E'}/>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-[#A53F0E] font-semibold text-sm">
                  Call Sender
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCallRecipient}
                className="bg-[#F75F15] py-3 rounded-full w-[48%] justify-center flex-row gap-2 items-center ml-3"
              >
                <Ionicons name="call-outline" size={16} color={'white'}/>
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-white font-semibold text-sm"
                >
                  Call Recipient
                </Text>
              </TouchableOpacity>
            </View>

            {isPending ? (
              <View className="flex items-center gap-4 bg-[#F75F15] p-4 w-full rounded-full">
                <ActivityIndicator size={'small'} color={'white'}/>
              </View>
            ) : (
              <SolidMainButton 
                text={buttonText} 
                onPress={handleMarkForPickup}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default AcceptedRideDetailsBottomSheet