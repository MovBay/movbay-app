import type React from "react"
import { View, Text, TouchableOpacity, Modal, Image, Dimensions, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useAcceptOrderRide, useAcceptPackageRide } from "@/hooks/mutations/ridersAuth"
import { useToast } from "react-native-toast-notifications"

const { width } = Dimensions.get("window")

interface RideDetailsModalProps {
  isVisible: boolean
  onClose: () => void
  ride: any
  onAccept: (rideId: number) => void
  onDecline: () => void
}

const RideDetailsModal: React.FC<RideDetailsModalProps> = ({ 
  isVisible, 
  onClose, 
  ride, 
  onAccept, 
  onDecline
}) => {
  // Use order_id for orders, package_delivery_id for packages
  const acceptRideId = ride?.delivery_type === "Package" ? ride?.id : ride?.order?.order_id;
  const { mutate: acceptOrderRide, isPending: isOrderAccepting } = useAcceptOrderRide(acceptRideId)
  const { mutate: acceptPackageRide, isPending: isPackageAccepting } = useAcceptPackageRide(acceptRideId)
  const toast = useToast()

  console.log("Accepted Rides:", ride)

  if (!ride) return null

  // Helper function to get display data based on delivery type
  const getRideDisplayData = (ride: any) => {
    if (ride.delivery_type === "Package") {
      return {
        storeName: ride.package_delivery?.sender?.fullname || "Package Sender",
        storeUsername: ride.package_delivery?.sender?.username || "",
        storeImage: ride.package_delivery?.sender?.profile_picture || "",
        pickupAddress: ride.package_delivery?.pick_address || "Pickup Address",
        dropoffAddress: ride.package_delivery?.drop_address || "Drop-off Address",
        recipientName: ride.package_delivery?.recipient_name || "",
        packageType: ride.package_delivery?.package_type || "",
        packageDescription: ride.package_delivery?.package_description || "",
        additionalNotes: ride.package_delivery?.additional_notes || ""
      }
    } else {
      // Order delivery (existing logic)
      return {
        storeName: ride.order?.order_items[0]?.product?.store?.name || "Store",
        storeUsername: ride.order?.order_items[0]?.product?.store?.owner?.username || "",
        storeImage: ride.order?.order_items[0]?.product?.store?.store_image,
        pickupAddress: ride.order?.order_items[0]?.product?.store?.address1,
        dropoffAddress: `${ride.order?.delivery[0]?.delivery_address}, ${ride.order?.delivery[0]?.city}, ${ride.order?.delivery[0]?.state}` || "Delivery Address",
        recipientName: "",
        packageType: "",
        packageDescription: "",
        additionalNotes: ""
      }
    }
  }

  const displayData = getRideDisplayData(ride);

  const handleAcceptOrderRide = () => {
    const acceptData = {}
    acceptOrderRide(acceptData, {
      onSuccess: async (response) => {
        console.log("Order ride accepted successfully:", response)
        onAccept(ride.id)
        onClose()
        toast.show("Order ride accepted successfully!", { type: "success" })
      },
      onError: (error) => {
        console.error("Failed to accept order ride:", error)
        toast.show(`Failed to accept order ride: ${error.message || "Unknown error"}`, { type: "danger" })
      },
    })
  }

  const handleAcceptPackageRide = () => {
    const acceptData = {}
    acceptPackageRide(acceptData, {
      onSuccess: async (response) => {
        console.log("Package ride accepted successfully:", response)
        onAccept(ride.id)
        onClose()
        toast.show("Package ride accepted successfully!", { type: "success" })
      },
      onError: (error) => {
        console.error("Failed to accept package ride:", error)
        toast.show(`Failed to accept package ride: ${error.message || "Unknown error"}`, { type: "danger" })
      },
    })
  }

  // Determine which accept function to use based on delivery type
  const handleAccept = () => {
    if (ride.delivery_type === "Package") {
      handleAcceptPackageRide()
    } else {
      handleAcceptOrderRide()
    }
  }

  // Determine loading state based on delivery type
  const isAccepting = ride.delivery_type === "Package" ? isPackageAccepting : isOrderAccepting

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="bg-white rounded-3xl p-8 py-8 w-[93%] shadow-xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Image
                source={{ uri: displayData.storeImage }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-bold text-neutral-900">
                  {displayData.storeName}
                </Text>
                {displayData.storeUsername && (
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-neutral-500">
                    @{displayData.storeUsername}
                  </Text>
                )}
                {/* Show delivery type badge */}
              </View>
                <View className={`mt-1 px-3 py-1 rounded-full self-start ${ride.delivery_type === "Package" ? "bg-orange-100" : "bg-green-100"}`}>
                  <Text className={`text-xs font-semibold ${ride.delivery_type === "Package" ? "text-orange-700" : "text-green-700"}`}>
                    {ride.delivery_type === "Package" ? "Package" : "Order"}
                  </Text>
                </View>
            </View>
          </View>

          {/* Package Details (for package deliveries) */}
          {ride.delivery_type === "Package" && (
            <View className="mb-4 bg-green-50 p-3 rounded-2xl">
              <Text style={{ fontFamily: "HankenGrotesk_700Bold" }} className="text-sm font-bold text-green-950 mb-2">
                Package Info.
              </Text>
              {displayData.packageType && (
                <View className="flex-row justify-between mb-1">
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-900 text-xs">
                    Package Type:
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-green-900 text-xs font-bold">
                    {displayData.packageType}
                  </Text>
                </View>
              )}
              {displayData.packageDescription && (
                <View className="flex-row justify-between mb-1">
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-900 text-xs">
                    Description:
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-green-900 text-xs font-bold">
                    {displayData.packageDescription}
                  </Text>
                </View>
              )}
              {displayData.recipientName && (
                <View className="flex-row justify-between">
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-900 text-xs">
                    Recipient:
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-green-950 text-xs font-bold">
                    {displayData.recipientName}
                  </Text>
                </View>
              )}
            </View>
          )}

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
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-neutral-600 leading-4">
                  {displayData.pickupAddress}
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
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-neutral-600 leading-4">
                  {displayData.dropoffAddress}
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
                {ride.delivery_type === "Package" 
                  ? (displayData.additionalNotes || "N/A")
                  : (ride.specialNotes || "N/A")
                }
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between space-x-3">
            <TouchableOpacity
              onPress={onDecline}
              className="bg-orange-100 py-3 rounded-full flex-1 items-center"
              disabled={isAccepting}
            >
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-orange-600 font-semibold text-sm">
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              className="bg-[#F75F15] py-3 rounded-full flex-1 items-center ml-3 flex-row justify-center"
              disabled={isAccepting}
            >
              {isAccepting && (
                <ActivityIndicator 
                  size="small" 
                  color="white" 
                  style={{ marginRight: 8 }} 
                />
              )}
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white font-semibold text-sm">
                {isAccepting ? "" : `Accept ${ride.delivery_type === "Package" ? "Package" : "Order"}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default RideDetailsModal