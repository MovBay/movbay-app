import React from "react"
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const { height } = Dimensions.get("window")

interface ActiveRidesBottomSheetProps {
  isVisible: boolean
  onClose: () => void
  rides: any[] // Replace 'any' with a proper Ride type
  onSelectRide: (ride: any) => void
}

const ActiveRidesBottomSheet: React.FC<ActiveRidesBottomSheetProps> = ({ isVisible, onClose, rides, onSelectRide }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          style={{ height: height * 0.6 }}
          className="bg-white rounded-t-3xl p-6 shadow-lg"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xl font-bold text-neutral-900">
              Active Rides
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {rides.length === 0 ? (
              <View className="flex-1 justify-center items-center py-10">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-500 text-base">
                  No active rides available.
                </Text>
              </View>
            ) : (
              rides.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  className="bg-neutral-50 p-4 rounded-lg mb-3 border border-neutral-100"
                  onPress={() => onSelectRide(ride)}
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="person-circle-outline" size={24} color="#374151" />
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-semibold ml-2">
                      {ride.riderName}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm ml-2">
                      Pickup: {ride.pickupAddress}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="flag-outline" size={16} color="#6B7280" />
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm ml-2">
                      Drop-off: {ride.dropoffAddress}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-3">
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-lg font-bold text-green-600">
                      ₦{ride.payment}
                    </Text>
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-500 text-sm">
                      {ride.estimatedTime} mins
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default ActiveRidesBottomSheet