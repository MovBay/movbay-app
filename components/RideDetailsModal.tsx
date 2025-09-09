import type React from "react"
import { View, Text, TouchableOpacity, Modal, Image, Dimensions, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useAcceptRide } from "@/hooks/mutations/ridersAuth"
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
  const { mutate: acceptRide, isPending: isAccepting } = useAcceptRide(ride?.order?.order_id)
  const toast = useToast()

    console.log("Accepted Rides:", ride)


  if (!ride) return null

  const handleAcceptRide = () => {
    const acceptData = {}
    acceptRide(acceptData, {
      onSuccess: async (response) => {
        console.log("Ride accepted successfully:", response)
        // Pass the ride id to parent component for storage
        onAccept(ride.id)
        onClose()
        toast.show("Ride accepted successfully!", { type: "success" })
      },
      onError: (error) => {
        console.error("Failed to accept ride:", error)
        toast.show(`Failed to accept ride: ${error.message || "Unknown error"}`, { type: "danger" })
      },
    })
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="bg-white rounded-3xl p-8 py-8 w-[90%] shadow-xl">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: ride.order?.order_items[0]?.product?.store?.store_image }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-bold text-neutral-900">
                {ride.order?.order_items[0]?.product?.store?.name}
              </Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-neutral-500">
                @{ride.order?.order_items[0]?.product?.store?.owner?.username}
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
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-neutral-600 leading-4">
                  {ride.order?.order_items[0]?.product?.store?.address1}
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
                  {ride.order?.delivery[0]?.delivery_address}, {ride.order?.delivery[0]?.city}, {ride.order?.delivery[0]?.state}
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
              onPress={handleAcceptRide}
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
                {isAccepting ? "Accepting..." : "Accept"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default RideDetailsModal