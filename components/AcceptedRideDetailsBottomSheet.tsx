"use client"

import type React from "react"
import { View, Text, TouchableOpacity, Modal, Dimensions, Image, Linking, ActivityIndicator } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { SolidMainButton } from "./btns/CustomButtoms"
import { useToast } from "react-native-toast-notifications"
import { useCallback, useMemo } from "react"
import { useRouter } from "expo-router"
import { useOrderDelivered, useOrderPickedUp, usePackageDelivered, usePackagePickedUp } from "@/hooks/mutations/ridersAuth"

const { height } = Dimensions.get("window")

interface AcceptedRideDetailsBottomSheetProps {
  isVisible: boolean
  onClose: () => void
  ride: any | null
  onMarkForPickup: (ride: any) => void
  onRefetchMyRide: () => void
}

const AcceptedRideDetailsBottomSheet: React.FC<AcceptedRideDetailsBottomSheetProps> = ({
  isVisible,
  onClose,
  ride,
  onMarkForPickup,
  onRefetchMyRide,
}) => {
  const toast = useToast()
  const router = useRouter()

  const { mutate: markOrderForPickup, isPending: isOrderPickupPending } = useOrderPickedUp(ride?.order?.order_id)
  const { mutate: markOrderAsDelivered, isPending: isOrderDeliveryPending } = useOrderDelivered(ride?.order?.order_id)

  const { mutate: markPackageForPickup, isPending: isPackagePickupPending } = usePackagePickedUp(ride?.id)
  const { mutate: markPackageAsDelivered, isPending: isPackageDeliveryPending } = usePackageDelivered(ride?.package_delivery?.id)

  // Memoize computed values
  const orderStatus = useMemo(() => ride?.out_for_delivery, [ride?.out_for_delivery])
  const isCompleted = useMemo(() => ride?.completed === true, [ride?.completed])
  const isOutForDelivery = useMemo(() => orderStatus === true, [orderStatus])

  const buttonText = useMemo(() => {
    if (isCompleted) return "Ride Completed"
    return isOutForDelivery ? "Mark as Delivered" : "Mark for Pickup"
  }, [isOutForDelivery, isCompleted])

  // Fix: Define the correct pending states based on delivery type and current status
  const isPending = useMemo(() => {
    if (ride?.delivery_type === "Package") {
      return isOutForDelivery ? isPackageDeliveryPending : isPackagePickupPending
    } else {
      return isOutForDelivery ? isOrderDeliveryPending : isOrderPickupPending
    }
  }, [ride?.delivery_type, isOutForDelivery, isPackageDeliveryPending, isPackagePickupPending, isOrderDeliveryPending, isOrderPickupPending])

  // Memoize phone numbers to prevent unnecessary re-renders
  const senderPhone = useMemo(() => {
    if (ride?.delivery_type === "Package") {
      return ride?.package_delivery?.sender?.phone_number
    }
    return ride?.order?.store?.owner?.phone_number
  }, [ride?.delivery_type, ride?.package_delivery?.sender?.phone_number, ride?.order?.store?.owner?.phone_number])

  const recipientPhone = useMemo(() => {
    if (ride?.delivery_type === "Package") {
      return ride?.package_delivery?.recipient?.phone_number
    }
    return ride?.order?.buyer?.phone_number
  }, [ride?.delivery_type, ride?.package_delivery?.recipient?.phone_number, ride?.order?.buyer?.phone_number])

  // Helper function to get display data based on delivery type
  const getRideDisplayData = useMemo(() => {
    if (ride?.delivery_type === "Package") {
      return {
        storeName: ride.package_delivery?.sender?.fullname || "Package Delivery",
        storeUsername: ride.package_delivery?.sender?.username || "",
        storeImage: ride.package_delivery?.sender?.profile_picture,
        packageInfo: ride.package_delivery?.package_description || ride.package_delivery || "Package"
      }
    } else {
      // Order delivery (existing logic)
      return {
        storeName: ride?.order?.order_items?.[0]?.product?.store?.name || "Store",
        storeUsername: ride?.order?.order_items?.[0]?.product?.store?.owner?.username || "",
        storeImage: ride?.order?.order_items?.[0]?.product?.store?.store_image,
        packageInfo: null
      }
    }
  }, [ride])

  const addressData = useMemo(() => {
    if (ride?.delivery_type === "Package" && ride?.package_delivery) {
      return {
        pickup: ride.package_delivery.pickup_address || "Pickup address not available",
        dropoff: ride.package_delivery.dropoff_address || "Dropoff address not available",
      }
    } else {
      const storeAddress = ride?.order?.order_items?.[0]?.product?.store?.address1
      const deliveryAddress = ride?.order?.delivery?.[0]?.delivery_address
      const city = ride?.order?.delivery?.[0]?.city
      const state = ride?.order?.delivery?.[0]?.state
      
      return {
        pickup: storeAddress || "Store address not available",
        dropoff:
          deliveryAddress && city && state
            ? `${deliveryAddress}, ${city}, ${state}`
            : "Delivery address not available",
      }
    }
  }, [ride?.delivery_type, ride?.package_delivery, ride?.order])

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
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`,
      )
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          latitude: location.lat,
          longitude: location.lng,
        }
      } else {
        throw new Error("Address not found")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      throw error
    }
  }, [])

  const handleMarkForPickup = useCallback(async () => {
    try {
      if (isCompleted) {
        toast.show("This ride is already completed", { type: "info" })
        return
      }

      let fullAddress = ""

      // Check if it's a package delivery
      if (ride?.delivery_type === "Package" && ride?.package_delivery) {
        // For package delivery, use the dropoff address from package_delivery
        const dropoffAddress = ride.package_delivery.drop_address
        
        if (!dropoffAddress) {
          toast.show("Dropoff address not available for package delivery", { type: "warning" })
          return
        }
        
        fullAddress = dropoffAddress
        console.log("Package delivery - dropoff address:", fullAddress)
      } else {
        // For regular order delivery, use the existing logic
        const deliveryAddress = ride?.order?.delivery[0]?.delivery_address
        const city = ride?.order?.delivery[0]?.city
        const state = ride?.order?.delivery[0]?.state

        if (!deliveryAddress || !city || !state) {
          toast.show("Incomplete delivery address information", { type: "warning" })
          return
        }

        fullAddress = `${deliveryAddress}, ${city}, ${state}`
        console.log("Regular delivery - full address:", fullAddress)
      }

      const coordinates = await getCoordinatesFromAddress(fullAddress)

      console.log("This is full address", fullAddress)

      // Use the correct mutate function based on delivery type
      const mutateFunction = ride?.delivery_type === "Package" ? markPackageForPickup : markOrderForPickup

      mutateFunction(
        {
          dropoff_latitude: coordinates.latitude,
          dropoff_longitude: coordinates.longitude,
          address: fullAddress,
        },
        {
          onSuccess: async (data) => {
            toast.show("Ride marked for pickup successfully!", { type: "success" })

            // Refetch my ride data to update the UI
            onRefetchMyRide()
            onMarkForPickup(ride)
            onClose()
          },
          onError: (error: any) => {
            console.error("Request failed:", error)
            const errorMessage = `Failed to mark for pickup: ${error.message || "Unknown error"}`
            toast.show(errorMessage, { type: "danger" })
          },
        },
      )
    } catch (error: any) {
      console.error("Error processing request:", error)
      const errorMessage = `Error processing pickup: ${error.message || "Unknown error"}`
      toast.show(errorMessage, { type: "danger" })
    }
  }, [ride, getCoordinatesFromAddress, markOrderForPickup, markPackageForPickup, toast, onMarkForPickup, onClose, isCompleted, onRefetchMyRide])

  const handleMarkAsDelivered = useCallback(async () => {
    try {
      console.log("🚚 Starting mark as delivered process...")
      console.log("🚚 Ride data:", ride)

      if (isCompleted) {
        toast.show("This ride is already completed", { type: "info" })
        return
      }

      // Validate order ID first
      const orderId = ride?.order?.order_id || ride?.id
      if (!orderId) {
        console.error("🚚 Order/Package ID not found in ride data")
        toast.show("Order ID not found. Cannot mark as delivered.", { type: "danger" })
        return
      }

      console.log("🚚 Order/Package ID:", orderId)

      let fullAddress = ""

      // Check if it's a package delivery
      if (ride?.delivery_type === "Package" && ride?.package_delivery) {
        // For package delivery, use the dropoff address from package_delivery
        const dropoffAddress = ride.package_delivery.drop_address
        
        if (!dropoffAddress) {
          console.error("🚚 Dropoff address not available for package delivery")
          toast.show("Dropoff address not available for package delivery", { type: "warning" })
          return
        }
        
        fullAddress = dropoffAddress
        console.log("🚚 Package delivery - dropoff address:", fullAddress)
      } else {
        // For regular order delivery, use the existing logic
        const deliveryAddress = ride?.order?.delivery[0]?.delivery_address
        const city = ride?.order?.delivery[0]?.city
        const state = ride?.order?.delivery[0]?.state

        if (!deliveryAddress || !city || !state) {
          console.error("🚚 Incomplete delivery address:", { deliveryAddress, city, state })
          toast.show("Incomplete delivery address information", { type: "warning" })
          return
        }

        fullAddress = `${deliveryAddress}, ${city}, ${state}`
        console.log("🚚 Regular delivery - full address:", fullAddress)
      }

      // Get coordinates
      const coordinates = await getCoordinatesFromAddress(fullAddress)
      console.log("🚚 Delivery coordinates:", coordinates)

      const payload = {
        dropoff_latitude: coordinates.latitude,
        dropoff_longitude: coordinates.longitude,
        address: fullAddress,
      }
      
      console.log("🚚 Sending payload:", payload)

      // Use the correct mutate function based on delivery type
      const mutateFunction = ride?.delivery_type === "Package" ? markPackageAsDelivered : markOrderAsDelivered

      mutateFunction(payload, {
        onSuccess: async (data) => {
          console.log("🚚 Delivery marked successfully:", data)
          toast.show("Order marked as delivered! Please verify with recipient.", { type: "success" })

          // Refetch data to update UI
          await onRefetchMyRide()
          onClose()

          // Pass complete ride data to delivery code screen
          router.push({
            pathname: "/(access)/(rider_stacks)/deliveryCode",
            params: { 
              orderId: orderId,
              deliveryType: ride?.delivery_type,
              packageId: ride?.package_delivery?.id,
              rideData: JSON.stringify({
                delivery_type: ride?.delivery_type,
                order: ride?.order,
                package_delivery: ride?.package_delivery,
                fare_amount: ride?.fare_amount,
                duration_minutes: ride?.duration_minutes,
                distance_km: ride?.distance_km
              })
            },
          })
        },
        onError: (error: any) => {
          console.error("🚚 Delivery request failed:", error)

          // More detailed error handling
          let errorMessage = "Failed to mark as delivered"

          if (error?.response?.status === 404) {
            errorMessage = "Delivery endpoint not found. Please contact support."
          } else if (error?.response?.status === 400) {
            errorMessage = "Invalid request data. Please try again."
          } else if (error?.response?.status === 401) {
            errorMessage = "Authentication failed. Please login again."
          } else if (error?.response?.status === 403) {
            errorMessage = "You don't have permission to mark this order as delivered."
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message
          } else if (error?.message) {
            errorMessage = error.message
          }

          toast.show(errorMessage, { type: "danger" })
        },
      })
    } catch (error: any) {
      console.error("🚚 Error in mark as delivered process:", error)

      let errorMessage = "Error processing delivery"
      if (error?.message?.includes("Address not found")) {
        errorMessage = "Could not find delivery location. Please check the address."
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast.show(errorMessage, { type: "danger" })
    }
  }, [ride, getCoordinatesFromAddress, markOrderAsDelivered, markPackageAsDelivered, toast, onRefetchMyRide, onClose, isCompleted, router])

  const handleMainAction = useCallback(() => {
    if (isCompleted) return

    if (isOutForDelivery) {
      handleMarkAsDelivered()
    } else {
      handleMarkForPickup()
    }
  }, [isCompleted, isOutForDelivery, handleMarkAsDelivered, handleMarkForPickup])

  // Early return if no ride data - moved after all hooks
  if (!ride) return null

  const displayData = getRideDisplayData

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
                {isCompleted ? "Completed Ride" : "Accepted Ride"}
              </Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-green-800 mt-1">
                Estimated Time: {ride.duration_minutes} mins
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {/* Content - Ride Details */}
          <View className="flex-1 px-6">
            {/* Store/Sender Info */}
            <View className="flex-row items-center mb-4">
              <Image source={{ uri: displayData.storeImage }} className="w-10 h-10 rounded-full mr-3" />
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-base font-bold text-neutral-900"
                >
                  {displayData.storeName}
                </Text>
                {displayData.storeUsername && (
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-neutral-500">
                    @{displayData.storeUsername}
                  </Text>
                )}
                {/* Show package info for package deliveries */}
                {ride?.delivery_type === "Package" && displayData.packageInfo && (
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-700 text-xs mt-1">
                    📦 {displayData.packageInfo}
                  </Text>
                )}
              </View>

              {/* Status Badge */}
              <View
                className={`px-3 py-1 rounded-full ${
                  isCompleted 
                    ? "bg-gray-100" 
                    : isOutForDelivery 
                    ? "bg-green-100" 
                    : ride?.delivery_type === "Package" 
                    ? "bg-orange-100" 
                    : "bg-green-100"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isCompleted 
                      ? "text-gray-600" 
                      : isOutForDelivery 
                      ? "text-green-700" 
                      : ride?.delivery_type === "Package" 
                      ? "text-orange-600" 
                      : "text-green-700"
                  }`}
                >
                  {isCompleted 
                    ? "Completed" 
                    : isOutForDelivery 
                    ? "Out for Delivery" 
                    : ride?.delivery_type === "Package" 
                    ? "Package Accepted" 
                    : "Accepted"
                  }
                </Text>
              </View>
            </View>

            {/* Address Information */}
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
                    {addressData.pickup}
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
                    {addressData.dropoff}
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
            {!isCompleted && (
              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  onPress={handleCallSender}
                  className="bg-[#FEEEE6] py-3 rounded-full w-[48%] justify-center flex-row gap-2 items-center"
                >
                  <Ionicons name="call-outline" size={16} color={"#A53F0E"} />
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-[#A53F0E] font-semibold text-sm"
                  >
                    Call {ride?.delivery_type === "Package" ? "Sender" : "Store"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCallRecipient}
                  className="bg-[#F75F15] py-3 rounded-full w-[48%] justify-center flex-row gap-2 items-center ml-3"
                >
                  <Ionicons name="call-outline" size={16} color={"white"} />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white font-semibold text-sm">
                    Call {ride?.delivery_type === "Package" ? "Recipient" : "Customer"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isPending ? (
              <View className="flex-row justify-center items-center gap-4 bg-[#F75F15] p-4 w-full rounded-full">
                <ActivityIndicator size={"small"} color={"white"} />
              </View>
            ) : (
              <View className={isCompleted ? "opacity-50" : ""}>
                <SolidMainButton text={buttonText} onPress={isCompleted ? () => {} : handleMainAction} />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default AcceptedRideDetailsBottomSheet