import React from "react"
import { View, Text, TouchableOpacity, Modal, Image, Dimensions } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

interface RideDetailsModalProps {
  isVisible: boolean
  onClose: () => void
  ride: any // Replace 'any' with a proper Ride type
  onAccept: (ride: any) => void
  onDecline: () => void
}

const RideDetailsModal: React.FC<RideDetailsModalProps> = ({ isVisible, onClose, ride, onAccept, onDecline }) => {
  if (!ride) return null

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-lg">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Image
              source={{ uri: ride.profileImage }}
              className="w-12 h-12 rounded-full mr-4"
            />
            <View>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-lg font-bold text-neutral-900">
                {ride.riderName}
              </Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-neutral-600">
                {ride.riderHandle}
              </Text>
            </View>
          </View>

          {/* Pickup & Drop-off */}
          <View className="mb-6">
            <View className="flex-row items-start mb-3">
              <View className="items-center mr-3">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <View className="w-0.5 h-8 bg-green-300 my-1" />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-semibold text-neutral-900">
                  Pickup
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-neutral-600">
                  {ride.pickupAddress}
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="items-center mr-3">
                <View className="w-3 h-3 rounded-full bg-green-500" />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-semibold text-neutral-900">
                  Drop off Address
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-neutral-600">
                  {ride.dropoffAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Ride Details */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">Payment:</Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-semibold text-sm">₦{ride.payment}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">Courier Type:</Text>
              <View className="flex-row items-center">
                <MaterialIcons name="directions-bike" size={18} color="#F75F15" className="mr-1" />
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-semibold text-sm">{ride.courierType}</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">Package Type:</Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-semibold text-sm">{ride.packageType}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">Estimated Time:</Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-semibold text-sm">{ride.estimatedTime} mins</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm">Special Notes:</Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-semibold text-sm">{ride.specialNotes}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={onDecline}
              className="bg-orange-100 py-3 rounded-full flex-1 mr-2 items-center"
            >
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-orange-700 font-semibold">
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onAccept(ride)}
              className="bg-[#F75F15] py-3 rounded-full flex-1 ml-2 items-center"
            >
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white font-semibold">
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default RideDetailsModal