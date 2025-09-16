import type React from "react"
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions, Image, RefreshControl } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { SolidMainButton } from "./btns/CustomButtoms"

const { height } = Dimensions.get("window")

interface ActiveRidesBottomSheetProps {
  isVisible: boolean
  onClose: () => void
  rides: any[]
  onSelectRide: (ride: any) => void
  onRefresh: () => void
  refreshing: boolean
}

const ActiveRidesBottomSheet: React.FC<ActiveRidesBottomSheetProps> = ({
  isVisible,
  onClose,
  rides,
  onSelectRide,
  onRefresh,
  refreshing,
}) => {

  console.log('Rides in Bottom Sheet:', rides);
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View style={{ height: height * 0.7 }} className="bg-neutral-50 rounded-t-3xl shadow-2xl">
          {/* Handle Bar */}
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-4" />
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 mb-6">
            <View>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-2xl font-bold text-neutral-900">
                New Rides
              </Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-neutral-500 mt-1">
                {rides.length} {rides.length === 1 ? "ride" : "rides"} available
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F75F15" />}
          >
            {rides.length === 0 ? (
              <View className="flex-1 justify-center items-center py-16">
                <View className="bg-gray-100 p-6 rounded-full mb-4">
                  <Ionicons name="bicycle" size={48} color="#9CA3AF" />
                </View>
                <Text
                  style={{ fontFamily: "HankenGrotesk_700Bold" }}
                  className="text-neutral-900 text-base font-semibold mb-2"
                >
                  No New Rides
                </Text>
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-neutral-500 text-sm text-center leading-5"
                >
                  When you have new rides available, they'll appear here for you to accept.
                </Text>
              </View>
            ) : (
              rides.map((ride, index) => (
                <View
                  key={ride.id}
                  className="bg-white border border-neutral-100 shadow-md rounded-2xl mb-4"
                  style={{ elevation: 0.9 }}
                >
                  {/* Ride Header */}
                  <View className="p-4 border-b border-neutral-100">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <Image
                          source={{ uri: ride.order?.order_items[0]?.product?.store?.store_image }}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <View className="flex-1">
                          <Text
                            style={{ fontFamily: "HankenGrotesk_500Medium" }}
                            className="text-neutral-900 font-bold text-base"
                          >
                            {ride.order?.order_items[0]?.product?.store?.name}
                          </Text>
                          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-500 text-xs">
                            @{ride.order?.order_items[0]?.product?.store?.owner?.username}
                          </Text>
                        </View>
                      </View>
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text
                          style={{ fontFamily: "HankenGrotesk_500Medium" }}
                          className="text-green-700 text-xs font-semibold"
                        >
                          New
                        </Text>
                      </View>
                    </View>
                  </View>
                  {/* Route Information */}
                  <View className="p-4">
                    {/* Ride Details */}
                    <View className="flex-row justify-between items-center mb-4">
                      <View className="flex-row gap-2 items-center">
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={16} color="#6B7280" />
                          <Text
                            style={{ fontFamily: "HankenGrotesk_500Medium" }}
                            className="text-neutral-600 text-sm ml-1"
                          >
                            {ride.duration_minutes} mins
                          </Text>
                        </View>
                        <MaterialIcons name="circle" size={6} color={"#AFAFAF"} />
                        <View className="flex-row items-center">
                          <MaterialIcons name="directions-bike" size={16} color="#6B7280" />
                          <Text
                            style={{ fontFamily: "HankenGrotesk_500Medium" }}
                            className="text-neutral-600 text-sm ml-1"
                          >
                            {ride.courier_type || "Bike"}
                          </Text>
                        </View>
                        <MaterialIcons name="circle" size={6} color={"#AFAFAF"} />
                        <View className="flex-row items-center">
                          <Ionicons name="locate-outline" size={16} color="#6B7280" />
                          <Text
                            style={{ fontFamily: "HankenGrotesk_500Medium" }}
                            className="text-neutral-600 text-sm ml-1"
                          >
                            {ride.distance_km} k/m
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        className="text-base font-bold text-green-800"
                      >
                        ₦{ride.fare_amount}
                      </Text>
                    </View>
                    <SolidMainButton text="View Ride" onPress={() => onSelectRide(ride)} />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
export default ActiveRidesBottomSheet
